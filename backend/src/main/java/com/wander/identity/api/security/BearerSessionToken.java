package com.wander.identity.api.security;

import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import java.util.List;
import org.springframework.security.authentication.AbstractAuthenticationToken;

/**
 * Authentication details of a request. Before authentication it carries the session secret (Bearer) as credentials.
 * After authentication it carries the {@link AuthenticatedPrincipal} and no credentials. There are no authorities:
 * Slice 1a has a single role (trip owner); the check of 'whose trip is this' lives in the domain/application layer.
 */
final class BearerSessionToken extends AbstractAuthenticationToken {

    private final String token;
    private final AuthenticatedPrincipal principal;

    private BearerSessionToken(String token, AuthenticatedPrincipal principal) {
        super(List.of());
        this.token = token;
        this.principal = principal;
    }

    /** Unchecked authentication details carrying the session secret taken from the header. */
    static BearerSessionToken unauthenticated(String token) {
        return new BearerSessionToken(token, null);
    }

    /** Checked authentication details carrying the identity and the session (the secret is gone). */
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
