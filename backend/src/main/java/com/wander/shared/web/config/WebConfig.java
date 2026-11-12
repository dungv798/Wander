package com.wander.shared.web.config;

import com.wander.shared.kernel.constant.CommonConstants;
import com.wander.shared.kernel.constant.ConfigConstants;
import com.wander.shared.web.constant.HttpConstants;
import com.wander.shared.web.filter.ContentSecurityPolicy;
import com.wander.shared.web.filter.RequestBodyLimitFilter;
import com.wander.shared.web.filter.RequestIdFilter;
import com.wander.shared.web.filter.ResponseHeadersFilter;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import com.wander.shared.web.request.CurrentPrincipal;
import io.micrometer.core.instrument.MeterRegistry;
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

/** Common web configuration: clock, caller address, rate limits, headers, argument resolvers and serving the static UI. */
@Configuration
@EnableConfigurationProperties(RateLimits.Properties.class)
public class WebConfig implements WebMvcConfigurer {

    private final String webDir;

    /** Takes the JSON tool and the built UI directory (empty = API only). */
    public WebConfig(@Value(ConfigConstants.WEB_DIR_EXPRESSION) String webDir) {
        this.webDir = webDir;
    }

    /** The system clock in UTC; tests replace it with a fake clock. */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    /**
     * The number of trusted proxies in front of the application (see {@link ClientAddress}). 0 = run directly, ignore X-Forwarded-For.
     * On AWS behind CloudFront -> ALB: set WANDER_TRUSTED_PROXY_HOPS=2 once the infrastructure locks the ALB to accept only from CloudFront.
     */
    @Bean
    public ClientAddress clientAddress(@Value(ConfigConstants.TRUSTED_PROXY_HOPS_EXPRESSION) int trustedProxyHops) {
        return new ClientAddress(trustedProxyHops);
    }

    /** The rate limiters according to the configuration. */
    @Bean
    public RateLimits rateLimits(RateLimits.Properties props, Clock clock, MeterRegistry meters) {
        return new RateLimits(props, clock, meters);
    }

    /** Gives every request an id (header, logging context, error bodies) and logs one line when it is handled; runs first. */
    @Bean
    public FilterRegistrationBean<RequestIdFilter> requestIdFilter() {
        FilterRegistrationBean<RequestIdFilter> registration = new FilterRegistrationBean<>(new RequestIdFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    /** The security/cache header filter, running right after the request-id filter. */
    @Bean
    public FilterRegistrationBean<ResponseHeadersFilter> responseHeadersFilter(@Value(HttpConstants.PHOTO_BASE_URL_EXPRESSION) String photoBaseUrl) {
        FilterRegistrationBean<ResponseHeadersFilter> registration =
                new FilterRegistrationBean<>(new ResponseHeadersFilter(ContentSecurityPolicy.forPhotoBaseUrl(photoBaseUrl)));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1);
        return registration;
    }

    /** Caps request bodies of the API (413 above the limit); runs right after the response-header filter. */
    @Bean
    public FilterRegistrationBean<RequestBodyLimitFilter> requestBodyLimitFilter() {
        FilterRegistrationBean<RequestBodyLimitFilter> registration = new FilterRegistrationBean<>(new RequestBodyLimitFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 2);
        return registration;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentPrincipal());
    }

    /**
     * The venue-catalog photos (ADR-010) are always served from the classpath. When {@code wander.web.dir} is set (for example ../web/dist),
     * the built UI is also served from the same origin as the API (local runs and e2e). On AWS the UI is expected to be on
     * S3 + CloudFront (a proposal, not yet approved).
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(StaticWebConstants.PHOTO_URL_PATTERN)
                .addResourceLocations(StaticWebConstants.PHOTO_CLASSPATH_LOCATION)
                .setCacheControl(CacheControl.maxAge(StaticWebConstants.PHOTO_CACHE_DURATION).cachePublic().immutable());
        webRoot().ifPresent(root -> registry.addResourceHandler(StaticWebConstants.ALL_PATHS_PATTERN)
                .addResourceLocations(new FileSystemResource(root + CommonConstants.SLASH))
                .resourceChain(false)
                .addResolver(new SpaFallbackResolver(root)));
    }

    /**
     * '/' has an empty resource path so ResourceHttpRequestHandler answers 404 before reaching the resolver;
     * forward internally to /index.html.
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        webRoot().ifPresent(root -> registry.addViewController(StaticWebConstants.ROOT_PATH)
                .setViewName(StaticWebConstants.INDEX_FORWARD_VIEW));
    }

    /** The built UI directory if it is configured and is a real directory; otherwise none (API only). */
    private Optional<Path> webRoot() {
        if (webDir == null || webDir.isBlank()) return Optional.empty();
        Path root = Path.of(webDir).toAbsolutePath().normalize();
        return Files.isDirectory(root) ? Optional.of(root) : Optional.empty();
    }

    /** If the file exists it is returned; any other UI path (not /api) returns index.html. */
    static final class SpaFallbackResolver extends PathResourceResolver {
        private final Path root;

        /** Creates the resolver for the UI directory {@code root}. */
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
            String fileName = Path.of(resourcePath).getFileName().toString();
            if (resourcePath.startsWith(HttpConstants.ASSETS_PATH_PREFIX.substring(1))
                    || fileName.contains(StaticWebConstants.FILE_EXTENSION_SEPARATOR)) return null;
            Resource index = new FileSystemResource(root.resolve(StaticWebConstants.INDEX_FILE_NAME));
            return index.isReadable() ? index : null;
        }
    }
}
