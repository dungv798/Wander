package com.wander.planning.infrastructure.persistence.entity;

import com.wander.planning.domain.constant.PlanningConstants;
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

/** Table {@code items} and its child table {@code item_completions} (completion per person, P5). */
@Entity
@Table(name = "items")
public class ItemEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private TripEntity trip;

    /** The item's day; NULL = 'no date yet' (V4). */
    @Column(name = "day_date")
    private LocalDate dayDate;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false, length = PlanningConstants.ITEM_TYPE_COLUMN_LENGTH)
    private String type;

    @Column(nullable = false, length = PlanningConstants.MAX_TITLE)
    private String title;

    @Column(name = "time_of_day")
    private LocalTime timeOfDay;

    @Column(name = "duration_min")
    private Integer durationMin;

    @Column(length = PlanningConstants.MAX_NOTE)
    private String note;

    @Column(name = "cost_k")
    private Long costK;

    @Column(nullable = false)
    private boolean included;

    @Column(name = "reference_k")
    private Long referenceK;

    @Column(name = "booking_status", length = PlanningConstants.BOOKING_COLUMN_LENGTH)
    private String bookingStatus;

    /** Id of the place in the editorial catalog; NULL = a free-form item (V4). */
    @Column(name = "place_id", length = PlanningConstants.MAX_PLACE_ID_LENGTH)
    private String placeId;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "item_completions", joinColumns = @JoinColumn(name = "item_id"))
    private Set<Completion> completions = new HashSet<>();

    /** The member id who added the item (NULL = Organizer/old data). */
    @Column(name = "added_by_member_id")
    private UUID addedByMemberId;

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
    public UUID getAddedByMemberId() { return addedByMemberId; }
    public void setAddedByMemberId(UUID v) { this.addedByMemberId = v; }
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
    public String getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(String v) { this.bookingStatus = v; }
    public String getPlaceId() { return placeId; }
    public void setPlaceId(String v) { this.placeId = v; }
    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant v) { this.deletedAt = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant v) { this.updatedAt = v; }
    public Set<Completion> getCompletions() { return completions; }
}
