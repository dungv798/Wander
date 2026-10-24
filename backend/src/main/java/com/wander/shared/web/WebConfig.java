package com.wander.shared.web;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableConfigurationProperties(RateLimits.Properties.class)
public class WebConfig implements WebMvcConfigurer {

    private final ObjectMapper mapper;
    private final String webDir;

    public WebConfig(ObjectMapper mapper, @Value("${wander.web.dir:}") String webDir) {
        this.mapper = mapper;
        this.webDir = webDir;
    }

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public RateLimits rateLimits(RateLimits.Properties props, Clock clock) {
        return new RateLimits(props, clock);
    }

    @Bean
    public FilterRegistrationBean<ResponseHeadersFilter> responseHeadersFilter() {
        FilterRegistrationBean<ResponseHeadersFilter> reg = new FilterRegistrationBean<>(new ResponseHeadersFilter());
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return reg;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new JsonBodyArgumentResolver(mapper));
        resolvers.add(new CurrentPrincipal());
    }

    /**
     * Khi đặt {@code wander.web.dir} (ví dụ ../web/dist), phục vụ giao diện đã build cùng nguồn gốc với API
     * (dùng cho chạy cục bộ và e2e). Trên AWS, giao diện dự kiến nằm ở S3 + CloudFront (đề xuất, chưa duyệt).
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (webDir == null || webDir.isBlank()) return;
        Path root = Path.of(webDir).toAbsolutePath().normalize();
        if (!Files.isDirectory(root)) return;
        registry.addResourceHandler("/**")
                .addResourceLocations(new FileSystemResource(root.toString() + "/"))
                .resourceChain(false)
                .addResolver(new SpaFallbackResolver(root));
    }

    /**
     * "/" có đường dẫn tài nguyên rỗng nên ResourceHttpRequestHandler trả 404 trước khi tới resolver;
     * chuyển tiếp nội bộ sang /index.html.
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        if (webDir == null || webDir.isBlank() || !Files.isDirectory(Path.of(webDir))) return;
        registry.addViewController("/").setViewName("forward:/index.html");
    }

    /** Tệp có thật thì trả tệp; đường dẫn giao diện khác (không phải /api) trả index.html. */
    static final class SpaFallbackResolver extends PathResourceResolver {
        private final Path root;

        SpaFallbackResolver(Path root) {
            this.root = root;
        }

        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            if (resourcePath.startsWith("api/") || resourcePath.startsWith("actuator/")) return null;
            Resource found = resourcePath.isEmpty() ? null : super.getResource(resourcePath, location);
            if (found != null) return found;
            Resource index = new FileSystemResource(root.resolve("index.html"));
            return index.isReadable() ? index : null;
        }
    }
}
