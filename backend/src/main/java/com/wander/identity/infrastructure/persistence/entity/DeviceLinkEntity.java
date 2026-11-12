package com.wander.identity.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Table {@code device_links} (JPA mapping; the domain model is in identity.domain.IdentityModel). */
@Entity
@Table(name = "device_links")
public class DeviceLinkEntity {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "pairing_code", nullable = false)
    private String pairingCode;

    @Column(name = "session_token_hash", nullable = false)
    private String sessionTokenHash;

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "identity_id")
    private UUID identityId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "match_number", nullable = false)
    private int matchNumber;

    @Column(name = "match_options", nullable = false)
    private String matchOptions;

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public String getPairingCode() { return pairingCode; }
    public void setPairingCode(String v) { this.pairingCode = v; }
    public String getSessionTokenHash() { return sessionTokenHash; }
    public void setSessionTokenHash(String v) { this.sessionTokenHash = v; }
    public String getState() { return state; }
    public void setState(String v) { this.state = v; }
    public UUID getIdentityId() { return identityId; }
    public void setIdentityId(UUID v) { this.identityId = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String v) { this.deviceName = v; }
    public int getMatchNumber() { return matchNumber; }
    public void setMatchNumber(int v) { this.matchNumber = v; }
    public String getMatchOptions() { return matchOptions; }
    public void setMatchOptions(String v) { this.matchOptions = v; }
}
