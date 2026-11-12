package com.wander.planning.domain.port;

import com.wander.planning.domain.model.ChecklistItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** The storage port of the preparation checklist. Access to the trip is checked by the application layer BEFORE this port is called. */
public interface ChecklistRepository {

    /** The trip's items in display order (group, position). */
    List<ChecklistItem> listOf(UUID tripId);

    /** One item of exactly this trip (an item of another trip counts as absent). */
    Optional<ChecklistItem> find(UUID tripId, UUID itemId);

    /** The number of items of the trip. */
    int countOf(UUID tripId);

    /** The next position (largest + 1; 0 if there is none). */
    int nextPosition(UUID tripId);

    /** Adds or updates an item (including the completion marks). */
    void save(ChecklistItem item);

    /** Deletes an item of exactly this trip for good; returns true if something was deleted. */
    boolean delete(UUID tripId, UUID itemId);
}
