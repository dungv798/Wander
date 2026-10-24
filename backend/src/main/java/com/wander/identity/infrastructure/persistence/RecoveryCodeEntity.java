package com.wander.identity.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code recovery_codes} (ánh xạ JPA; mô hình domain ở identity.domain.IdentityModel). */
@Entity
@Table(name = "recovery_codes")
public class RecoveryCodeEntity {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "identity_id", nullable = false)
    private UUID identityId;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "invalidated_at")
    private Instant invalidatedAt;

    @Column(name = "invalidated_reason")
    private String invalidatedReason;

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public UUID getIdentityId() { return identityId; }
    public void setIdentityId(UUID v) { this.identityId = v; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String v) { this.codeHash = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getInvalidatedAt() { return invalidatedAt; }
    public void setInvalidatedAt(Instant v) { this.invalidatedAt = v; }
    public String getInvalidatedReason() { return invalidatedReason; }
    public void setInvalidatedReason(String v) { this.invalidatedReason = v; }
}
