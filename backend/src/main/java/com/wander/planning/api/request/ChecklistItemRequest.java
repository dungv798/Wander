package com.wander.planning.api.request;

/**
 * Body of the checklist add and edit endpoints. When adding, {@code title} is required and {@code group} optional; when editing, an
 * omitted or null member keeps the current value.
 *
 * @param group optional group name
 * @param title item title
 */
public record ChecklistItemRequest(String group, String title) {
}
