package com.wander.identity.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code code_replacements} (ánh xạ JPA; mô hình domain ở identity.domain.IdentityModel). */
@Entity
@Table(name = "code_replacements")
public class CodeReplacementEntity {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "identity_id", nullable = false)
    private UUID identityId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "old_code_id")
    private UUID oldCodeId;

    @Column(name = "replacement_hash", nullable = false)
    private String replacementHash;

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public UUID getIdentityId() { return identityId; }
    public void setIdentityId(UUID v) { this.identityId = v; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID v) { this.sessionId = v; }
    public UUID getOldCodeId() { return oldCodeId; }
    public void setOldCodeId(UUID v) { this.oldCodeId = v; }
    public String getReplacementHash() { return replacementHash; }
    public void setReplacementHash(String v) { this.replacementHash = v; }
    public String getState() { return state; }
    public void setState(String v) { this.state = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
}
