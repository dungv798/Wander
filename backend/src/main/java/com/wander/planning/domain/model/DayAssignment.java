package com.wander.planning.domain.model;

import java.time.LocalDate;
import java.util.UUID;

/**
 * One element of the bulk date-assignment command: move item {@code itemId} to day {@code day} (null = 'no date yet'), at position
 * {@code position} in that day (null = end of the day). Sending back the old state of the items in increasing position order is how
 * an assignment command is undone.
 */
public record DayAssignment(UUID itemId, LocalDate day, Integer position) {
}
