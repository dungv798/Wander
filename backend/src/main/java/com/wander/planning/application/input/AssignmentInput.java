package com.wander.planning.application.input;

import com.wander.shared.kernel.util.FlexibleNumber;

/**
 * One entry of a bulk day assignment as sent by a client. {@code itemId} must be an item of the trip; {@code day} (an ISO date)
 * and {@code position} are optional.
 *
 * @param itemId   id of the item to place
 * @param day      target day ({@code YYYY-MM-DD}), or null for "no day"
 * @param position requested position within the day; ignored when it is not a number
 */
public record AssignmentInput(String itemId, String day, FlexibleNumber position) {
}
