plugins {
    // Tự tải JDK 21 nếu máy chỉ có JDK khác (toolchain trong build.gradle.kts yêu cầu Java 21).
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "wander-backend"
