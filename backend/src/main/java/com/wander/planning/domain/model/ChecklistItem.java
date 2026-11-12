package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * One preparation-checklist item of a trip (Q12): created by the Organizer, each person ticks THEIR OWN (there is no shared state). The name and
 * group are self-declared labels so they are normalized; an empty group means 'no group'.
 */
public final class ChecklistItem {

    private final UUID id;
    private final UUID tripId;
    private String group;
    private String title;
    private final int position;
    private final Instant createdAt;
    private final Map<UUID, Instant> completions;

    /** Rebuilt from stored data (not normalized again). */
    public ChecklistItem(UUID id, UUID tripId, String group, String title, int position, Instant createdAt, Map<UUID, Instant> completions) {
        this.id = id;
        this.tripId = tripId;
        this.group = group;
        this.title = title;
        this.position = position;
        this.createdAt = createdAt;
        this.completions = new LinkedHashMap<>(completions);
    }

    /** Creates a new item at {@code position}; the name is required, the group optional. */
    public static ChecklistItem create(UUID tripId, String rawGroup, String rawTitle, int position, Instant now) {
        return new ChecklistItem(UUID.randomUUID(), tripId, normalizeGroup(rawGroup), normalizeTitle(rawTitle), position, now, Map.of());
    }

    /** Edits the name/group: a null field stays unchanged. */
    public void edit(String rawGroup, String rawTitle) {
        if (rawGroup != null) this.group = normalizeGroup(rawGroup);
        if (rawTitle != null) this.title = normalizeTitle(rawTitle);
    }

    /** Sets or clears the completion mark OF {@code personId} (idempotent); it does not affect others. */
    public void setDone(UUID personId, boolean done, Instant now) {
        if (done) completions.putIfAbsent(personId, now);
        else completions.remove(personId);
    }

    /** Whether this person has finished. */
    public boolean isDoneBy(UUID personId) {
        return completions.containsKey(personId);
    }

    /** The people who have finished (identity ids, used only internally), in tick order. */
    public List<UUID> doneBy() {
        return List.copyOf(completions.keySet());
    }

    /** The completion time per person (for storing). */
    public Map<UUID, Instant> completions() {
        return Map.copyOf(completions);
    }

    /** The item id. */
    public UUID id() {
        return id;
    }

    /** The id of the trip that holds the item. */
    public UUID tripId() {
        return tripId;
    }

    /** The group (an empty string = no group). */
    public String group() {
        return group;
    }

    /** The item name (normalized, not empty). */
    public String title() {
        return title;
    }

    /** Position in the checklist (increasing in the order added). */
    public int position() {
        return position;
    }

    /** Creation time. */
    public Instant createdAt() {
        return createdAt;
    }

    /** The normalized group; null or blank becomes an empty string. */
    private static String normalizeGroup(String raw) {
        return raw == null ? "" : Labels.normalize(raw, PlanningConstants.MAX_CHECKLIST_GROUP, PlanningFields.GROUP);
    }

    /** The normalized name; blank is REQUIRED. */
    private static String normalizeTitle(String raw) {
        String text = Labels.normalize(raw == null ? "" : raw, PlanningConstants.MAX_CHECKLIST_TITLE, PlanningFields.TITLE);
        if (text.isEmpty()) throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.CHECKLIST_TITLE_REQUIRED, PlanningFields.TITLE);
        return text;
    }
}
