package com.wander.identity.api.security;

import com.wander.identity.api.constant.IdentityApiConstants;
import com.wander.identity.application.service.IdentityService;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;

/**
 * Authenticates the session secret with {@link IdentityService#authenticateSession}. Called on EVERY request that needs a session (no cache,
 * no self-contained JWT), so a revoked session stops working on the very next request.
 */
final class SessionAuthenticationProvider implements AuthenticationProvider {

    private final IdentityService identities;

    /** Takes the identity service used to look the session up. */
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
