package com.wander.planning.application.command;

import java.util.UUID;

/** Deletion-request commands (H2). {@code actor} always comes from the session. */
public final class RequestCommands {

    private RequestCommands() {
    }

    /** A member asks to delete an item that belongs to someone else. */
    public record Submit(UUID actor, UUID tripId, String itemId, String reason) {
    }

    /** The requester withdraws a pending request. */
    public record Cancel(UUID actor, UUID tripId, UUID requestId) {
    }

    /** The organizer approves ({@code approve} = true) or rejects a request. */
    public record Decide(UUID actor, UUID tripId, UUID requestId, boolean approve) {
    }
}
