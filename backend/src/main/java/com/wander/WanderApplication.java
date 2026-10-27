package com.wander;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Wander — modular monolith. Các bounded context: {@code identity} (danh tính ẩn danh, phiên, khôi phục),
 * {@code planning} (chuyến, ngày, mục) và {@code catalog} (kho địa điểm biên tập, chỉ đọc). Ranh giới module và tầng
 * được kiểm tra tự động bằng ArchUnit (src/test/java/com/wander/ArchitectureTest.java).
 */
@SpringBootApplication
public class WanderApplication {

    /** Điểm vào của ứng dụng: khởi động Spring Boot với tham số dòng lệnh. */
    public static void main(String[] args) {
        SpringApplication.run(WanderApplication.class, args);
    }
}
