package com.wander.identity.infrastructure.persistence.entity;

import com.wander.identity.domain.constant.IdentityConstants;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Table {@code recovery_attempts} (JPA mapping; the domain model is in identity.domain.IdentityModel). */
@Entity
@Table(name = "recovery_attempts")
public class RecoveryAttemptEntity {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "attempt_key", nullable = false)
    private String attemptKey;

    @Column(name = "identity_id", nullable = false)
    private UUID identityId;

    @Column(name = "old_code_id", nullable = false)
    private UUID oldCodeId;

    @Column(name = "replacement_hash", nullable = false)
    private String replacementHash;

    @Column(name = "key_version", nullable = false, length = IdentityConstants.RECOVERY_KEY_VERSION_MAX_LENGTH)
    private String keyVersion;

    @Column(name = "session_token_hash", nullable = false)
    private String sessionTokenHash;

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "device_name")
    private String deviceName;

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public String getAttemptKey() { return attemptKey; }
    public void setAttemptKey(String v) { this.attemptKey = v; }
    public UUID getIdentityId() { return identityId; }
    public void setIdentityId(UUID v) { this.identityId = v; }
    public UUID getOldCodeId() { return oldCodeId; }
    public void setOldCodeId(UUID v) { this.oldCodeId = v; }
    public String getReplacementHash() { return replacementHash; }
    public String getKeyVersion() { return keyVersion; }
    public void setKeyVersion(String v) { this.keyVersion = v; }
    public void setReplacementHash(String v) { this.replacementHash = v; }
    public String getSessionTokenHash() { return sessionTokenHash; }
    public void setSessionTokenHash(String v) { this.sessionTokenHash = v; }
    public String getState() { return state; }
    public void setState(String v) { this.state = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String v) { this.deviceName = v; }
}
