package com.wander.identity.api.security;

import com.wander.identity.api.constant.IdentityApiConstants;
import com.wander.identity.application.service.IdentityService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.AuthenticationEntryPointFailureHandler;
import org.springframework.security.web.authentication.AuthenticationFilter;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.AndRequestMatcher;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import tools.jackson.databind.ObjectMapper;

/**
 * Khung xác thực (ADR-005): Spring Security với token phiên tự quản lý.
 * <ul>
 *   <li>Mọi {@code /api/**} cần phiên hợp lệ, trừ {@link #PUBLIC_ROUTES} (tạo danh tính, khôi phục, ghép thiết bị).
 *       Đường dẫn không phải {@code /api} (giao diện tĩnh, {@code /actuator/health}) không cần phiên.</li>
 *   <li>Không session HTTP, không cookie ⇒ không có thông tin xác thực "tự gắn" nên tắt CSRF là hợp lệ.
 *       Nếu sau này chuyển sang cookie (xem ADR-005 "Nơi lưu bí mật phiên") phải bật lại CSRF.</li>
 *   <li>Header bảo mật/cache do {@code ResponseHeadersFilter} đặt (một nguồn duy nhất, chạy trước chuỗi này), nên tắt
 *       header mặc định của Spring Security để không ghi đè CSP và {@code Cache-Control} của giao diện.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    private static final Pattern BEARER = Pattern.compile(IdentityApiConstants.BEARER_HEADER_REGEX);

    /** Nguồn duy nhất của danh sách điểm cuối công khai; dùng cho cả phân quyền lẫn việc bỏ qua xác thực. */
    private static final RequestMatcher PUBLIC_ROUTES = new OrRequestMatcher(
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_IDENTITY_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_RECOVERY_START_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_RECOVERY_COMPLETE_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_DEVICE_LINKS_PATTERN),
            publicRoute(HttpMethod.GET, IdentityApiConstants.PUBLIC_DEVICE_LINK_STATUS_PATTERN),
            publicRoute(HttpMethod.GET, IdentityApiConstants.PUBLIC_CATALOG_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_INVITE_PREVIEW_PATTERN));

    /** Bộ khớp đường dẫn công khai theo phương thức HTTP và mẫu đường dẫn. */
    private static RequestMatcher publicRoute(HttpMethod method, String pattern) {
        return PathPatternRequestMatcher.withDefaults().matcher(method, pattern);
    }

    /**
     * Khai báo thành bean để Spring Boot không tự tạo người dùng mặc định có mật khẩu sinh ngẫu nhiên
     * (UserDetailsServiceAutoConfiguration lùi lại khi đã có AuthenticationProvider): Wander không có tài khoản mật khẩu.
     */
    @Bean
    public AuthenticationProvider sessionAuthenticationProvider(IdentityService identities) {
        return new SessionAuthenticationProvider(identities);
    }

    /** Chuỗi lọc bảo mật của API: xác thực bí mật phiên cho mọi /api trừ route công khai, không session, không cookie. */
    @Bean
    public SecurityFilterChain apiSecurity(HttpSecurity http, AuthenticationProvider sessionProvider, ObjectMapper mapper)
            throws Exception {
        AuthenticationEntryPoint entryPoint = new JsonAuthenticationEntryPoint(mapper);
        AuthenticationFilter sessionFilter = buildSessionFilter(new ProviderManager(sessionProvider), entryPoint);
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .headers(headers -> headers.disable())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .logout(logout -> logout.disable())
                .requestCache(cache -> cache.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handling -> handling.authenticationEntryPoint(entryPoint))
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers(PUBLIC_ROUTES).permitAll()
                        .requestMatchers(IdentityApiConstants.ALL_API_PATTERN).authenticated()
                        .anyRequest().permitAll())
                .addFilterBefore(sessionFilter, AnonymousAuthenticationFilter.class);
        return http.build();
    }

    /** Bộ lọc đọc Bearer ở mọi /api (trừ route công khai) và xác thực qua {@code manager}; lỗi trả 401 bằng {@code entryPoint}. */
    private static AuthenticationFilter buildSessionFilter(AuthenticationManager manager, AuthenticationEntryPoint entryPoint) {
        AuthenticationFilter filter = new AuthenticationFilter(manager, SecurityConfig::readBearerToken);
        // Điểm cuối công khai không đọc Authorization: phiên cũ/hỏng gửi kèm không làm hỏng việc tạo danh tính hay khôi phục.
        filter.setRequestMatcher(new AndRequestMatcher(
                PathPatternRequestMatcher.withDefaults().matcher(IdentityApiConstants.ALL_API_PATTERN), new NegatedRequestMatcher(PUBLIC_ROUTES)));
        filter.setFailureHandler(new AuthenticationEntryPointFailureHandler(entryPoint));
        filter.setSuccessHandler(continueChainOnSuccess());
        return filter;
    }

    /** Đọc bí mật phiên từ header Authorization; không có header thì trả null để bước phân quyền trả 401, sai dạng thì từ chối. */
    private static Authentication readBearerToken(HttpServletRequest request) {
        String header = request.getHeader(IdentityApiConstants.HEADER_AUTHORIZATION);
        if (header == null) return null;
        Matcher matcher = BEARER.matcher(header);
        if (!matcher.matches()) throw new BadCredentialsException(IdentityApiConstants.AUTHORIZATION_FORMAT_INVALID);
        return BearerSessionToken.unauthenticated(matcher.group(1));
    }

    /**
     * Mặc định của AuthenticationFilter là chuyển hướng tới "yêu cầu đã lưu" (302). API chỉ cần đi tiếp chuỗi lọc
     * sau khi xác thực thành công.
     */
    private static AuthenticationSuccessHandler continueChainOnSuccess() {
        return new AuthenticationSuccessHandler() {
            @Override
            public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                                Authentication authentication) {
                // không làm gì: việc đi tiếp nằm ở phương thức có FilterChain bên dưới
            }

            @Override
            public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                                FilterChain chain, Authentication authentication)
                    throws IOException, ServletException {
                chain.doFilter(request, response);
            }
        };
    }
}
