package com.wander.planning.api.request;

import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.kernel.util.Patch;
import com.wander.shared.web.request.InputError;

/**
 * Body of {@code POST /api/trips/{id}/items} (add) and {@code PATCH /api/trips/{id}/items/{itemId}} (edit). Every member is a
 * {@link Patch}: when adding, an omitted member takes its default; when editing, it keeps the current value; null is a value for
 * {@code day} ("no day"), {@code note}, {@code booking} ("pending") and the cost members (unknown). Costs are in thousand VND.
 *
 * @param type          item type code (required when adding)
 * @param title         title (required when adding)
 * @param day           the day, {@code YYYY-MM-DD}, or null for "no day"
 * @param timeOfDay     {@code HH:MM}, 24-hour
 * @param durationMin   minutes, 0 to 7 days
 * @param note          free note
 * @param cost          cost in thousand VND; empty or null means unknown, 0 means known zero
 * @param included      "included in the price": the cost is not added to the amount still to pay
 * @param referenceCost reference price (only valid when {@code included})
 * @param booking       {@code pending} or {@code booked}
 * @param placeId       catalog place this item refers to
 * @param position      requested position within the day
 */
public record ItemRequest(
        @InputError(code = PlanningErrorCodes.INVALID_TYPE, message = PlanningMessages.TYPE_INVALID) Patch<String> type,
        Patch<String> title,
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.DAY_INVALID) Patch<String> day,
        Patch<String> timeOfDay,
        Patch<FlexibleNumber> durationMin,
        Patch<String> note,
        Patch<FlexibleNumber> cost,
        Patch<Boolean> included,
        Patch<FlexibleNumber> referenceCost,
        @InputError(code = PlanningErrorCodes.INVALID_BOOKING, message = PlanningMessages.BOOKING_INVALID) Patch<String> booking,
        Patch<String> placeId,
        Patch<FlexibleNumber> position) {

    /** The values as the command carries them. */
    public PlanningCommands.ItemFields toFields() {
        return new PlanningCommands.ItemFields(type, title, day, timeOfDay, durationMin, note, cost, included, referenceCost, booking, placeId, position);
    }
}
