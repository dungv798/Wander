package com.wander.shared.web.config;

import com.wander.shared.web.constant.HttpConstants;
import org.springframework.boot.web.server.MimeMappings;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.server.servlet.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Registers the content type of the web app manifest, because the servlet container does not know the `.webmanifest` extension and answers `application/octet-stream` by default. */
@Configuration
public class WebManifestMimeConfig {

    /** Adds the mapping `.webmanifest` -> `application/manifest+json` to the servlet container (keeping the default mappings). */
    @Bean
    public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> webManifestMimeCustomizer() {
        return factory -> {
            MimeMappings mappings = new MimeMappings();
            mappings.add(HttpConstants.WEB_MANIFEST_EXTENSION, HttpConstants.WEB_MANIFEST_MEDIA_TYPE);
            factory.addMimeMappings(mappings);
        };
    }
}
