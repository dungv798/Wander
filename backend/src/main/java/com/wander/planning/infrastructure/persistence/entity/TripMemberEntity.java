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

/** Table {@code trip_members}: one person in one trip (the role + a self-declared display name). */
@Entity
@Table(name = "trip_members")
public class TripMemberEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private TripEntity trip;

    @Column(name = "identity_id", nullable = false)
    private UUID identityId;

    @Column(nullable = false, length = PlanningConstants.ROLE_COLUMN_LENGTH)
    private String role;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    protected TripMemberEntity() {
    }

    public TripMemberEntity(UUID id, TripEntity trip) {
        this.id = id;
        this.trip = trip;
    }

    public UUID getId() { return id; }
    public TripEntity getTrip() { return trip; }
    public UUID getIdentityId() { return identityId; }
    public void setIdentityId(UUID v) { this.identityId = v; }
    public String getRole() { return role; }
    public void setRole(String v) { this.role = v; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String v) { this.displayName = v; }
    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant v) { this.joinedAt = v; }
}
