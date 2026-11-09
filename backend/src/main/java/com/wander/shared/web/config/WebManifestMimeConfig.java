package com.wander.shared.web.config;

import com.wander.shared.web.constant.HttpConstants;
import org.springframework.boot.web.server.MimeMappings;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.server.servlet.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Đăng ký kiểu nội dung cho manifest ứng dụng web, vì máy chủ servlet không biết đuôi `.webmanifest` và mặc định trả `application/octet-stream`. */
@Configuration
public class WebManifestMimeConfig {

    /** Thêm ánh xạ đuôi `.webmanifest` → `application/manifest+json` vào máy chủ servlet (giữ nguyên các ánh xạ mặc định). */
    @Bean
    public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> webManifestMimeCustomizer() {
        return factory -> {
            MimeMappings mappings = new MimeMappings();
            mappings.add(HttpConstants.WEB_MANIFEST_EXTENSION, HttpConstants.WEB_MANIFEST_MEDIA_TYPE);
            factory.addMimeMappings(mappings);
        };
    }
}
