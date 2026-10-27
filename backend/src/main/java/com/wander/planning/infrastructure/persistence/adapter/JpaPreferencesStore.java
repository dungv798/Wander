package com.wander.planning.infrastructure.persistence.adapter;

import com.wander.planning.domain.port.PreferencesStore;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.planning.infrastructure.persistence.mapper.TripMapper;
import com.wander.planning.infrastructure.persistence.repository.OwnerPreferencesJpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/** Cài đặt JPA của cổng {@link PreferencesStore}: một dòng cho mỗi chủ, thay thế nguyên khối. */
@Repository
public class JpaPreferencesStore implements PreferencesStore {

    private final OwnerPreferencesJpaRepository preferences;
    private final TripMapper mapper;

    /** Nhận repository của bảng sở thích và bộ ánh xạ (dùng lại cách mã hóa danh sách sở thích của chuyến). */
    public JpaPreferencesStore(OwnerPreferencesJpaRepository preferences, TripMapper mapper) {
        this.preferences = preferences;
        this.mapper = mapper;
    }

    @Override
    public void saveInterests(UUID ownerId, List<TripInterest> interests, Instant now) {
        preferences.upsert(ownerId, mapper.interestCodes(interests), now);
    }
}
