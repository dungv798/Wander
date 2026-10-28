package com.wander.planning.infrastructure.persistence.adapter;

import com.wander.planning.application.query.InvitePreviewRow;
import com.wander.planning.application.query.InviteRow;
import com.wander.planning.application.query.ItemRow;
import com.wander.planning.application.query.MemberRow;
import com.wander.planning.application.query.TripReadModel;
import com.wander.planning.application.query.TripRow;
import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
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

    private final EntityManager em;

    /** Nhận bộ quản lý thực thể của giao dịch hiện tại. */
    public JpaTripReadModel(EntityManager em) {
        this.em = em;
    }

    @Override
    public Optional<TripRow> findTrip(UUID tripId, UUID ownerId) {
        return em.createQuery(PlanningQueryConstants.TRIP_ROW + PlanningQueryConstants.WHERE_TRIP_OF_OWNER, TripRow.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP_ID, tripId)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId)
                .getResultStream()
                .findFirst();
    }

    @Override
    public String interestPreferences(UUID ownerId) {
        return em.createQuery(PlanningQueryConstants.OWNER_INTEREST_PREFERENCES, String.class)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId)
                .getResultStream().findFirst().orElse("");
    }

    @Override
    public List<MemberRow> members(UUID tripId) {
        return em.createQuery(PlanningQueryConstants.MEMBERS_OF_TRIP, MemberRow.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId).getResultList();
    }

    @Override
    public Optional<InviteRow> unrevokedInvite(UUID tripId) {
        return em.createQuery(PlanningQueryConstants.UNREVOKED_INVITE_OF_TRIP, InviteRow.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId).getResultStream().findFirst();
    }

    @Override
    public Optional<InvitePreviewRow> previewInvite(String codeHash, java.time.Instant now) {
        return em.createQuery(PlanningQueryConstants.INVITE_PREVIEW, InvitePreviewRow.class)
                .setParameter(PlanningQueryConstants.PARAM_CODE_HASH, codeHash)
                .setParameter(PlanningQueryConstants.PARAM_NOW, now).getResultStream().findFirst();
    }

    @Override
    public List<TripRow> listDeletedTrips(UUID ownerId) {
        return em.createQuery(PlanningQueryConstants.TRIP_ROW + PlanningQueryConstants.WHERE_OWNER_DELETED_RECENT_FIRST, TripRow.class)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId)
                .getResultList();
    }

    @Override
    public List<TripRow> listTrips(UUID ownerId) {
        return em.createQuery(PlanningQueryConstants.TRIP_ROW + PlanningQueryConstants.WHERE_OWNER_NEWEST_FIRST, TripRow.class)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId)
                .getResultList();
    }

    @Override
    public List<ItemRow> items(UUID tripId) {
        return em.createQuery(PlanningQueryConstants.ITEM_ROW + PlanningQueryConstants.WHERE_TRIP_ITEMS_IN_ORDER, ItemRow.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId)
                .getResultList();
    }

    @Override
    public Optional<ItemRow> item(UUID tripId, UUID itemId) {
        return em.createQuery(PlanningQueryConstants.ITEM_ROW + PlanningQueryConstants.WHERE_TRIP_ITEM, ItemRow.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId)
                .setParameter(PlanningQueryConstants.PARAM_ITEM_ID, itemId)
                .getResultStream()
                .findFirst();
    }

    @Override
    public List<ItemRow> trash(UUID tripId) {
        return em.createQuery(PlanningQueryConstants.ITEM_ROW + PlanningQueryConstants.WHERE_TRIP_TRASH, ItemRow.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId)
                .getResultList();
    }

    @Override
    public Set<UUID> doneItemIds(UUID tripId, UUID personId) {
        List<UUID> ids = em.createQuery(PlanningQueryConstants.DONE_ITEM_IDS, UUID.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId)
                .setParameter(PlanningQueryConstants.PARAM_PERSON, personId)
                .getResultList();
        return new HashSet<>(ids);
    }
}
