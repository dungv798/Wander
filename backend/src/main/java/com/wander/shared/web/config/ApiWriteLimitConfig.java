package com.wander.shared.web.config;

import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.web.constant.HttpConstants;
import com.wander.shared.web.ratelimit.RateLimits;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Giới hạn request ghi đã xác thực trước khi MVC đọc body và chạy lệnh; lỗi dùng cùng advice trả JSON 429. */
@Configuration
public class ApiWriteLimitConfig implements WebMvcConfigurer {

    private final RateLimits limits;

    /** Dùng bộ đếm chung của một instance, tách khỏi quota công khai và quota xác thực. */
    public ApiWriteLimitConfig(RateLimits limits) {
        this.limits = limits;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                if (isReadOnly(request.getMethod()) || isSessionRevocation(request)) return true;
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.isAuthenticated()
                        && authentication.getPrincipal() instanceof AuthenticatedPrincipal principal) {
                    limits.write(principal.identityId().toString());
                }
                return true;
            }
        }).addPathPatterns(HttpConstants.ALL_API_PATHS).excludePathPatterns(HttpConstants.WRITE_BUDGET_EXEMPT_PATHS);
    }

    /**
     * Thu hồi phiên (DELETE /api/sessions/{id}) không tốn ngân sách ghi: đây là phản ứng phòng vệ của chủ, kẻ giữ một phiên
     * không được dùng ngân sách chung để chặn chủ thu hồi phiên đó.
     */
    private static boolean isSessionRevocation(HttpServletRequest request) {
        return HttpMethod.DELETE.matches(request.getMethod()) && request.getRequestURI().startsWith(HttpConstants.SESSIONS_PATH_PREFIX);
    }

    /** GET, HEAD và OPTIONS không bị đếm vào ngân sách thao tác ghi. */
    private static boolean isReadOnly(String method) {
        return HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method) || HttpMethod.OPTIONS.matches(method);
    }
}
