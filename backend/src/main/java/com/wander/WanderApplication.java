package com.wander;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Wander — modular monolith. Hai bounded context: {@code identity} (danh tính ẩn danh, phiên, khôi phục)
 * và {@code planning} (chuyến, ngày, mục). Ranh giới module và tầng được kiểm tra tự động bằng ArchUnit
 * (src/test/java/com/wander/ArchitectureTest.java).
 */
@SpringBootApplication
public class WanderApplication {

    public static void main(String[] args) {
        SpringApplication.run(WanderApplication.class, args);
    }
}
