package com.wander.planning.domain.model;

import com.wander.planning.domain.rule.ItemText;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import java.time.LocalTime;

/**
 * The fields a user can edit on an item (already format-checked). {@code booking} may be null: for a type with booking,
 * null means 'Awaiting confirmation' (the default); for Rest/To-do it must be null. {@code placeId} is the id of the place in the catalog
 * that the item links to (null = a free-form item); it is always normalized and shape-checked as soon as it is built.
 */
public record ItemDetails(ItemType type, String title, LocalTime timeOfDay, Integer durationMin, String note, ItemCost cost,
                          BookingStatus booking, String placeId) {

    public ItemDetails {
        placeId = ItemText.placeId(placeId);
    }

    /** No catalog link given (a free-form item). */
    public ItemDetails(ItemType type, String title, LocalTime timeOfDay, Integer durationMin, String note, ItemCost cost,
                       BookingStatus booking) {
        this(type, title, timeOfDay, durationMin, note, cost, booking, null);
    }

    /** No booking status given (the default for the item type) and no catalog link. */
    public ItemDetails(ItemType type, String title, LocalTime timeOfDay, Integer durationMin, String note, ItemCost cost) {
        this(type, title, timeOfDay, durationMin, note, cost, null, null);
    }
}
