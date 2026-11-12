package com.wander.planning.infrastructure.persistence.adapter;

import com.wander.planning.domain.port.PreferencesStore;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.planning.infrastructure.persistence.mapper.TripMapper;
import com.wander.planning.infrastructure.persistence.repository.OwnerPreferencesJpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/** The JPA implementation of the {@link PreferencesStore} port: one row per owner, replaced as a whole. */
@Repository
public class JpaPreferencesStore implements PreferencesStore {

    private final OwnerPreferencesJpaRepository preferences;
    private final TripMapper mapper;

    /** Takes the repository of the preferences table and the mapper (reusing the trip's way of encoding a list of interests). */
    public JpaPreferencesStore(OwnerPreferencesJpaRepository preferences, TripMapper mapper) {
        this.preferences = preferences;
        this.mapper = mapper;
    }

    @Override
    public void saveInterests(UUID ownerId, List<TripInterest> interests, Instant now) {
        preferences.upsert(ownerId, mapper.interestCodes(interests), now);
    }
}
