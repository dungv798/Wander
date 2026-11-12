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
 * Authentication framework (ADR-005): Spring Security with self-managed session tokens.
 * <ul>
 *   <li>Every {@code /api/**} needs a valid session, except {@link #PUBLIC_ROUTES} (create identity, recovery, device pairing).
 *       Paths outside {@code /api} (static UI, {@code /actuator/health}) need no session.</li>
 *   <li>No HTTP session and no cookie means nothing is 'attached automatically' to a request, so turning CSRF off is valid.
 *       If this ever moves to cookies (see ADR-005 'Where the session secret is kept') CSRF must be turned back on.</li>
 *   <li>Security/cache headers are set by {@code ResponseHeadersFilter} (single source, runs before this chain), so the
 *       default Spring Security headers are off to avoid overwriting the CSP and the UI's {@code Cache-Control}.</li>
 * </ul>
 */
@Configuration
public class SecurityConfig {

    private static final Pattern BEARER = Pattern.compile(IdentityApiConstants.BEARER_HEADER_REGEX);

    /** Single source of the list of public endpoints; used both for authorization and for skipping authentication. */
    private static final RequestMatcher PUBLIC_ROUTES = new OrRequestMatcher(
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_IDENTITY_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_RECOVERY_START_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_RECOVERY_COMPLETE_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_DEVICE_LINKS_PATTERN),
            publicRoute(HttpMethod.GET, IdentityApiConstants.PUBLIC_DEVICE_LINK_STATUS_PATTERN),
            publicRoute(HttpMethod.GET, IdentityApiConstants.PUBLIC_CATALOG_PATTERN),
            publicRoute(HttpMethod.POST, IdentityApiConstants.PUBLIC_INVITE_PREVIEW_PATTERN));

    /** Matcher of public paths by HTTP method and path pattern. */
    private static RequestMatcher publicRoute(HttpMethod method, String pattern) {
        return PathPatternRequestMatcher.withDefaults().matcher(method, pattern);
    }

    /**
     * Declared as a bean so that Spring Boot does not create a default user with a random generated password
     * (UserDetailsServiceAutoConfiguration backs off once there is an AuthenticationProvider): Wander has no password accounts.
     */
    @Bean
    public AuthenticationProvider sessionAuthenticationProvider(IdentityService identities) {
        return new SessionAuthenticationProvider(identities);
    }

    /** The API security filter chain: authenticates the session secret on every /api path except public routes; no session, no cookie. */
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

    /** Filter that reads the Bearer token on every /api path (except public routes) and authenticates through {@code manager}; failures answer 401 through {@code entryPoint}. */
    private static AuthenticationFilter buildSessionFilter(AuthenticationManager manager, AuthenticationEntryPoint entryPoint) {
        AuthenticationFilter filter = new AuthenticationFilter(manager, SecurityConfig::readBearerToken);
        // Public endpoints do not read Authorization: a stale or broken session sent along does not break identity creation or recovery.
        filter.setRequestMatcher(new AndRequestMatcher(
                PathPatternRequestMatcher.withDefaults().matcher(IdentityApiConstants.ALL_API_PATTERN), new NegatedRequestMatcher(PUBLIC_ROUTES)));
        filter.setFailureHandler(new AuthenticationEntryPointFailureHandler(entryPoint));
        filter.setSuccessHandler(continueChainOnSuccess());
        return filter;
    }

    /** Reads the session secret from the Authorization header; no header returns null so that authorization answers 401, a wrong shape is rejected. */
    private static Authentication readBearerToken(HttpServletRequest request) {
        String header = request.getHeader(IdentityApiConstants.HEADER_AUTHORIZATION);
        if (header == null) return null;
        Matcher matcher = BEARER.matcher(header);
        if (!matcher.matches()) throw new BadCredentialsException(IdentityApiConstants.AUTHORIZATION_FORMAT_INVALID);
        return BearerSessionToken.unauthenticated(matcher.group(1));
    }

    /**
     * The default of AuthenticationFilter is to redirect to the 'saved request' (302). The API only needs to continue the filter chain
     * after a successful authentication.
     */
    private static AuthenticationSuccessHandler continueChainOnSuccess() {
        return new AuthenticationSuccessHandler() {
            @Override
            public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                                Authentication authentication) {
                // does nothing: continuing is done by the method that has the FilterChain below
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
