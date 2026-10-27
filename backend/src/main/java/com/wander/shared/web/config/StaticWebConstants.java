package com.wander.shared.web.config;

import java.time.Duration;

/** Hằng số riêng của chức năng phục vụ giao diện tĩnh và ảnh kho địa điểm ({@link WebConfig}). */
final class StaticWebConstants {

    /** Mẫu đường dẫn ảnh kho địa điểm (ADR-010). */
    static final String PHOTO_URL_PATTERN = "/catalog/photos/**";

    /** Vị trí ảnh kho địa điểm trong classpath. */
    static final String PHOTO_CLASSPATH_LOCATION = "classpath:/catalog/photos/";

    /** Thời gian cache công khai của ảnh kho địa điểm. */
    static final Duration PHOTO_CACHE_DURATION = Duration.ofDays(1);

    /** Mẫu khớp mọi đường dẫn còn lại (dành cho giao diện). */
    static final String ALL_PATHS_PATTERN = "/**";

    /** Đường dẫn gốc của trang. */
    static final String ROOT_PATH = "/";

    /** Tệp vào của giao diện. */
    static final String INDEX_FILE_NAME = "index.html";

    /** Tên view chuyển tiếp nội bộ tới tệp vào của giao diện. */
    static final String INDEX_FORWARD_VIEW = "forward:/index.html";

    private StaticWebConstants() {
    }
}
