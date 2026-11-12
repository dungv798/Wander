package com.wander.planning.domain.port;

import com.wander.planning.domain.vocabulary.TripInterest;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * The storage port of preferences by identity (BE-10). Preferences belong to the owner (identity), not to one trip, so they follow the user to another device.
 * Planning has no foreign key into the identity table (the two bounded contexts keep their own data, ADR-003).
 */
public interface PreferencesStore {

    /** Replaces all of the owner's preferences with the normalized list (empty = clear). Idempotent. */
    void saveInterests(UUID ownerId, List<TripInterest> interests, Instant now);
}
