package com.wander.planning.application.query;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * The read port (the Query side of CQRS): returns flat data rows, never loads the aggregate.
 * Implemented with JPQL in infrastructure. The read side can be optimized on its own (indexes, views, cache) without touching the domain.
 */
public interface TripReadModel {

    /** A trip by id of exactly this owner; someone else's trip counts as absent. */
    Optional<TripRow> findTrip(UUID tripId, UUID ownerId);

    /** The owner's trips, newest first (start date descending, then creation time descending). */
    List<TripRow> listTrips(UUID ownerId);

    /** The role of an identity in a visible trip; empty if not a member or the trip is deleted. */
    Optional<String> roleIn(UUID tripId, UUID identityId);

    /** The member id of an identity in a visible trip. */
    Optional<UUID> memberIdIn(UUID tripId, UUID identityId);

    /** The checklist items of the trip by group then position. */
    List<ChecklistRow> checklist(UUID tripId);

    /** Every member of the trip, in the order they joined. */
    List<MemberRow> members(UUID tripId);

    /** Every deletion request of the trip, oldest first. */
    List<RequestRow> deletionRequests(UUID tripId);

    /** The trip's invite link that is not revoked, if any. */
    Optional<InviteRow> unrevokedInvite(UUID tripId);

    /** Preview of an invite link that is still usable at {@code now}; a wrong, expired, revoked code or a deleted trip all return empty. */
    Optional<InvitePreviewRow> previewInvite(String codeHash, java.time.Instant now);

    /** The owner's soft-deleted trips, most recently deleted first. */
    List<TripRow> listDeletedTrips(UUID ownerId);

    /** Every item (including soft-deleted), by day then manual order. */
    List<ItemRow> items(UUID tripId);

    /** One item of the trip by id (including soft-deleted). */
    Optional<ItemRow> item(UUID tripId, UUID itemId);

    /** Soft-deleted items, most recently deleted first. */
    List<ItemRow> trash(UUID tripId);

    /** Preferences by identity as a comma-separated string of codes; an empty string if not set. */
    String interestPreferences(UUID ownerId);

    /** Completion by item: item id -> the identity ids of those who finished (used only internally to convert to member ids). */
    java.util.Map<UUID, List<UUID>> completions(UUID tripId);

    /** The ids of the items this person marked as done. */
    Set<UUID> doneItemIds(UUID tripId, UUID personId);
}
