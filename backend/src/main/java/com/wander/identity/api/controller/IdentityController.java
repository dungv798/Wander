package com.wander.identity.api.controller;

import com.wander.identity.api.constant.IdentityApiConstants;
import com.wander.identity.application.input.IdentityFields;
import com.wander.identity.application.service.DeviceLinkService;
import com.wander.identity.application.service.IdentityService;
import com.wander.identity.application.service.RecoveryService;
import com.wander.identity.application.view.IdentityViews;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import com.wander.shared.web.request.JsonBody;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Điểm cuối của Identity. Controller mỏng: giới hạn tần suất, gọi service, trả read model.
 * Giới hạn theo địa chỉ dùng {@link ClientAddress}: địa chỉ kết nối trực tiếp, hoặc địa chỉ đúng hop sau proxy tin cậy (AD-6).
 */
@RestController
@RequestMapping(IdentityApiConstants.BASE_PATH)
public class IdentityController {

    private final IdentityService identities;
    private final RecoveryService recovery;
    private final DeviceLinkService deviceLinks;
    private final RateLimits limits;
    private final ClientAddress clientAddress;

    /** Nhận các service của Identity, bộ giới hạn tần suất và bộ lấy địa chỉ người gọi. */
    public IdentityController(IdentityService identities, RecoveryService recovery, DeviceLinkService deviceLinks,
                              RateLimits limits, ClientAddress clientAddress) {
        this.identities = identities;
        this.recovery = recovery;
        this.deviceLinks = deviceLinks;
        this.limits = limits;
        this.clientAddress = clientAddress;
    }

    // ---- công khai (chưa có phiên) ----

    /** Tạo danh tính ẩn danh kèm phiên đầu tiên; giới hạn theo địa chỉ. */
    @PostMapping(IdentityApiConstants.IDENTITY_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.CreatedIdentity createIdentity(JsonBody body, HttpServletRequest request) {
        limits.identity(clientAddress.of(request));
        return identities.createIdentity(Boolean.TRUE.equals(body.get(IdentityFields.SKIP_RECOVERY_CODE)));
    }

    /** Bước 1–2 khôi phục bằng mã. */
    @PostMapping(IdentityApiConstants.RECOVERY_START_PATH)
    public IdentityViews.RecoveryStarted startRecovery(JsonBody body, HttpServletRequest request) {
        limitRecoveryByAddress(request);
        return recovery.startRecovery(body.asMap());
    }

    /** Bước 3–4 khôi phục bằng mã. */
    @PostMapping(IdentityApiConstants.RECOVERY_COMPLETE_PATH)
    public IdentityViews.Committed completeRecovery(JsonBody body, HttpServletRequest request) {
        limitRecoveryByAddress(request);
        return recovery.completeRecovery(body.asMap());
    }

    /** Thiết bị mới xin ghép với một thiết bị tin cậy. */
    @PostMapping(IdentityApiConstants.DEVICE_LINKS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.DeviceLinkCreated createDeviceLink(JsonBody body, HttpServletRequest request) {
        limitRecoveryByAddress(request);
        return deviceLinks.createLink(body.asMap());
    }

    /** Thiết bị mới hỏi yêu cầu ghép đã được duyệt chưa. */
    @GetMapping(IdentityApiConstants.DEVICE_LINK_BY_ID_PATH)
    public IdentityViews.DeviceLinkStatus deviceLinkStatus(@PathVariable String id, HttpServletRequest request) {
        limitRecoveryByAddress(request);
        return deviceLinks.getLinkStatus(id);
    }

    // ---- cần phiên hợp lệ ----

    /** Các phiên đang hoạt động của danh tính. */
    @GetMapping(IdentityApiConstants.SESSIONS_PATH)
    public Map<String, Object> listSessions(AuthenticatedPrincipal principal) {
        return Map.of(IdentityApiConstants.KEY_SESSIONS, identities.listActiveSessions(principal));
    }

    /** Thu hồi một phiên của chính danh tính này. */
    @DeleteMapping(IdentityApiConstants.SESSION_BY_ID_PATH)
    public ResponseEntity<Void> revokeSession(AuthenticatedPrincipal principal, @PathVariable String id) {
        identities.revokeSession(principal, id);
        return ResponseEntity.noContent().build();
    }

    /** Thiết bị đã có phiên duyệt yêu cầu ghép của thiết bị mới. */
    @PostMapping(IdentityApiConstants.DEVICE_LINK_APPROVE_PATH)
    public IdentityViews.Approved approveDevice(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalBySession(principal);
        return deviceLinks.approveLink(principal, body.asMap());
    }

    /** Danh tính đã có mã khôi phục hợp lệ chưa. */
    @GetMapping(IdentityApiConstants.RECOVERY_CODE_PATH)
    public IdentityViews.CodeStatus codeStatus(AuthenticatedPrincipal principal) {
        return identities.getRecoveryCodeStatus(principal.identityId());
    }

    /** Pha 1 tạo hoặc tái tạo mã khôi phục. */
    @PostMapping(IdentityApiConstants.RECOVERY_CODE_BEGIN_PATH)
    public IdentityViews.ReplacementBegun beginReplacement(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalBySession(principal);
        return recovery.beginReplacement(principal, body.asMap());
    }

    /** Pha 2 xác nhận mã khôi phục mới. */
    @PostMapping(IdentityApiConstants.RECOVERY_CODE_CONFIRM_PATH)
    public IdentityViews.Committed confirmReplacement(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalBySession(principal);
        return recovery.confirmReplacement(principal, body.asMap());
    }

    /** Xin phê duyệt xác thực lại từ thiết bị khác. */
    @PostMapping(IdentityApiConstants.STEP_UP_REQUESTS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.StepUpCreated requestStepUp(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalBySession(principal);
        return recovery.requestStepUp(principal, body.asMap());
    }

    /** Thiết bị khác phê duyệt yêu cầu xác thực lại. */
    @PostMapping(IdentityApiConstants.STEP_UP_APPROVE_PATH)
    public IdentityViews.Approved approveStepUp(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalBySession(principal);
        return recovery.approveStepUp(principal, body.asMap());
    }

    /** Giới hạn tần suất các thao tác khôi phục/ghép thiết bị chưa có phiên, theo địa chỉ người gọi. */
    private void limitRecoveryByAddress(HttpServletRequest request) {
        limits.recovery(clientAddress.of(request));
    }

    /** Giới hạn tần suất các thao tác duyệt/xác thực lại, theo phiên đang gọi. */
    private void limitApprovalBySession(AuthenticatedPrincipal principal) {
        limits.approval(principal.sessionId().toString());
    }
}
