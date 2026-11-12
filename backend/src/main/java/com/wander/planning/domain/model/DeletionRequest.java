package com.wander.planning.domain.model;

import com.wander.planning.domain.vocabulary.RequestStatus;
import java.time.Instant;
import java.util.UUID;

/** A request, sent by a member to the Organizer, to delete an item. {@code reason} is optional (an empty string if not given). */
public record DeletionRequest(UUID id, UUID itemId, UUID requesterMemberId, String reason, RequestStatus status, Instant requestedAt, Instant decidedAt) {

    /** Still waiting for a decision? */
    public boolean isPending() {
        return status == RequestStatus.PENDING;
    }

    /** A copy that was decided at {@code now}. */
    public DeletionRequest decided(RequestStatus newStatus, Instant now) {
        return new DeletionRequest(id, itemId, requesterMemberId, reason, newStatus, requestedAt, now);
    }
}
