package com.wander.planning.application.command;

import java.util.UUID;

/** Membership and invite-link commands (slice 1b). {@code actor} is always the identity of the session, NEVER a value from the body. */
public final class MembershipCommands {

    private MembershipCommands() {
    }

    /** An organizer creates a new invite link. */
    public record CreateInvite(UUID actor, UUID tripId) {
    }

    /** An organizer revokes the active invite link. */
    public record RevokeInvite(UUID actor, UUID tripId) {
    }

    /** Join a trip with an invite code and a display name. */
    public record Join(UUID actor, String code, String displayName) {
    }

    /** An organizer removes a member. */
    public record RemoveMember(UUID actor, UUID tripId, UUID memberId) {
    }

    /** A member leaves a trip. */
    public record Leave(UUID actor, UUID tripId) {
    }

    /** Change one's own display name. */
    public record RenameSelf(UUID actor, UUID tripId, String displayName) {
    }
}
