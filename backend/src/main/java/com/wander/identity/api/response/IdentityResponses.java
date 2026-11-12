package com.wander.identity.api.response;

import com.wander.identity.application.view.IdentityViews;
import java.util.List;

/** Response bodies of the identity API that wrap a list under a key (the other endpoints return their read model directly). */
public final class IdentityResponses {

    private IdentityResponses() {
    }

    /** The active sessions (devices) of the identity. */
    public record SessionsResponse(List<IdentityViews.SessionView> sessions) {
    }
}
