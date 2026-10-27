package com.wander.planning.infrastructure.persistence.adapter;

import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.port.TripRepository;
import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
import com.wander.planning.infrastructure.persistence.entity.ItemEntity;
import com.wander.planning.infrastructure.persistence.entity.TripEntity;
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
    public Optional<Trip> findOwned(UUID tripId, UUID ownerId) {
        List<TripEntity> found = em.createQuery(PlanningQueryConstants.TRIP_WITH_ITEMS, TripEntity.class)
                .setParameter(PlanningQueryConstants.PARAM_TRIP_ID, tripId)
                .setParameter(PlanningQueryConstants.PARAM_OWNER, ownerId)
                .getResultList();
        return found.stream().findFirst().map(mapper::toDomain);
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
