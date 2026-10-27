package com.wander.identity.application.view;

import java.util.List;

/** Kết quả trả cho API của Identity; tên trường giữ nguyên hợp đồng cũ (web/src/api.ts). */
public final class IdentityViews {

    private IdentityViews() {
    }

    public record CreatedIdentity(String identityId, String token, String recoveryCode) {
    }

    /** Phiên của một thiết bị. {@code deviceName} do thiết bị tự khai, CHƯA ĐƯỢC XÁC MINH (có thể bị mạo danh); chỉ là nhãn, không làm bằng chứng. */
    public record SessionView(String id, String createdAt, String lastSeenAt, boolean current, String deviceName) {
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

    public record DeviceLinkCreated(String requestId, String pairingCode, int matchNumber, String expiresAt) {
    }

    /** Một dòng "Hoạt động gần đây": loại sự kiện, tên máy liên quan (tự khai, chưa xác minh; có thể null) và thời điểm ISO. */
    public record EventView(String kind, String deviceName, String at) {
    }

    /** Nhật ký sự kiện bảo mật (mới nhất trước) và cờ "chưa xem" (có thiết bị mới được thêm kể từ lần xem gần nhất). */
    public record EventsView(List<EventView> events, boolean unseen) {
    }

    /** Xem trước yêu cầu ghép ở máy duyệt: tên máy do máy mới tự khai (chưa xác minh), thời điểm và các lựa chọn số khớp. */
    public record LinkPreview(String requestId, String deviceName, String createdAt, List<Integer> options) {
    }

    /** Yêu cầu đã bị từ chối. */
    public record Denied(boolean denied) {
        public static final Denied YES = new Denied(true);
    }

    public record DeviceLinkStatus(String status) {
    }

    public record Approved(boolean approved) {
        public static final Approved YES = new Approved(true);
    }

    public record StepUpCreated(String requestId, String approvalCode, int matchNumber, String expiresAt) {
    }

    /** Xem trước yêu cầu xác thực lại ở máy duyệt: thao tác, tên máy đang xin (tự khai, chưa xác minh), thời điểm, lựa chọn. */
    public record StepUpPreview(String requestId, String operation, String requesterDeviceName, String createdAt, List<Integer> options) {
    }
}
