package com.wander.planning.domain.port;

import com.wander.planning.domain.model.Trip;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * The port that stores the Trip aggregate. The domain defines it, infrastructure (JPA) implements it.
 * Someone else's trip is returned as if it did not exist (INV-6): it does not reveal that the trip exists.
 */
public interface TripRepository {

    /** A VISIBLE trip by id of which this person is a member (any role), with all its items; an outsider and a deleted trip count as absent (404, INV-6). */
    Optional<Trip> findAccessible(UUID tripId, UUID identityId);

    /** A SOFT-DELETED trip of exactly the owner (for restoring); {@link #findOwned} does not return a deleted trip. */
    Optional<Trip> findOwnedDeleted(UUID tripId, UUID ownerId);

    /** The visible trip that an invite link (by code hash) belongs to - including an expired/revoked link, the domain itself decides whether it can be used. */
    Optional<Trip> findByInviteHash(String codeHash);

    /** Saves the trip (insert or update); a version mismatch throws an optimistic-lock error. */
    void save(Trip trip);

    /** The names of every trip of the owner, by trip id; used to choose a name that does not clash (DR-006). */
    Map<UUID, String> tripNamesOf(UUID ownerId);
}
