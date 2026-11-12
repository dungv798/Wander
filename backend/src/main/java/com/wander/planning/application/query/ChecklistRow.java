package com.wander.planning.application.query;

import java.util.List;
import java.util.UUID;

/** A flat row of one checklist item; {@code doneBy} is the identity id (used only internally to convert to a member id). */
public record ChecklistRow(UUID id, String group, String title, int position, List<UUID> doneBy) {
}
