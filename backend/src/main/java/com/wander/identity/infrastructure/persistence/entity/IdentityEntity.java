package com.wander.identity.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Table {@code identities} (JPA mapping; the domain model is in identity.domain.IdentityModel). */
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
