package com.wander.identity.application;

/** Kết quả trả cho API của Identity; tên trường giữ nguyên hợp đồng cũ (web/src/api.ts). */
public final class IdentityViews {

    private IdentityViews() {
    }

    public record CreatedIdentity(String identityId, String token, String recoveryCode) {
    }

    public record SessionView(String id, String createdAt, String lastSeenAt, boolean current) {
    }

    public record CodeStatus(boolean hasCode, String createdAt) {
    }

    public record RecoveryStarted(String attemptId, String replacementCode, String expiresAt) {
    }

    public record ReplacementBegun(String pendingId, String replacementCode, String expiresAt) {
    }

    public record Committed(boolean committed) {
        public static final Committed YES = new Committed(true);
    }

    public record DeviceLinkCreated(String requestId, String pairingCode, String expiresAt) {
    }

    public record DeviceLinkStatus(String status) {
    }

    public record Approved(boolean approved) {
        public static final Approved YES = new Approved(true);
    }

    public record StepUpCreated(String requestId, String approvalCode, String expiresAt) {
    }
}
