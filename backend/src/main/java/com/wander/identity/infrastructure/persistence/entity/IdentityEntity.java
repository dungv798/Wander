package com.wander.identity.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code identities} (ánh xạ JPA; mô hình domain ở identity.domain.IdentityModel). */
@Entity
@Table(name = "identities")
public class IdentityEntity {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
}
