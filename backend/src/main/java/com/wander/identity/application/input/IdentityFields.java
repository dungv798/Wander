package com.wander.identity.application.input;

/** Tên các trường JSON đầu vào của API Identity (hợp đồng, khớp {@code web/src/api.ts}) và giá trị loại bằng chứng. */
public final class IdentityFields {

    /** Mã nhận diện lần thử khôi phục. */
    public static final String ATTEMPT_ID = "attemptId";

    /** Bí mật phiên do thiết bị tự sinh. */
    public static final String SESSION_TOKEN = "sessionToken";

    /** Mã khôi phục người dùng nhập. */
    public static final String CODE = "code";

    /** Mã thay thế người dùng nhập lại. */
    public static final String REPLACEMENT_CODE = "replacementCode";

    /** Mã ghép thiết bị. */
    public static final String PAIRING_CODE = "pairingCode";

    /** Mã phê duyệt xác thực lại. */
    public static final String APPROVAL_CODE = "approvalCode";

    /** Mã nhận diện mã thay thế đang chờ. */
    public static final String PENDING_ID = "pendingId";

    /** Bằng chứng xác thực lại. */
    public static final String EVIDENCE = "evidence";

    /** Loại bằng chứng. */
    public static final String EVIDENCE_TYPE = "type";

    /** Mã nhận diện yêu cầu phê duyệt. */
    public static final String REQUEST_ID = "requestId";

    /** Thao tác cần xác thực lại. */
    public static final String OPERATION = "operation";

    /** Bỏ qua việc tạo mã khôi phục lúc tạo danh tính. */
    public static final String SKIP_RECOVERY_CODE = "skipRecoveryCode";

    /** Loại bằng chứng: trình mã khôi phục hiện hành. */
    public static final String EVIDENCE_TYPE_CODE = "code";

    /** Loại bằng chứng: phê duyệt từ thiết bị khác. */
    public static final String EVIDENCE_TYPE_APPROVAL = "approval";

    private IdentityFields() {
    }
}
