package com.wander.planning.domain.model;

import com.wander.planning.domain.vocabulary.MemberRole;
import java.time.Instant;
import java.util.UUID;

/**
 * One person in a trip. {@code id} is the member id (public within the trip, used to tag an item as 'added by'); {@code identityId} is the
 * anonymous identity and NEVER leaves through the API. {@code displayName} is self-declared by that person, not verified.
 */
public record TripMember(UUID id, UUID identityId, MemberRole role, String displayName, Instant joinedAt) {

    /** A copy with a new display name. */
    public TripMember withDisplayName(String newName) {
        return new TripMember(id, identityId, role, newName, joinedAt);
    }
}
