package com.wander.identity.api.controller;

import com.wander.identity.api.constant.IdentityApiConstants;
import com.wander.identity.application.input.IdentityFields;
import com.wander.identity.application.input.IdentityInput;
import com.wander.identity.application.service.DeviceLinkService;
import com.wander.identity.application.service.IdentityService;
import com.wander.identity.application.service.RecoveryService;
import com.wander.identity.application.service.SecurityEventService;
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
import org.springframework.web.bind.annotation.PatchMapping;
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
    private final SecurityEventService securityEvents;
    private final RateLimits limits;
    private final ClientAddress clientAddress;

    /** Nhận các service của Identity, bộ giới hạn tần suất và bộ lấy địa chỉ người gọi. */
    public IdentityController(IdentityService identities, RecoveryService recovery, DeviceLinkService deviceLinks,
                              SecurityEventService securityEvents, RateLimits limits, ClientAddress clientAddress) {
        this.identities = identities;
        this.recovery = recovery;
        this.deviceLinks = deviceLinks;
        this.securityEvents = securityEvents;
        this.limits = limits;
        this.clientAddress = clientAddress;
    }

    // ---- công khai (chưa có phiên) ----

    /** Tạo danh tính ẩn danh kèm phiên đầu tiên; giới hạn theo địa chỉ. */
    @PostMapping(IdentityApiConstants.IDENTITY_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.CreatedIdentity createIdentity(JsonBody body, HttpServletRequest request) {
        limits.identity(clientAddress.of(request));
        return identities.createIdentity(Boolean.TRUE.equals(body.get(IdentityFields.SKIP_RECOVERY_CODE)),
                IdentityInput.deviceName(body.get(IdentityFields.DEVICE_NAME)));
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
        limits.pairingRequest(clientAddress.of(request));
        return deviceLinks.createLink(body.asMap());
    }

    /** Thiết bị mới hỏi yêu cầu ghép đã được duyệt chưa. */
    @GetMapping(IdentityApiConstants.DEVICE_LINK_BY_ID_PATH)
    public IdentityViews.DeviceLinkStatus deviceLinkStatus(@PathVariable String id, HttpServletRequest request) {
        limits.linkPoll(clientAddress.of(request));
        return deviceLinks.getLinkStatus(id);
    }

    // ---- cần phiên hợp lệ ----

    /** Các phiên đang hoạt động của danh tính. */
    @GetMapping(IdentityApiConstants.SESSIONS_PATH)
    public Map<String, Object> listSessions(AuthenticatedPrincipal principal) {
        return Map.of(IdentityApiConstants.KEY_SESSIONS, identities.listActiveSessions(principal));
    }

    /** Nhật ký sự kiện bảo mật gần đây và cờ "chưa xem" của danh tính. */
    @GetMapping(IdentityApiConstants.EVENTS_PATH)
    public IdentityViews.EventsView events(AuthenticatedPrincipal principal) {
        return securityEvents.recent(principal.identityId());
    }

    /** Chủ đã mở màn Bảo mật: đánh dấu đã xem. */
    @PostMapping(IdentityApiConstants.EVENTS_SEEN_PATH)
    public IdentityViews.EventsView markEventsSeen(AuthenticatedPrincipal principal) {
        return securityEvents.markSeen(principal.identityId());
    }

    /** Đổi hoặc xóa tên của chính thiết bị đang gọi; trả về phiên sau khi đổi. */
    @PatchMapping(IdentityApiConstants.CURRENT_SESSION_PATH)
    public IdentityViews.SessionView renameCurrentDevice(AuthenticatedPrincipal principal, JsonBody body) {
        return identities.renameCurrentDevice(principal, body.asMap());
    }

    /** Thu hồi một phiên của chính danh tính này. */
    @DeleteMapping(IdentityApiConstants.SESSION_BY_ID_PATH)
    public ResponseEntity<Void> revokeSession(AuthenticatedPrincipal principal, @PathVariable String id) {
        identities.revokeSession(principal, id);
        return ResponseEntity.noContent().build();
    }

    /** Đăng xuất mọi máy khác; dùng cùng ngoại lệ hạn mức ghi của thao tác thu hồi phiên. */
    @DeleteMapping(IdentityApiConstants.OTHER_SESSIONS_PATH)
    public ResponseEntity<Void> revokeOtherSessions(AuthenticatedPrincipal principal) {
        identities.revokeOtherSessions(principal);
        return ResponseEntity.noContent().build();
    }

    /** Máy duyệt xem trước yêu cầu ghép: tên máy tự khai, thời điểm, các lựa chọn số khớp (không đổi trạng thái). */
    @PostMapping(IdentityApiConstants.DEVICE_LINK_PREVIEW_PATH)
    public IdentityViews.LinkPreview previewDeviceLink(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
        return deviceLinks.previewLink(body.asMap());
    }

    /** Máy duyệt từ chối chủ động yêu cầu ghép. */
    @PostMapping(IdentityApiConstants.DEVICE_LINK_DENY_PATH)
    public IdentityViews.Denied denyDeviceLink(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
        return deviceLinks.denyLink(body.asMap());
    }

    /** Thiết bị đã có phiên duyệt yêu cầu ghép của thiết bị mới. */
    @PostMapping(IdentityApiConstants.DEVICE_LINK_APPROVE_PATH)
    public IdentityViews.Approved approveDevice(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
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
        limitApprovalByIdentity(principal);
        return recovery.beginReplacement(principal, body.asMap());
    }

    /** Pha 2 xác nhận mã khôi phục mới. */
    @PostMapping(IdentityApiConstants.RECOVERY_CODE_CONFIRM_PATH)
    public IdentityViews.Committed confirmReplacement(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
        return recovery.confirmReplacement(principal, body.asMap());
    }

    /** Xin phê duyệt xác thực lại từ thiết bị khác. */
    @PostMapping(IdentityApiConstants.STEP_UP_REQUESTS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.StepUpCreated requestStepUp(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
        limits.stepUpRequest(principal.identityId().toString());
        return recovery.requestStepUp(principal, body.asMap());
    }

    /** Máy duyệt xem trước yêu cầu xác thực lại: thao tác, tên máy đang xin, các lựa chọn số khớp. */
    @PostMapping(IdentityApiConstants.STEP_UP_PREVIEW_PATH)
    public IdentityViews.StepUpPreview previewStepUp(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
        return recovery.previewStepUp(principal, body.asMap());
    }

    /** Máy duyệt từ chối chủ động yêu cầu xác thực lại. */
    @PostMapping(IdentityApiConstants.STEP_UP_DENY_PATH)
    public IdentityViews.Denied denyStepUp(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
        return recovery.denyStepUp(principal, body.asMap());
    }

    /** Thiết bị khác phê duyệt yêu cầu xác thực lại. */
    @PostMapping(IdentityApiConstants.STEP_UP_APPROVE_PATH)
    public IdentityViews.Approved approveStepUp(AuthenticatedPrincipal principal, JsonBody body) {
        limitApprovalByIdentity(principal);
        return recovery.approveStepUp(principal, body.asMap());
    }

    /** Giới hạn tần suất các thao tác khôi phục/ghép thiết bị chưa có phiên, theo địa chỉ người gọi. */
    private void limitRecoveryByAddress(HttpServletRequest request) {
        limits.recovery(clientAddress.of(request));
    }

    /** Giới hạn tần suất các thao tác duyệt/xác thực lại, theo danh tính đang gọi. */
    private void limitApprovalByIdentity(AuthenticatedPrincipal principal) {
        limits.approval(principal.identityId().toString());
    }
}
