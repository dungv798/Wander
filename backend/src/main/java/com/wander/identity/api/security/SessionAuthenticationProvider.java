package com.wander.identity.api.security;

import com.wander.identity.api.constant.IdentityApiConstants;
import com.wander.identity.application.service.IdentityService;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;

/**
 * Xác thực bí mật phiên bằng {@link IdentityService#authenticateSession}. Gọi ở MỌI yêu cầu cần phiên (không cache,
 * không JWT tự chứa) nên phiên bị thu hồi mất hiệu lực ở yêu cầu kế tiếp.
 */
final class SessionAuthenticationProvider implements AuthenticationProvider {

    private final IdentityService identities;

    /** Nhận dịch vụ danh tính dùng để tra phiên. */
    SessionAuthenticationProvider(IdentityService identities) {
        this.identities = identities;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String token = (String) authentication.getCredentials();
        return identities.authenticateSession(token)
                .<Authentication>map(BearerSessionToken::authenticated)
                .orElseThrow(() -> new BadCredentialsException(IdentityApiConstants.SESSION_INVALID));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return BearerSessionToken.class.isAssignableFrom(authentication);
    }
}
