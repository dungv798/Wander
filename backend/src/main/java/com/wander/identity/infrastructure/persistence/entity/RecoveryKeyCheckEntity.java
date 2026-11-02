package com.wander.identity.infrastructure.persistence.entity;

import com.wander.identity.domain.constant.IdentityConstants;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Bảng {@code recovery_key_checks}: dấu vân tay của khóa ứng với từng nhãn khóa khôi phục. */
@Entity
@Table(name = "recovery_key_checks")
public class RecoveryKeyCheckEntity {

    @Id
    @Column(name = "key_version", length = IdentityConstants.RECOVERY_KEY_VERSION_MAX_LENGTH)
    private String keyVersion;

    @Column(name = "fingerprint", nullable = false, length = IdentityConstants.RECOVERY_KEY_FINGERPRINT_MAX_LENGTH)
    private String fingerprint;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public String getKeyVersion() { return keyVersion; }
    public void setKeyVersion(String v) { this.keyVersion = v; }
    public String getFingerprint() { return fingerprint; }
    public void setFingerprint(String v) { this.fingerprint = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
}
