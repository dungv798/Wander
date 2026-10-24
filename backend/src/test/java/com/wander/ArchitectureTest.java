package com.wander;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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

    @BeforeAll
    static void importClasses() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.wander");
    }

    @Test
    @DisplayName("domain là Java thuần: không Spring, không JPA, không Jackson, không servlet")
    void domainIsPure() {
        classes().that().resideInAPackage("..domain..")
                .should().onlyDependOnClassesThat().resideInAnyPackage("java..", "com.wander..domain..", "com.wander.shared.kernel..")
                .check(classes);
    }

    @Test
    @DisplayName("application không phụ thuộc infrastructure, api hay web")
    void applicationDoesNotDependOnOuterLayers() {
        noClasses().that().resideInAPackage("..application..")
                .should().dependOnClassesThat().resideInAnyPackage("..infrastructure..", "..api..", "com.wander.shared.web..",
                        "jakarta.persistence..", "jakarta.servlet..", "org.springframework.web..")
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
    @DisplayName("bounded context planning không phụ thuộc identity")
    void planningIndependentOfIdentity() {
        noClasses().that().resideInAPackage("com.wander.planning..")
                .should().dependOnClassesThat().resideInAPackage("com.wander.identity..")
                .check(classes);
    }

    @Test
    @DisplayName("bounded context identity không phụ thuộc planning")
    void identityIndependentOfPlanning() {
        noClasses().that().resideInAPackage("com.wander.identity..")
                .should().dependOnClassesThat().resideInAPackage("com.wander.planning..")
                .check(classes);
    }

    @Test
    @DisplayName("shared không phụ thuộc module nghiệp vụ nào")
    void sharedIsShared() {
        noClasses().that().resideInAPackage("com.wander.shared..")
                .should().dependOnClassesThat().resideInAnyPackage("com.wander.identity..", "com.wander.planning..")
                .check(classes);
    }

    @Test
    @DisplayName("CQRS: phía đọc (query) không dùng aggregate repository của phía ghi")
    void queriesDoNotLoadAggregates() {
        noClasses().that().resideInAPackage("..application.query..")
                .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository")
                .check(classes);
    }
}
