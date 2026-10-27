package com.wander.identity.api.security;

import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import java.util.List;
import org.springframework.security.authentication.AbstractAuthenticationToken;

/**
 * Thông tin xác thực của một yêu cầu. Trước khi xác thực: mang bí mật phiên (Bearer) làm credentials.
 * Sau khi xác thực: mang {@link AuthenticatedPrincipal}, không còn credentials. Không có quyền (authorities):
 * Lát 1a chỉ có một vai trò (chủ chuyến), việc kiểm tra "chuyến của ai" nằm ở domain/application.
 */
final class BearerSessionToken extends AbstractAuthenticationToken {

    private final String token;
    private final AuthenticatedPrincipal principal;

    private BearerSessionToken(String token, AuthenticatedPrincipal principal) {
        super(List.of());
        this.token = token;
        this.principal = principal;
    }

    /** Thông tin xác thực chưa kiểm tra, mang bí mật phiên lấy từ header. */
    static BearerSessionToken unauthenticated(String token) {
        return new BearerSessionToken(token, null);
    }

    /** Thông tin xác thực đã kiểm tra, mang danh tính và phiên (không còn bí mật). */
    static BearerSessionToken authenticated(AuthenticatedPrincipal principal) {
        BearerSessionToken authenticated = new BearerSessionToken(null, principal);
        authenticated.setAuthenticated(true);
        return authenticated;
    }

    @Override
    public Object getCredentials() {
        return token;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }
}
