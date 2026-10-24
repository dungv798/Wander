package com.wander.planning.infrastructure.persistence;

import com.wander.planning.application.query.ItemRow;
import com.wander.planning.application.query.TripReadModel;
import com.wander.planning.application.query.TripRow;
import jakarta.persistence.EntityManager;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Phía đọc bằng JPQL "constructor expression": chỉ lấy cột cần, trả record phẳng, không qua aggregate
 * và không bị Hibernate theo dõi (không dirty-checking) — rẻ hơn cho màn hình xem lịch.
 */
@Repository
public class JpaTripReadModel implements TripReadModel {

    private static final String TRIP_ROW = "select new com.wander.planning.application.query.TripRow("
            + "t.id, t.ownerIdentityId, t.name, t.destination, t.startDate, t.endDate, t.createdAt, t.updatedAt) "
            + "from TripEntity t ";

    private static final String ITEM_ROW = "select new com.wander.planning.application.query.ItemRow("
            + "i.id, i.trip.id, i.dayDate, i.position, i.type, i.title, i.timeOfDay, i.durationMin, i.note, "
            + "i.costK, i.included, i.referenceK, i.deletedAt, i.createdAt) from ItemEntity i ";

    private final EntityManager em;

    public JpaTripReadModel(EntityManager em) {
        this.em = em;
    }

    @Override
    public Optional<TripRow> findTrip(UUID tripId, UUID ownerId) {
        return em.createQuery(TRIP_ROW + "where t.id = :id and t.ownerIdentityId = :owner", TripRow.class)
                .setParameter("id", tripId)
                .setParameter("owner", ownerId)
                .getResultStream()
                .findFirst();
    }

    @Override
    public List<TripRow> listTrips(UUID ownerId) {
        return em.createQuery(TRIP_ROW + "where t.ownerIdentityId = :owner order by t.startDate desc, t.createdAt desc",
                        TripRow.class)
                .setParameter("owner", ownerId)
                .getResultList();
    }

    @Override
    public List<ItemRow> items(UUID tripId) {
        return em.createQuery(ITEM_ROW + "where i.trip.id = :trip order by i.dayDate, i.position, i.createdAt, i.id",
                        ItemRow.class)
                .setParameter("trip", tripId)
                .getResultList();
    }

    @Override
    public Optional<ItemRow> item(UUID tripId, UUID itemId) {
        return em.createQuery(ITEM_ROW + "where i.trip.id = :trip and i.id = :id", ItemRow.class)
                .setParameter("trip", tripId)
                .setParameter("id", itemId)
                .getResultStream()
                .findFirst();
    }

    @Override
    public List<ItemRow> trash(UUID tripId) {
        return em.createQuery(ITEM_ROW + "where i.trip.id = :trip and i.deletedAt is not null order by i.deletedAt desc, i.id",
                        ItemRow.class)
                .setParameter("trip", tripId)
                .getResultList();
    }

    @Override
    public Set<UUID> doneItemIds(UUID tripId, UUID personId) {
        List<UUID> ids = em.createQuery(
                        "select i.id from ItemEntity i join i.completions c where i.trip.id = :trip and c.personId = :person",
                        UUID.class)
                .setParameter("trip", tripId)
                .setParameter("person", personId)
                .getResultList();
        return new HashSet<>(ids);
    }
}
