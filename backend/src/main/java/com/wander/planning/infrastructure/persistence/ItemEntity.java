package com.wander.planning.infrastructure.persistence;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/** Bảng {@code items} và bảng con {@code item_completions} (hoàn thành theo người, P5). */
@Entity
@Table(name = "items")
public class ItemEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private TripEntity trip;

    @Column(name = "day_date", nullable = false)
    private LocalDate dayDate;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false, length = 32)
    private String type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "time_of_day")
    private LocalTime timeOfDay;

    @Column(name = "duration_min")
    private Integer durationMin;

    @Column(length = 2000)
    private String note;

    @Column(name = "cost_k")
    private Long costK;

    @Column(nullable = false)
    private boolean included;

    @Column(name = "reference_k")
    private Long referenceK;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "item_completions", joinColumns = @JoinColumn(name = "item_id"))
    private Set<Completion> completions = new HashSet<>();

    protected ItemEntity() {
    }

    public ItemEntity(UUID id, TripEntity trip) {
        this.id = id;
        this.trip = trip;
    }

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
        public boolean equals(Object o) {
            return o instanceof Completion c && Objects.equals(personId, c.personId) && Objects.equals(doneAt, c.doneAt);
        }

        @Override
        public int hashCode() {
            return Objects.hash(personId, doneAt);
        }
    }

    public UUID getId() { return id; }
    public TripEntity getTrip() { return trip; }
    public LocalDate getDayDate() { return dayDate; }
    public void setDayDate(LocalDate v) { this.dayDate = v; }
    public int getPosition() { return position; }
    public void setPosition(int v) { this.position = v; }
    public String getType() { return type; }
    public void setType(String v) { this.type = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public LocalTime getTimeOfDay() { return timeOfDay; }
    public void setTimeOfDay(LocalTime v) { this.timeOfDay = v; }
    public Integer getDurationMin() { return durationMin; }
    public void setDurationMin(Integer v) { this.durationMin = v; }
    public String getNote() { return note; }
    public void setNote(String v) { this.note = v; }
    public Long getCostK() { return costK; }
    public void setCostK(Long v) { this.costK = v; }
    public boolean isIncluded() { return included; }
    public void setIncluded(boolean v) { this.included = v; }
    public Long getReferenceK() { return referenceK; }
    public void setReferenceK(Long v) { this.referenceK = v; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant v) { this.deletedAt = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant v) { this.updatedAt = v; }
    public Set<Completion> getCompletions() { return completions; }
}
