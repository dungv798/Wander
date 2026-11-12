package com.wander.planning.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/** Table {@code checklist_items} and its child table {@code checklist_completions} (completion per person). */
@Entity
@Table(name = "checklist_items")
public class ChecklistItemEntity {

    @Id
    private UUID id;

    @Column(name = "trip_id", nullable = false)
    private UUID tripId;

    @Column(name = "group_title", nullable = false)
    private String groupTitle;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private int position;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @ElementCollection
    @CollectionTable(name = "checklist_completions", joinColumns = @JoinColumn(name = "item_id"))
    private Set<Completion> completions = new HashSet<>();

    protected ChecklistItemEntity() {
    }

    public ChecklistItemEntity(UUID id) {
        this.id = id;
    }

    public UUID getId() { return id; }
    public UUID getTripId() { return tripId; }
    public void setTripId(UUID v) { this.tripId = v; }
    public String getGroupTitle() { return groupTitle; }
    public void setGroupTitle(String v) { this.groupTitle = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public int getPosition() { return position; }
    public void setPosition(int v) { this.position = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Set<Completion> getCompletions() { return completions; }

    /** One completion mark: the person + the time. */
    @Embeddable
    public static class Completion {
        @Column(name = "person_id", nullable = false)
        private UUID personId;

        @Column(name = "done_at", nullable = false)
        private Instant doneAt;

        protected Completion() {
        }

        public Completion(UUID personId, Instant doneAt) {
            this.personId = personId;
            this.doneAt = doneAt;
        }

        public UUID getPersonId() { return personId; }
        public Instant getDoneAt() { return doneAt; }

        @Override
        public boolean equals(Object other) {
            return other instanceof Completion c && Objects.equals(personId, c.personId) && Objects.equals(doneAt, c.doneAt);
        }

        @Override
        public int hashCode() {
            return Objects.hash(personId, doneAt);
        }
    }
}
