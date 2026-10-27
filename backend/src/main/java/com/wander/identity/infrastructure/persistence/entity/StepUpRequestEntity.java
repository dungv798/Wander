package com.wander.identity.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code step_up_requests} (ánh xạ JPA; mô hình domain ở identity.domain.IdentityModel). */
@Entity
@Table(name = "step_up_requests")
public class StepUpRequestEntity {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "identity_id", nullable = false)
    private UUID identityId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "operation", nullable = false)
    private String operation;

    @Column(name = "approval_code", nullable = false)
    private String approvalCode;

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "approved_by_session")
    private UUID approvedBySession;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "match_number", nullable = false)
    private int matchNumber;

    @Column(name = "match_options", nullable = false)
    private String matchOptions;

    public UUID getId() { return id; }
    public void setId(UUID v) { this.id = v; }
    public UUID getIdentityId() { return identityId; }
    public void setIdentityId(UUID v) { this.identityId = v; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID v) { this.sessionId = v; }
    public String getOperation() { return operation; }
    public void setOperation(String v) { this.operation = v; }
    public String getApprovalCode() { return approvalCode; }
    public void setApprovalCode(String v) { this.approvalCode = v; }
    public String getState() { return state; }
    public void setState(String v) { this.state = v; }
    public UUID getApprovedBySession() { return approvedBySession; }
    public void setApprovedBySession(UUID v) { this.approvedBySession = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
    public int getMatchNumber() { return matchNumber; }
    public void setMatchNumber(int v) { this.matchNumber = v; }
    public String getMatchOptions() { return matchOptions; }
    public void setMatchOptions(String v) { this.matchOptions = v; }
}
