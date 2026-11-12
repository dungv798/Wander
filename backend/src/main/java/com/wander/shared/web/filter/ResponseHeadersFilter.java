package com.wander.shared.web.filter;

import com.wander.shared.web.constant.HttpConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Header bảo mật và cache. API: không cache. Giao diện: CSP chặt (không script ngoài), chống nhúng khung;
 * tệp có băm trong /assets/ được cache lâu, index.html thì không.
 */
public class ResponseHeadersFilter extends OncePerRequestFilter {

    private final String contentSecurityPolicy;

    /** @param contentSecurityPolicy value of the CSP header sent with UI responses (see {@link ContentSecurityPolicy}) */
    public ResponseHeadersFilter(String contentSecurityPolicy) {
        this.contentSecurityPolicy = contentSecurityPolicy;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        response.setHeader(HttpConstants.HEADER_X_CONTENT_TYPE_OPTIONS, HttpConstants.VALUE_NOSNIFF);
        // HSTS: trình duyệt chỉ áp dụng khi nhận qua HTTPS (bỏ qua trên http://localhost). TLS kết thúc ở CloudFront nên
        // header này do ứng dụng đặt cho mọi phản hồi; không includeSubDomains/preload để không ràng buộc tên miền khác.
        response.setHeader(HttpConstants.HEADER_STRICT_TRANSPORT_SECURITY, HttpConstants.VALUE_HSTS);
        if (path.startsWith(HttpConstants.API_PATH_PREFIX)) {
            response.setHeader(HttpConstants.HEADER_CACHE_CONTROL, HttpConstants.VALUE_CACHE_NO_STORE);
        } else if (!path.startsWith(HttpConstants.ACTUATOR_PATH_PREFIX)) {
            applyUiHeaders(response, path);
        }
        chain.doFilter(request, response);
        if (response.getStatus() >= HttpConstants.CLIENT_ERROR_STATUS_MIN) {
            response.setHeader(HttpConstants.HEADER_CACHE_CONTROL, HttpConstants.VALUE_CACHE_NO_STORE);
        }
    }

    /** Header cho giao diện: chống nhúng khung, CSP chặt, cache lâu cho tệp có băm, còn lại phải xác nhận lại. */
    private void applyUiHeaders(HttpServletResponse response, String path) {
        response.setHeader(HttpConstants.HEADER_X_FRAME_OPTIONS, HttpConstants.VALUE_DENY);
        response.setHeader(HttpConstants.HEADER_REFERRER_POLICY, HttpConstants.VALUE_NO_REFERRER);
        response.setHeader(HttpConstants.HEADER_CONTENT_SECURITY_POLICY, contentSecurityPolicy);
        boolean isHashedAsset = path.startsWith(HttpConstants.ASSETS_PATH_PREFIX);
        response.setHeader(HttpConstants.HEADER_CACHE_CONTROL,
                isHashedAsset ? HttpConstants.VALUE_CACHE_IMMUTABLE_ASSET : HttpConstants.VALUE_CACHE_NO_CACHE);
    }
}
