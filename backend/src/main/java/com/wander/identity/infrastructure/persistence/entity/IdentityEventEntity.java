package com.wander.identity.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Table {@code identity_events}: the security event log of one identity (BE-11). The primary key is an auto-increment number so the order is stable. */
@Entity
@Table(name = "identity_events")
public class IdentityEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "identity_id", nullable = false)
    private UUID identityId;

    @Column(name = "kind", nullable = false)
    private String kind;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    public Long getId() { return id; }
    public UUID getIdentityId() { return identityId; }
    public void setIdentityId(UUID v) { this.identityId = v; }
    public String getKind() { return kind; }
    public void setKind(String v) { this.kind = v; }
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String v) { this.deviceName = v; }
    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant v) { this.occurredAt = v; }
}
