package com.wander.planning.infrastructure.persistence.adapter;

import com.wander.planning.domain.model.ChecklistItem;
import com.wander.planning.domain.port.ChecklistRepository;
import com.wander.planning.infrastructure.persistence.entity.ChecklistItemEntity;
import com.wander.planning.infrastructure.persistence.repository.ChecklistItemJpaRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

/** Implements the checklist port with JPA; maps both ways between the entity and the domain object. */
@Repository
public class JpaChecklistRepository implements ChecklistRepository {

    private final ChecklistItemJpaRepository jpa;

    /** Takes the Spring Data repository. */
    public JpaChecklistRepository(ChecklistItemJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<ChecklistItem> listOf(UUID tripId) {
        return jpa.findAllOfTrip(tripId).stream().map(JpaChecklistRepository::toDomain).toList();
    }

    @Override
    public Optional<ChecklistItem> find(UUID tripId, UUID itemId) {
        return jpa.findOfTrip(tripId, itemId).map(JpaChecklistRepository::toDomain);
    }

    @Override
    public int countOf(UUID tripId) {
        return (int) jpa.countByTripId(tripId);
    }

    @Override
    public int nextPosition(UUID tripId) {
        Integer max = jpa.maxPosition(tripId);
        return max == null ? 0 : max + 1;
    }

    @Override
    public void save(ChecklistItem item) {
        ChecklistItemEntity entity = jpa.findById(item.id()).orElseGet(() -> {
            ChecklistItemEntity created = new ChecklistItemEntity(item.id());
            created.setTripId(item.tripId());
            created.setCreatedAt(item.createdAt());
            created.setPosition(item.position());
            return created;
        });
        entity.setGroupTitle(item.group());
        entity.setTitle(item.title());
        Map<UUID, java.time.Instant> wanted = item.completions();
        entity.getCompletions().removeIf(c -> !wanted.containsKey(c.getPersonId()));
        Map<UUID, java.time.Instant> have = entity.getCompletions().stream().collect(Collectors.toMap(ChecklistItemEntity.Completion::getPersonId, ChecklistItemEntity.Completion::getDoneAt));
        wanted.forEach((person, at) -> {
            if (!have.containsKey(person)) entity.getCompletions().add(new ChecklistItemEntity.Completion(person, at));
        });
        jpa.save(entity);
    }

    @Override
    public boolean delete(UUID tripId, UUID itemId) {
        Optional<ChecklistItemEntity> found = jpa.findOfTrip(tripId, itemId);
        found.ifPresent(jpa::delete);
        return found.isPresent();
    }

    /** The domain item from an entity. */
    private static ChecklistItem toDomain(ChecklistItemEntity e) {
        Map<UUID, java.time.Instant> completions = new LinkedHashMap<>();
        e.getCompletions().stream().sorted(java.util.Comparator.comparing(ChecklistItemEntity.Completion::getDoneAt))
                .forEach(c -> completions.put(c.getPersonId(), c.getDoneAt()));
        return new ChecklistItem(e.getId(), e.getTripId(), e.getGroupTitle(), e.getTitle(), e.getPosition(), e.getCreatedAt(), completions);
    }
}
