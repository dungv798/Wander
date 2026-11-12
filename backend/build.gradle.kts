// Wander backend — Java 21, Spring Boot 4, modular monolith (Clean Architecture + DDD + CQRS).
// Quyết định stack: docs/architecture/adr/ADR-002-java-spring-stack.md (PO duyệt 24/10/2026).
plugins {
    java
    id("org.springframework.boot") version "4.1.2"
    id("io.spring.dependency-management") version "1.1.7"
    jacoco
    // Cổng quy ước mã (ADR-013, backend-conventions.md): DOC-1 Javadoc, CON-* không chuỗi/số ma thuật, NAM-5, SIM-1
    checkstyle
}

group = "com.wander"
version = "0.1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Web (Spring MVC trên Tomcat), JPA/Hibernate, Flyway, Actuator (health check cho load balancer AWS)
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    // Khung xác thực (ADR-005): SecurityFilterChain + AuthenticationProvider; token phiên vẫn tự quản lý (Bearer, băm trong DB)
    implementation("org.springframework.boot:spring-boot-starter-security")
    // Bean Validation for typed request records and the generated OpenAPI contract (served outside the "free" profile only)
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // Ánh xạ entity ↔ domain sinh lúc biên dịch (ADR-008). Chỉ tầng infrastructure được dùng.
    implementation("org.mapstruct:mapstruct:1.6.3")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:testcontainers-postgresql")
    testImplementation("com.tngtech.archunit:archunit-junit5:1.4.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.compilerArgs.addAll(listOf("-parameters", "-Xlint:all,-processing,-serial"))
}

tasks.test {
    useJUnitPlatform()
    // Kho POI cả nước lớn hơn bản thử một vùng. Giữ cache context có giới hạn để các cấu hình IT
    // không giữ nhiều bản catalog/Hibernate trong heap mặc định 512 MB của test worker.
    maxHeapSize = "1g"
    systemProperty("spring.test.context.cache.maxSize", "2")
    // Kết quả từng test hiện ra log để đọc được khi chạy qua tools/dev.ps1
    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
        showStandardStreams = false
    }
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
    }
}

// Cổng độ phủ (ADR-013). Ngưỡng đặt theo mức ĐO ngày 27/10/2026 (jacocoTestReport.xml):
//  - toàn bộ: 98,0% dòng / 82,8% nhánh  → yêu cầu 90% / 70%;
//  - TỪNG gói domain và application: thấp nhất 94,1% dòng (identity.domain.rule) và 50,0% nhánh (catalog.application.query)
//    → yêu cầu 90% dòng / 50% nhánh cho mỗi gói. Nâng ngưỡng khi mức đo tăng bền vững; không hạ để cho qua.
// Lưu ý: với element BUNDLE, "includes" khớp TÊN BUNDLE chứ không phải tên lớp nên luật theo lớp/gói phải dùng PACKAGE.
tasks.jacocoTestCoverageVerification {
    dependsOn(tasks.test)
    violationRules {
        rule {
            element = "BUNDLE"
            limit { counter = "LINE"; minimum = "0.90".toBigDecimal() }
            limit { counter = "BRANCH"; minimum = "0.70".toBigDecimal() }
        }
        rule {
            element = "PACKAGE"
            includes = listOf("com.wander.*.domain.*", "com.wander.*.application.*")
            limit { counter = "LINE"; minimum = "0.90".toBigDecimal() }
            limit { counter = "BRANCH"; minimum = "0.50".toBigDecimal() }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}

// Cấu hình cổng quy ước: đọc config/checkstyle/*.xml; chỉ kiểm mã chính; vi phạm làm build đỏ
checkstyle {
    configDirectory = file("config/checkstyle")
    isIgnoreFailures = false
    maxWarnings = 0
}

tasks.checkstyleTest {
    enabled = false
}

tasks.bootJar {
    archiveFileName = "wander-backend.jar"
}

tasks.jar {
    enabled = false
}
