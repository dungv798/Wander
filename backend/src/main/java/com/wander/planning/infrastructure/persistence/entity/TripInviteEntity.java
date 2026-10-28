package com.wander.planning.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code trip_invites}: liên kết mời (chỉ giữ băm của mã). */
@Entity
@Table(name = "trip_invites")
public class TripInviteEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private TripEntity trip;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected TripInviteEntity() {
    }

    public TripInviteEntity(UUID id, TripEntity trip) {
        this.id = id;
        this.trip = trip;
    }

    public UUID getId() { return id; }
    public TripEntity getTrip() { return trip; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String v) { this.codeHash = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant v) { this.revokedAt = v; }
}
