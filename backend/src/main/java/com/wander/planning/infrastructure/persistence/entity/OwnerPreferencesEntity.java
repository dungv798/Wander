package com.wander.planning.infrastructure.persistence.entity;

import com.wander.planning.domain.constant.PlanningConstants;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code owner_preferences}: sở thích theo danh tính (BE-10). Khóa chính chính là mã danh tính của chủ. */
@Entity
@Table(name = "owner_preferences")
public class OwnerPreferencesEntity {

    @Id
    @Column(name = "owner_identity_id")
    private UUID ownerIdentityId;

    /** Mã sở thích cách nhau bằng dấu phẩy, theo thứ tự khai báo; rỗng = không có. */
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
