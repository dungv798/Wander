package com.wander.planning.domain.model;

import java.time.Instant;
import java.util.UUID;

/** An invite link of a trip: it keeps only the HASH of the code (the 256-bit code is shown only once when created). */
public record TripInvite(UUID id, String codeHash, Instant createdAt, Instant expiresAt, Instant revokedAt) {

    /** Has it been revoked? */
    public boolean isRevoked() {
        return revokedAt != null;
    }

    /** Usable at time {@code now}: not revoked and not expired. */
    public boolean isActiveAt(Instant now) {
        return !isRevoked() && now.isBefore(expiresAt);
    }

    /** A copy revoked at {@code now} (unchanged if already revoked). */
    public TripInvite revoked(Instant now) {
        return isRevoked() ? this : new TripInvite(id, codeHash, createdAt, expiresAt, now);
    }
}
