package com.wander.planning.infrastructure.persistence.entity;

import com.wander.planning.domain.constant.PlanningConstants;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Table {@code owner_preferences}: preferences by identity (BE-10). The primary key is the owner's identity id itself. */
@Entity
@Table(name = "owner_preferences")
public class OwnerPreferencesEntity {

    @Id
    @Column(name = "owner_identity_id")
    private UUID ownerIdentityId;

    /** Preference codes separated by commas, in declaration order; empty = none. */
    @Column(nullable = false, length = PlanningConstants.INTERESTS_COLUMN_LENGTH)
    private String interests = "";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getOwnerIdentityId() { return ownerIdentityId; }
    public void setOwnerIdentityId(UUID v) { this.ownerIdentityId = v; }
    public String getInterests() { return interests; }
    public void setInterests(String v) { this.interests = v; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant v) { this.updatedAt = v; }
}
