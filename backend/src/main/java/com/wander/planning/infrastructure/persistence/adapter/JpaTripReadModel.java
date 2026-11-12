package com.wander.planning.infrastructure.persistence.adapter;

import com.wander.planning.application.query.ChecklistRow;
import com.wander.planning.application.query.InvitePreviewRow;
import com.wander.planning.application.query.InviteRow;
import com.wander.planning.application.query.ItemRow;
import com.wander.planning.application.query.MemberRow;
import com.wander.planning.application.query.RequestRow;
import com.wander.planning.application.query.TripReadModel;
import com.wander.planning.application.query.TripRow;
import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
import com.wander.planning.infrastructure.persistence.entity.ChecklistItemEntity;
import jakarta.persistence.EntityManager;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * The read side with JPQL 'constructor expressions': it fetches only the needed columns, returns flat records, does not go through the aggregate
 * and is not tracked by Hibernate (no dirty checking) - cheaper for the schedule view.
 */
@Repository
public class JpaTripReadModel implements TripReadModel {

    private final EntityManager em;

    /** Takes the entity manager of the current transaction. */
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
    public java.util.Map<UUID, List<UUID>> completions(UUID tripId) {
        java.util.Map<UUID, List<UUID>> byItem = new java.util.LinkedHashMap<>();
        for (Object[] row : em.createQuery(PlanningQueryConstants.COMPLETIONS_OF_TRIP, Object[].class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId).getResultList()) {
            byItem.computeIfAbsent((UUID) row[0], k -> new java.util.ArrayList<>()).add((UUID) row[1]);
        }
        return byItem;
    }

    @Override
    public List<ChecklistRow> checklist(UUID tripId) {
        return em.createQuery(PlanningQueryConstants.CHECKLIST_OF_TRIP, ChecklistItemEntity.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId).getResultStream()
                .map(e -> new ChecklistRow(e.getId(), e.getGroupTitle(), e.getTitle(), e.getPosition(), e.getCompletions().stream()
                        .sorted(java.util.Comparator.comparing(ChecklistItemEntity.Completion::getDoneAt)).map(ChecklistItemEntity.Completion::getPersonId).toList()))
                .toList();
    }

    @Override
    public Optional<String> roleIn(UUID tripId, UUID identityId) {
        return em.createQuery(PlanningQueryConstants.ROLE_IN_TRIP, String.class).setParameter(PlanningQueryConstants.PARAM_TRIP, tripId)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, identityId).getResultStream().findFirst();
    }

    @Override
    public Optional<UUID> memberIdIn(UUID tripId, UUID identityId) {
        return em.createQuery(PlanningQueryConstants.MEMBER_ID_IN_TRIP, UUID.class).setParameter(PlanningQueryConstants.PARAM_TRIP, tripId)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, identityId).getResultStream().findFirst();
    }

    @Override
    public List<MemberRow> members(UUID tripId) {
        return em.createQuery(PlanningQueryConstants.MEMBERS_OF_TRIP, MemberRow.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP, tripId).getResultList();
    }

    @Override
    public List<RequestRow> deletionRequests(UUID tripId) {
        return em.createQuery(PlanningQueryConstants.REQUESTS_OF_TRIP, RequestRow.class)
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
