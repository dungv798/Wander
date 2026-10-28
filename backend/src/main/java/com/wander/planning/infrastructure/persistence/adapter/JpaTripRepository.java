package com.wander.planning.infrastructure.persistence.adapter;

import com.wander.planning.domain.model.DeletionRequest;
import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.model.TripInvite;
import com.wander.planning.domain.model.TripMember;
import com.wander.planning.domain.port.TripRepository;
import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
import com.wander.planning.infrastructure.persistence.entity.DeletionRequestEntity;
import com.wander.planning.infrastructure.persistence.entity.ItemEntity;
import com.wander.planning.infrastructure.persistence.entity.TripEntity;
import com.wander.planning.infrastructure.persistence.entity.TripInviteEntity;
import com.wander.planning.infrastructure.persistence.entity.TripMemberEntity;
import com.wander.planning.infrastructure.persistence.mapper.TripMapper;
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
 * Ánh xạ hai chiều domain ↔ entity do {@link TripMapper} (MapStruct, ADR-008) sinh; adapter chỉ lo phần cần đối chiếu theo id:
 * danh sách mục (thêm, xóa vĩnh viễn) và tập hoàn thành. Entity nạp trong cùng giao dịch được Hibernate theo dõi (managed),
 * nên {@link #save} chỉ cần chép trạng thái vào và Hibernate tự sinh UPDATE/INSERT/DELETE khi flush.
 */
@Repository
public class JpaTripRepository implements TripRepository {

    private final EntityManager em;
    private final TripMapper mapper;

    /** Nhận bộ quản lý thực thể và bộ ánh xạ entity ↔ domain. */
    JpaTripRepository(EntityManager em, TripMapper mapper) {
        this.em = em;
        this.mapper = mapper;
    }

    @Override
    public Optional<Trip> findByInviteHash(String codeHash) {
        return em.createQuery(PlanningQueryConstants.TRIP_BY_INVITE_HASH, TripEntity.class)
                .setParameter(PlanningQueryConstants.PARAM_CODE_HASH, codeHash)
                .getResultList().stream().findFirst().map(mapper::toDomain);
    }

    @Override
    public Optional<Trip> findAccessible(UUID tripId, UUID ownerId) {
        List<TripEntity> found = em.createQuery(PlanningQueryConstants.TRIP_WITH_ITEMS, TripEntity.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP_ID, tripId)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId)
                .getResultList();
        return found.stream().findFirst().map(mapper::toDomain);
    }

    @Override
    public Optional<Trip> findOwnedDeleted(UUID tripId, UUID ownerId) {
        return em.createQuery(PlanningQueryConstants.TRIP_WITH_ITEMS_DELETED, TripEntity.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP_ID, tripId)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId)
                .getResultList().stream().findFirst().map(mapper::toDomain);
    }

    @Override
    public Map<UUID, String> tripNamesOf(UUID ownerId) {
        Map<UUID, String> names = new HashMap<>();
        for (Object[] row : em.createQuery(PlanningQueryConstants.TRIP_NAMES, Object[].class)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId).getResultList()) {
            names.put((UUID) row[0], (String) row[1]);
        }
        return names;
    }

    @Override
    public void save(Trip trip) {
        TripEntity entity = em.find(TripEntity.class, trip.id());
        if (entity == null) {
            entity = new TripEntity(trip.id());
            entity.setOwnerIdentityId(trip.ownerId());
            entity.setCreatedAt(trip.createdAt());
            copyTrip(trip, entity);
            em.persist(entity);
            return;
        }
        if (entity.getVersion() != trip.version()) {
            throw new ObjectOptimisticLockingFailureException(TripEntity.class, trip.id());
        }
        copyTrip(trip, entity);
        // Mọi thay đổi mục cũng tăng version của chuyến: aggregate là đơn vị nhất quán (và đơn vị khóa).
        em.lock(entity, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
    }

    /** Chép trạng thái chuyến và danh sách mục (thêm mới, cập nhật, xóa vĩnh viễn) vào entity đang được theo dõi. */
    private void copyTrip(Trip trip, TripEntity entity) {
        mapper.update(trip, entity);

        Map<UUID, ItemEntity> existing = entity.getItems().stream()
                .collect(Collectors.toMap(ItemEntity::getId, Function.identity()));
        Set<UUID> keep = new HashSet<>();
        for (Item item : trip.items()) {
            keep.add(item.id());
            ItemEntity itemEntity = existing.get(item.id());
            if (itemEntity == null) {
                itemEntity = new ItemEntity(item.id(), entity);
                itemEntity.setCreatedAt(item.createdAt());
                entity.getItems().add(itemEntity);
            }
            copyItem(item, itemEntity);
        }
        entity.getItems().removeIf(itemEntity -> !keep.contains(itemEntity.getId())); // orphanRemoval ⇒ DELETE (xóa vĩnh viễn)
        copyMembers(trip, entity);
        copyInvites(trip, entity);
        copyRequests(trip, entity);
    }

    /** Đồng bộ đề nghị xóa: thêm mới, cập nhật trạng thái, xóa đề nghị đã hủy/dọn (orphanRemoval). */
    private void copyRequests(Trip trip, TripEntity entity) {
        Map<UUID, DeletionRequestEntity> existing = entity.getDeletionRequests().stream().collect(Collectors.toMap(DeletionRequestEntity::getId, Function.identity()));
        Set<UUID> keep = new HashSet<>();
        for (DeletionRequest request : trip.circle().requests()) {
            keep.add(request.id());
            DeletionRequestEntity row = existing.get(request.id());
            if (row == null) {
                row = new DeletionRequestEntity(request.id(), entity);
                row.setItemId(request.itemId());
                row.setRequesterMemberId(request.requesterMemberId());
                row.setReason(request.reason());
                row.setRequestedAt(request.requestedAt());
                entity.getDeletionRequests().add(row);
            }
            row.setStatus(request.status().code());
            row.setDecidedAt(request.decidedAt());
        }
        entity.getDeletionRequests().removeIf(row -> !keep.contains(row.getId()));
    }

    /** Đồng bộ thành viên: thêm mới, cập nhật tên, xóa người đã bị gỡ/rời (orphanRemoval). */
    private void copyMembers(Trip trip, TripEntity entity) {
        Map<UUID, TripMemberEntity> existing = entity.getMembers().stream().collect(Collectors.toMap(TripMemberEntity::getId, Function.identity()));
        Set<UUID> keep = new HashSet<>();
        for (TripMember member : trip.circle().members()) {
            keep.add(member.id());
            TripMemberEntity row = existing.get(member.id());
            if (row == null) {
                row = new TripMemberEntity(member.id(), entity);
                row.setIdentityId(member.identityId());
                row.setRole(member.role().code());
                row.setJoinedAt(member.joinedAt());
                entity.getMembers().add(row);
            }
            row.setDisplayName(member.displayName());
        }
        entity.getMembers().removeIf(row -> !keep.contains(row.getId()));
    }

    /** Đồng bộ liên kết mời: thêm mới và đánh dấu thu hồi. Thu hồi được flush TRƯỚC khi chèn liên kết mới để không vi phạm chỉ mục duy nhất một liên kết chưa thu hồi. */
    private void copyInvites(Trip trip, TripEntity entity) {
        Map<UUID, TripInviteEntity> existing = entity.getInvites().stream().collect(Collectors.toMap(TripInviteEntity::getId, Function.identity()));
        boolean revoking = false;
        for (TripInvite invite : trip.circle().invites()) {
            TripInviteEntity row = existing.get(invite.id());
            if (row != null && row.getRevokedAt() == null && invite.revokedAt() != null) {
                row.setRevokedAt(invite.revokedAt());
                revoking = true;
            }
        }
        if (revoking) em.flush();
        for (TripInvite invite : trip.circle().invites()) {
            if (existing.containsKey(invite.id())) continue;
            TripInviteEntity row = new TripInviteEntity(invite.id(), entity);
            row.setCodeHash(invite.codeHash());
            row.setCreatedAt(invite.createdAt());
            row.setExpiresAt(invite.expiresAt());
            row.setRevokedAt(invite.revokedAt());
            entity.getInvites().add(row);
        }
    }

    /** Chép trạng thái một mục và tập hoàn thành vào entity; chỉ đụng tập hoàn thành khi thật sự khác. */
    private void copyItem(Item item, ItemEntity itemEntity) {
        mapper.update(item, itemEntity);
        Set<ItemEntity.Completion> wanted = item.completions().entrySet().stream()
                .map(entry -> new ItemEntity.Completion(entry.getKey(), entry.getValue()))
                .collect(Collectors.toSet());
        if (!wanted.equals(itemEntity.getCompletions())) {
            itemEntity.getCompletions().clear();
            itemEntity.getCompletions().addAll(wanted);
        }
    }
}
