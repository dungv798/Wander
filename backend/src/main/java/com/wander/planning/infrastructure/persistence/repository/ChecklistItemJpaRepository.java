package com.wander.planning.infrastructure.persistence.repository;

import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
import com.wander.planning.infrastructure.persistence.entity.ChecklistItemEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Truy vấn Spring Data cho checklist; luôn lọc theo chuyến để hạng mục của chuyến khác không lọt vào. */
public interface ChecklistItemJpaRepository extends JpaRepository<ChecklistItemEntity, UUID> {

    /** Hạng mục của chuyến theo nhóm rồi vị trí. */
    @Query(PlanningQueryConstants.CHECKLIST_OF_TRIP)
    List<ChecklistItemEntity> findAllOfTrip(@Param("trip") UUID tripId);

    /** Một hạng mục của đúng chuyến. */
    @Query(PlanningQueryConstants.CHECKLIST_ITEM_OF_TRIP)
    Optional<ChecklistItemEntity> findOfTrip(@Param("trip") UUID tripId, @Param("item") UUID itemId);

    /** Vị trí lớn nhất hiện có (null nếu chưa có hạng mục). */
    @Query(PlanningQueryConstants.CHECKLIST_MAX_POSITION)
    Integer maxPosition(@Param("trip") UUID tripId);

    /** Số hạng mục của chuyến. */
    long countByTripId(UUID tripId);
}
