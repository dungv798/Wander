package com.wander.planning.infrastructure.persistence.entity;

import com.wander.planning.domain.constant.PlanningConstants;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code deletion_requests}: đề nghị xóa mục của thành viên. */
@Entity
@Table(name = "deletion_requests")
public class DeletionRequestEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private TripEntity trip;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "requester_member_id", nullable = false)
    private UUID requesterMemberId;

    @Column(nullable = false, length = PlanningConstants.REQUEST_REASON_COLUMN_LENGTH)
    private String reason;

    @Column(nullable = false, length = PlanningConstants.ROLE_COLUMN_LENGTH)
    private String status;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    protected DeletionRequestEntity() {
    }

    public DeletionRequestEntity(UUID id, TripEntity trip) {
        this.id = id;
        this.trip = trip;
    }

    public UUID getId() { return id; }
    public UUID getItemId() { return itemId; }
    public void setItemId(UUID v) { this.itemId = v; }
    public UUID getRequesterMemberId() { return requesterMemberId; }
    public void setRequesterMemberId(UUID v) { this.requesterMemberId = v; }
    public String getReason() { return reason; }
    public void setReason(String v) { this.reason = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant v) { this.requestedAt = v; }
    public Instant getDecidedAt() { return decidedAt; }
    public void setDecidedAt(Instant v) { this.decidedAt = v; }
}
