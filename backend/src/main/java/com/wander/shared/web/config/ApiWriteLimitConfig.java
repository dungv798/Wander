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

/** Limits authenticated write requests before MVC reads the body and runs the command; the error uses the same advice that returns the JSON 429. */
@Configuration
public class ApiWriteLimitConfig implements WebMvcConfigurer {

    private final RateLimits limits;

    /** Uses the counter shared by one instance, separate from the public quota and the authentication quota. */
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
     * Revoking a session (DELETE /api/sessions/{id}) costs no write budget: it is the owner's defensive reaction, and someone holding a session
     * must not be able to use the shared budget to stop the owner from revoking that session.
     */
    private static boolean isSessionRevocation(HttpServletRequest request) {
        return HttpMethod.DELETE.matches(request.getMethod()) && request.getRequestURI().startsWith(HttpConstants.SESSIONS_PATH_PREFIX);
    }

    /** GET, HEAD and OPTIONS are not counted into the write-operation budget. */
    private static boolean isReadOnly(String method) {
        return HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method) || HttpMethod.OPTIONS.matches(method);
    }
}
