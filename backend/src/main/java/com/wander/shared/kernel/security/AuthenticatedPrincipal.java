package com.wander.shared.kernel.security;

import java.util.UUID;

/**
 * The authenticated identity of the current request. Created by the identity module; the planning module only reads
 * identityId (the trip owner) without depending on the identity module.
 */
public record AuthenticatedPrincipal(UUID identityId, UUID sessionId) {
}
