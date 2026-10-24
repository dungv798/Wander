package com.wander.planning.infrastructure.persistence;

import com.wander.planning.domain.CostInfo;
import com.wander.planning.domain.DateRange;
import com.wander.planning.domain.Item;
import com.wander.planning.domain.ItemType;
import com.wander.planning.domain.Trip;
import com.wander.planning.domain.TripRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Repository;

/**
 * Adapter (Clean Architecture): cài đặt cổng {@link TripRepository} bằng JPA/Hibernate.
 * Ánh xạ hai chiều domain ↔ entity; entity nạp trong cùng giao dịch được Hibernate theo dõi (managed),
 * nên {@link #save} chỉ cần chép trạng thái vào và Hibernate tự sinh UPDATE/INSERT/DELETE khi flush.
 */
@Repository
public class JpaTripRepository implements TripRepository {

    private final EntityManager em;

    public JpaTripRepository(EntityManager em) {
        this.em = em;
    }

    @Override
    public Optional<Trip> findOwned(UUID tripId, UUID ownerId) {
        List<TripEntity> found = em.createQuery("""
                        select distinct t from TripEntity t left join fetch t.items
                        where t.id = :id and t.ownerIdentityId = :owner""", TripEntity.class)
                .setParameter("id", tripId)
                .setParameter("owner", ownerId)
                .getResultList();
        return found.stream().findFirst().map(JpaTripRepository::toDomain);
    }

    @Override
    public void save(Trip trip) {
        TripEntity e = em.find(TripEntity.class, trip.id());
        if (e == null) {
            e = new TripEntity(trip.id());
            e.setOwnerIdentityId(trip.ownerId());
            e.setCreatedAt(trip.createdAt());
            copy(trip, e);
            em.persist(e);
            return;
        }
        if (e.getVersion() != trip.version()) {
            throw new ObjectOptimisticLockingFailureException(TripEntity.class, trip.id());
        }
        copy(trip, e);
        // Mọi thay đổi mục cũng tăng version của chuyến: aggregate là đơn vị nhất quán (và đơn vị khóa).
        em.lock(e, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
    }

    private static void copy(Trip trip, TripEntity e) {
        e.setName(trip.name());
        e.setDestination(trip.destination());
        e.setStartDate(trip.range().start());
        e.setEndDate(trip.range().end());
        e.setUpdatedAt(trip.updatedAt());

        Map<UUID, ItemEntity> existing = e.getItems().stream()
                .collect(Collectors.toMap(ItemEntity::getId, Function.identity()));
        Set<UUID> keep = new HashSet<>();
        for (Item item : trip.items()) {
            keep.add(item.id());
            ItemEntity ie = existing.get(item.id());
            if (ie == null) {
                ie = new ItemEntity(item.id(), e);
                ie.setCreatedAt(item.createdAt());
                e.getItems().add(ie);
            }
            copy(item, ie);
        }
        e.getItems().removeIf(ie -> !keep.contains(ie.getId())); // orphanRemoval ⇒ DELETE (xóa vĩnh viễn)
    }

    private static void copy(Item item, ItemEntity ie) {
        ie.setDayDate(item.day());
        ie.setPosition(item.position());
        ie.setType(item.type().code());
        ie.setTitle(item.title());
        ie.setTimeOfDay(item.timeOfDay());
        ie.setDurationMin(item.durationMin());
        ie.setNote(item.note());
        ie.setCostK(item.cost().costK());
        ie.setIncluded(item.cost().included());
        ie.setReferenceK(item.cost().referenceK());
        ie.setDeletedAt(item.deletedAt());
        ie.setUpdatedAt(item.updatedAt());
        Set<ItemEntity.Completion> wanted = item.completions().entrySet().stream()
                .map(en -> new ItemEntity.Completion(en.getKey(), en.getValue()))
                .collect(Collectors.toSet());
        if (!wanted.equals(ie.getCompletions())) {
            ie.getCompletions().clear();
            ie.getCompletions().addAll(wanted);
        }
    }

    private static Trip toDomain(TripEntity e) {
        List<Item> items = e.getItems().stream().map(JpaTripRepository::toDomain).toList();
        return new Trip(e.getId(), e.getOwnerIdentityId(), e.getName(), e.getDestination(),
                new DateRange(e.getStartDate(), e.getEndDate()), e.getCreatedAt(), e.getUpdatedAt(), e.getVersion(), items);
    }

    private static Item toDomain(ItemEntity ie) {
        Map<UUID, java.time.Instant> completions = new HashMap<>();
        for (ItemEntity.Completion c : ie.getCompletions()) completions.put(c.getPersonId(), c.getDoneAt());
        ItemType type = ItemType.fromCode(ie.getType())
                .orElseThrow(() -> new IllegalStateException("Unknown item type in database: " + ie.getType()));
        return new Item(ie.getId(), ie.getDayDate(), ie.getPosition(), type, ie.getTitle(), ie.getTimeOfDay(),
                ie.getDurationMin(), ie.getNote(), new CostInfo(ie.getCostK(), ie.isIncluded(), ie.getReferenceK()),
                ie.getDeletedAt(), ie.getCreatedAt(), ie.getUpdatedAt(), completions);
    }
}
