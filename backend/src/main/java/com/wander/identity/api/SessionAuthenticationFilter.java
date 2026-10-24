package com.wander.identity.api;

import com.wander.identity.application.IdentityService;
import com.wander.shared.kernel.AuthenticatedPrincipal;
import com.wander.shared.web.ApiError;
import com.wander.shared.web.CurrentPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/**
 * Xác thực bằng bí mật phiên dạng Bearer cho mọi đường /api/*, trừ các điểm cuối công khai
 * (tạo danh tính, khôi phục bằng mã, ghép thiết bị). Phiên được kiểm tra ở MỌI yêu cầu nên thu hồi có hiệu lực ngay.
 * <p>
 * Chưa dùng Spring Security: cơ chế hiện tại đơn giản và đang chờ duyệt thiết kế (RG-1, RG-6). Chuyển sang
 * Spring Security là một quyết định kiến trúc cần PO duyệt (xem docs/architecture/open-decisions.md).
 */
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private static final Pattern BEARER = Pattern.compile("^Bearer ([A-Za-z0-9_-]{20,128})$");

    private record PublicRoute(String method, Pattern path) {
    }

    private static final List<PublicRoute> PUBLIC = List.of(
            new PublicRoute("POST", Pattern.compile("^/api/identity$")),
            new PublicRoute("POST", Pattern.compile("^/api/recovery/start$")),
            new PublicRoute("POST", Pattern.compile("^/api/recovery/complete$")),
            new PublicRoute("POST", Pattern.compile("^/api/device-links$")),
            new PublicRoute("GET", Pattern.compile("^/api/device-links/[^/]+$")));

    private final IdentityService identities;
    private final ObjectMapper mapper;

    public SessionAuthenticationFilter(IdentityService identities, ObjectMapper mapper) {
        this.identities = identities;
        this.mapper = mapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) return true;
        return PUBLIC.stream().anyMatch(r -> r.method().equals(request.getMethod()) && r.path().matcher(path).matches());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        Matcher m = header == null ? null : BEARER.matcher(header);
        Optional<AuthenticatedPrincipal> principal = m != null && m.matches() ? identities.authenticate(m.group(1)) : Optional.empty();
        if (principal.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(mapper.writeValueAsString(ApiError.of("UNAUTHENTICATED", "Cần phiên hợp lệ.", null, null)));
            return;
        }
        CurrentPrincipal.set(request, principal.get());
        chain.doFilter(request, response);
    }
}
