package com.wander.shared.web;

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

    static final String CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
            + "connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        response.setHeader("X-Content-Type-Options", "nosniff");
        if (path.startsWith("/api/")) {
            response.setHeader("Cache-Control", "no-store");
        } else if (!path.startsWith("/actuator/")) {
            response.setHeader("X-Frame-Options", "DENY");
            response.setHeader("Referrer-Policy", "no-referrer");
            response.setHeader("Content-Security-Policy", CSP);
            response.setHeader("Cache-Control", path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache");
        }
        chain.doFilter(request, response);
    }
}
