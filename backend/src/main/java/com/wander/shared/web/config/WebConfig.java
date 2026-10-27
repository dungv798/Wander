package com.wander.shared.web.config;

import com.wander.shared.kernel.constant.CommonConstants;
import com.wander.shared.kernel.constant.ConfigConstants;
import com.wander.shared.web.constant.HttpConstants;
import com.wander.shared.web.filter.ResponseHeadersFilter;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import com.wander.shared.web.request.CurrentPrincipal;
import com.wander.shared.web.request.JsonBodyArgumentResolver;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;
import tools.jackson.databind.ObjectMapper;

/** Cấu hình web chung: đồng hồ, địa chỉ người gọi, giới hạn tần suất, header, bộ đọc tham số và phục vụ giao diện tĩnh. */
@Configuration
@EnableConfigurationProperties(RateLimits.Properties.class)
public class WebConfig implements WebMvcConfigurer {

    private final ObjectMapper mapper;
    private final String webDir;

    /** Nhận công cụ JSON và thư mục giao diện đã build (rỗng = chỉ chạy API). */
    public WebConfig(ObjectMapper mapper, @Value(ConfigConstants.WEB_DIR_EXPRESSION) String webDir) {
        this.mapper = mapper;
        this.webDir = webDir;
    }

    /** Đồng hồ hệ thống theo UTC; test thay bằng đồng hồ giả. */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    /**
     * Số proxy tin cậy trước ứng dụng (xem {@link ClientAddress}). 0 = chạy trực tiếp, bỏ qua X-Forwarded-For.
     * Trên AWS sau CloudFront → ALB: đặt WANDER_TRUSTED_PROXY_HOPS=2 khi hạ tầng đã khóa ALB chỉ nhận từ CloudFront.
     */
    @Bean
    public ClientAddress clientAddress(@Value(ConfigConstants.TRUSTED_PROXY_HOPS_EXPRESSION) int trustedProxyHops) {
        return new ClientAddress(trustedProxyHops);
    }

    /** Ba bộ giới hạn tần suất theo cấu hình. */
    @Bean
    public RateLimits rateLimits(RateLimits.Properties props, Clock clock) {
        return new RateLimits(props, clock);
    }

    /** Bộ lọc header bảo mật/cache, chạy đầu tiên trong chuỗi bộ lọc. */
    @Bean
    public FilterRegistrationBean<ResponseHeadersFilter> responseHeadersFilter() {
        FilterRegistrationBean<ResponseHeadersFilter> registration = new FilterRegistrationBean<>(new ResponseHeadersFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new JsonBodyArgumentResolver(mapper));
        resolvers.add(new CurrentPrincipal());
    }

    /**
     * Ảnh kho địa điểm (ADR-010) luôn được phục vụ từ classpath. Khi đặt {@code wander.web.dir} (ví dụ ../web/dist),
     * phục vụ thêm giao diện đã build cùng nguồn gốc với API (chạy cục bộ và e2e). Trên AWS, giao diện dự kiến nằm ở
     * S3 + CloudFront (đề xuất, chưa duyệt).
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(StaticWebConstants.PHOTO_URL_PATTERN)
                .addResourceLocations(StaticWebConstants.PHOTO_CLASSPATH_LOCATION)
                .setCacheControl(CacheControl.maxAge(StaticWebConstants.PHOTO_CACHE_DURATION).cachePublic());
        webRoot().ifPresent(root -> registry.addResourceHandler(StaticWebConstants.ALL_PATHS_PATTERN)
                .addResourceLocations(new FileSystemResource(root + CommonConstants.SLASH))
                .resourceChain(false)
                .addResolver(new SpaFallbackResolver(root)));
    }

    /**
     * "/" có đường dẫn tài nguyên rỗng nên ResourceHttpRequestHandler trả 404 trước khi tới resolver;
     * chuyển tiếp nội bộ sang /index.html.
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        webRoot().ifPresent(root -> registry.addViewController(StaticWebConstants.ROOT_PATH)
                .setViewName(StaticWebConstants.INDEX_FORWARD_VIEW));
    }

    /** Thư mục giao diện đã build nếu đã cấu hình và là thư mục thật; ngược lại không có (chỉ chạy API). */
    private Optional<Path> webRoot() {
        if (webDir == null || webDir.isBlank()) return Optional.empty();
        Path root = Path.of(webDir).toAbsolutePath().normalize();
        return Files.isDirectory(root) ? Optional.of(root) : Optional.empty();
    }

    /** Tệp có thật thì trả tệp; đường dẫn giao diện khác (không phải /api) trả index.html. */
    static final class SpaFallbackResolver extends PathResourceResolver {
        private final Path root;

        /** Tạo bộ phân giải cho thư mục giao diện {@code root}. */
        SpaFallbackResolver(Path root) {
            this.root = root;
        }

        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            if (resourcePath.startsWith(HttpConstants.API_RESOURCE_PREFIX)
                    || resourcePath.startsWith(HttpConstants.ACTUATOR_RESOURCE_PREFIX)) {
                return null;
            }
            Resource found = resourcePath.isEmpty() ? null : super.getResource(resourcePath, location);
            if (found != null) return found;
            Resource index = new FileSystemResource(root.resolve(StaticWebConstants.INDEX_FILE_NAME));
            return index.isReadable() ? index : null;
        }
    }
}
