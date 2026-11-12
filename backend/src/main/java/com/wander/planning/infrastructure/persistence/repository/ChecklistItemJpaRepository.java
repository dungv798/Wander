package com.wander.planning.infrastructure.persistence.repository;

import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
import com.wander.planning.infrastructure.persistence.entity.ChecklistItemEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data queries for the checklist; always filtered by trip so an item of another trip cannot slip in. */
public interface ChecklistItemJpaRepository extends JpaRepository<ChecklistItemEntity, UUID> {

    /** The trip's items by group then position. */
    @Query(PlanningQueryConstants.CHECKLIST_OF_TRIP)
    List<ChecklistItemEntity> findAllOfTrip(@Param("trip") UUID tripId);

    /** One item of exactly this trip. */
    @Query(PlanningQueryConstants.CHECKLIST_ITEM_OF_TRIP)
    Optional<ChecklistItemEntity> findOfTrip(@Param("trip") UUID tripId, @Param("item") UUID itemId);

    /** The largest existing position (null if there is no item). */
    @Query(PlanningQueryConstants.CHECKLIST_MAX_POSITION)
    Integer maxPosition(@Param("trip") UUID tripId);

    /** The number of items of the trip. */
    long countByTripId(UUID tripId);
}
