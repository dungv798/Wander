package com.wander;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Map;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.Mapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;

/**
 * Luật kiến trúc chạy như test: vi phạm Clean Architecture hay ranh giới module làm build đỏ.
 * Đây là "tài liệu kiến trúc có thể thực thi" — đọc file này để hiểu hệ thống được phép phụ thuộc thế nào.
 *
 * <pre>
 *   api  ──►  application  ──►  domain  ◄──  infrastructure
 *              (use case)       (thuần Java)   (JPA, adapter)
 *   identity ✕ planning  (hai bounded context không gọi trực tiếp nhau; chỉ dùng chung shared.kernel)
 * </pre>
 */
class ArchitectureTest {

    private static JavaClasses classes;
    private static JavaClasses mainAndTestClasses;

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.wander");
        mainAndTestClasses = new ClassFileImporter().importPackages("com.wander");
    }

    @Test
    @DisplayName("QA-4: không Thread.sleep trong cả mã chính lẫn test; chờ điều kiện bằng Awaitility")
    void noThreadSleep() {
        noClasses().should().callMethod(Thread.class, "sleep", long.class)
                .orShould().callMethod(Thread.class, "sleep", long.class, int.class)
                .orShould().callMethod(Thread.class, "sleep", java.time.Duration.class)
                .check(mainAndTestClasses);
    }

    @Test
    @DisplayName("domain là Java thuần: không Spring, không JPA, không Jackson, không servlet")
    void domainIsPure() {
        classes().that().resideInAPackage("..domain..")
                .should().onlyDependOnClassesThat().resideInAnyPackage("java..", "com.wander..domain..", "com.wander.shared.kernel..")
                .check(classes);
    }

    @Test
    @DisplayName("application không phụ thuộc infrastructure, api, web hay Spring Security (ADR-005) hay MapStruct (ADR-008)")
    void applicationDoesNotDependOnOuterLayers() {
        noClasses().that().resideInAPackage("..application..")
                .should().dependOnClassesThat().resideInAnyPackage("..infrastructure..", "..api..", "com.wander.shared.web..",
                        "jakarta.persistence..", "jakarta.servlet..", "org.springframework.web..", "org.springframework.security..", "org.mapstruct..")
                .check(classes);
    }

    @Test
    @DisplayName("infrastructure không phụ thuộc api")
    void infrastructureDoesNotDependOnApi() {
        noClasses().that().resideInAPackage("..infrastructure..")
                .should().dependOnClassesThat().resideInAPackage("..api..")
                .check(classes);
    }

    @Test
    @DisplayName("bounded context planning không phụ thuộc identity hay catalog")
    void planningIndependentOfOthers() {
        noClasses().that().resideInAPackage("com.wander.planning..")
                .should().dependOnClassesThat().resideInAnyPackage("com.wander.identity..", "com.wander.catalog..", "com.wander.rating..")
                .check(classes);
    }

    @Test
    @DisplayName("bounded context identity không phụ thuộc planning hay catalog")
    void identityIndependentOfOthers() {
        noClasses().that().resideInAPackage("com.wander.identity..")
                .should().dependOnClassesThat().resideInAnyPackage("com.wander.planning..", "com.wander.catalog..", "com.wander.rating..")
                .check(classes);
    }

    @Test
    @DisplayName("bounded context catalog (ADR-010) không phụ thuộc identity hay planning")
    void catalogIndependentOfOthers() {
        noClasses().that().resideInAPackage("com.wander.catalog..")
                .should().dependOnClassesThat().resideInAnyPackage("com.wander.identity..", "com.wander.planning..", "com.wander.rating..")
                .check(classes);
    }

    @Test
    @DisplayName("bounded context rating (DR-032) không phụ thuộc identity, planning hay catalog")
    void ratingIndependentOfOthers() {
        noClasses().that().resideInAPackage("com.wander.rating..")
                .should().dependOnClassesThat().resideInAnyPackage("com.wander.identity..", "com.wander.planning..", "com.wander.catalog..")
                .check(classes);
    }

    @Test
    @DisplayName("shared không phụ thuộc module nghiệp vụ nào")
    void sharedIsShared() {
        noClasses().that().resideInAPackage("com.wander.shared..")
                .should().dependOnClassesThat().resideInAnyPackage("com.wander.identity..", "com.wander.planning..", "com.wander.catalog..", "com.wander.rating..")
                .check(classes);
    }

    @Test
    @DisplayName("CQRS: phía đọc (query) không dùng aggregate repository của phía ghi")
    void queriesDoNotLoadAggregates() {
        noClasses().that().resideInAPackage("..application.query..")
                .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository")
                .check(classes);
    }

    // ---- Quy ước backend v1 (docs/architecture/backend-conventions.md), ARC-4…8, DOM-6, NAM-2 ----

    @Test
    @DisplayName("ARC-4: @Transactional chỉ ở application")
    void transactionalOnlyInApplication() {
        methods().that().areAnnotatedWith(Transactional.class)
                .should().beDeclaredInClassesThat().resideInAPackage("..application..")
                .check(classes);
        classes().that().areAnnotatedWith(Transactional.class)
                .should().resideInAPackage("..application..")
                .check(classes);
    }

    @Test
    @DisplayName("ARC-5: chỉ constructor injection, không @Autowired trên field")
    void noFieldInjection() {
        NO_CLASSES_SHOULD_USE_FIELD_INJECTION.check(classes);
    }

    @Test
    @DisplayName("ARC-6: không vòng phụ thuộc giữa các gói con (api, application, domain, infrastructure) của một module")
    void noCyclesInsideModules() {
        for (String module : new String[] {"identity", "planning", "catalog", "rating"}) {
            slices().matching("com.wander." + module + ".(*)..")
                    .should().beFreeOfCycles()
                    .check(classes);
        }
    }

    @Test
    @DisplayName("ARC-7: controller (api) không dùng Repository, gói persistence hay JPA")
    void controllersStayThin() {
        // Không khớp theo hậu tố "Entity": ResponseEntity của Spring cũng kết thúc bằng "Entity".
        noClasses().that().resideInAPackage("..api..")
                .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository")
                .orShould().dependOnClassesThat().resideInAPackage("..infrastructure.persistence..")
                .orShould().dependOnClassesThat().resideInAPackage("jakarta.persistence..")
                .check(classes);
    }

    @Test
    @DisplayName("ARC-8: entity JPA (*Entity trong com.wander) chỉ nằm ở infrastructure.persistence, và chỉ infrastructure dùng gói đó")
    void entitiesStayInInfrastructure() {
        classes().that().resideInAPackage("com.wander..").and().haveSimpleNameEndingWith("Entity")
                .should().resideInAPackage("..infrastructure.persistence..")
                .check(classes);
        noClasses().that().resideOutsideOfPackage("..infrastructure..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure.persistence..")
                .check(classes);
    }

    @Test
    @DisplayName("DOM-6: domain không tự đọc đồng hồ; thời gian đi vào qua tham số hoặc Clock được inject")
    void domainDoesNotReadTheClock() {
        noClasses().that().resideInAPackage("..domain..")
                .should().callMethod(Instant.class, "now")
                .orShould().callMethod(LocalDate.class, "now")
                .orShould().callMethod(LocalDateTime.class, "now")
                .orShould().callMethod(ZonedDateTime.class, "now")
                .orShould().callMethod(System.class, "currentTimeMillis")
                .check(classes);
    }

    @Test
    @DisplayName("NAM-2: đặt tên theo vai trò (controller ở api, entity, mapper ở infrastructure)")
    void namingFollowsRole() {
        classes().that().areAnnotatedWith(RestController.class)
                .should().haveSimpleNameEndingWith("Controller").andShould().resideInAPackage("..api..")
                .check(classes);
        classes().that().areAnnotatedWith(Mapper.class)
                .should().haveSimpleNameEndingWith("Mapper").andShould().resideInAPackage("..infrastructure..")
                .check(classes);
    }

    // ---- ARC-10: thư mục theo vai trò (không thêm lớp base) ----

    @Test
    @DisplayName("ARC-10: lớp lưu trữ nằm đúng thư mục con của persistence (entity, repository, mapper, adapter)")
    void persistenceFoldersFollowRole() {
        classes().that().resideInAPackage("com.wander..").and().haveSimpleNameEndingWith("Entity")
                .should().resideInAPackage("..persistence.entity..")
                .check(classes);
        classes().that().resideInAPackage("com.wander..").and().haveSimpleNameEndingWith("JpaRepository")
                .should().resideInAPackage("..persistence.repository..")
                .check(classes);
        classes().that().resideInAPackage("com.wander..").and().areAnnotatedWith(Mapper.class)
                .should().resideInAPackage("..persistence.mapper..")
                .check(classes);
        classes().that().resideInAPackage("com.wander..").and().haveSimpleNameStartingWith("Jpa")
                .should().resideInAPackage("..persistence.adapter..")
                .check(classes);
    }

    @Test
    @DisplayName("ARC-10: trong domain, enum nghiệp vụ ở vocabulary và cổng (interface) ở port")
    void domainFoldersFollowRole() {
        classes().that().resideInAPackage("com.wander..domain..").and().areEnums().and().areTopLevelClasses()
                .should().resideInAPackage("..domain.vocabulary..")
                .check(classes);
        classes().that().resideInAPackage("com.wander..domain..").and().areInterfaces()
                .should().resideInAPackage("..domain.port..")
                .check(classes);
    }

    @Test
    @DisplayName("ARC-10: api tách controller, constant, security; application tách view; mọi module cùng một mẫu")
    void apiAndApplicationFoldersFollowRole() {
        classes().that().areAnnotatedWith(RestController.class)
                .should().resideInAPackage("..api.controller..")
                .check(classes);
        classes().that().resideInAPackage("com.wander..").and().haveSimpleNameEndingWith("ApiConstants")
                .should().resideInAPackage("..api.constant..")
                .check(classes);
        classes().that().resideInAPackage("com.wander..").and().haveSimpleNameEndingWith("Views")
                .should().resideInAPackage("..application.view..")
                .check(classes);
        classes().that().resideInAPackage("com.wander..").and().haveSimpleNameEndingWith("Service")
                .and().resideInAPackage("..application..")
                .should().resideInAPackage("..application.service..")
                .check(classes);
    }

    @Test
    @DisplayName("API-1: controller methods exchange typed request/response records, never a Map or a raw JSON body")
    void controllersAreTyped() {
        methods().that().areDeclaredInClassesThat().areAnnotatedWith(RestController.class).and().arePublic()
                .should(new ArchCondition<JavaMethod>("not take or return a java.util.Map or a JsonBody") {
                    /** Flags a controller method whose return type or any parameter is a Map or called JsonBody. */
                    @Override
                    public void check(JavaMethod method, ConditionEvents events) {
                        boolean returnsMap = method.getRawReturnType().isAssignableTo(Map.class);
                        boolean takesMap = method.getRawParameterTypes().stream()
                                .anyMatch(type -> type.isAssignableTo(Map.class) || type.getSimpleName().equals("JsonBody"));
                        if (returnsMap || takesMap) {
                            events.add(SimpleConditionEvent.violated(method, method.getFullName() + " uses a Map or JsonBody in its signature"));
                        }
                    }
                })
                .check(classes);
    }
}
