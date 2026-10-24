package com.wander.identity.api;

import com.wander.identity.application.DeviceLinkService;
import com.wander.identity.application.IdentityService;
import com.wander.identity.application.IdentityViews;
import com.wander.identity.application.RecoveryService;
import com.wander.shared.kernel.AuthenticatedPrincipal;
import com.wander.shared.web.JsonBody;
import com.wander.shared.web.RateLimits;
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
 * Giới hạn theo địa chỉ dùng địa chỉ kết nối trực tiếp — sai khi chạy sau proxy/ALB (RG-5).
 */
@RestController
@RequestMapping("/api")
public class IdentityController {

    private final IdentityService identities;
    private final RecoveryService recovery;
    private final DeviceLinkService deviceLinks;
    private final RateLimits limits;

    public IdentityController(IdentityService identities, RecoveryService recovery, DeviceLinkService deviceLinks, RateLimits limits) {
        this.identities = identities;
        this.recovery = recovery;
        this.deviceLinks = deviceLinks;
        this.limits = limits;
    }

    // ---- công khai (chưa có phiên) ----

    @PostMapping("/identity")
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.CreatedIdentity createIdentity(JsonBody body, HttpServletRequest req) {
        limits.identity(req.getRemoteAddr());
        return identities.create(Boolean.TRUE.equals(body.get("skipRecoveryCode")));
    }

    @PostMapping("/recovery/start")
    public IdentityViews.RecoveryStarted startRecovery(JsonBody body, HttpServletRequest req) {
        limits.recovery(req.getRemoteAddr());
        return recovery.start(body.asMap());
    }

    @PostMapping("/recovery/complete")
    public IdentityViews.Committed completeRecovery(JsonBody body, HttpServletRequest req) {
        limits.recovery(req.getRemoteAddr());
        return recovery.complete(body.asMap());
    }

    @PostMapping("/device-links")
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.DeviceLinkCreated createDeviceLink(JsonBody body, HttpServletRequest req) {
        limits.recovery(req.getRemoteAddr());
        return deviceLinks.create(body.asMap());
    }

    @GetMapping("/device-links/{id}")
    public IdentityViews.DeviceLinkStatus deviceLinkStatus(@PathVariable String id, HttpServletRequest req) {
        limits.recovery(req.getRemoteAddr());
        return deviceLinks.status(id);
    }

    // ---- cần phiên hợp lệ ----

    @GetMapping("/sessions")
    public Map<String, Object> sessions(AuthenticatedPrincipal p) {
        return Map.of("sessions", identities.sessions(p));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> revokeSession(AuthenticatedPrincipal p, @PathVariable String id) {
        identities.revokeSession(p, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/device-links/approve")
    public IdentityViews.Approved approveDevice(AuthenticatedPrincipal p, JsonBody body) {
        limits.approval(p.sessionId().toString());
        return deviceLinks.approve(p, body.asMap());
    }

    @GetMapping("/recovery-code")
    public IdentityViews.CodeStatus codeStatus(AuthenticatedPrincipal p) {
        return identities.codeStatus(p.identityId());
    }

    @PostMapping("/recovery-code/begin")
    public IdentityViews.ReplacementBegun beginReplacement(AuthenticatedPrincipal p, JsonBody body) {
        limits.approval(p.sessionId().toString());
        return recovery.beginReplacement(p, body.asMap());
    }

    @PostMapping("/recovery-code/confirm")
    public IdentityViews.Committed confirmReplacement(AuthenticatedPrincipal p, JsonBody body) {
        limits.approval(p.sessionId().toString());
        return recovery.confirmReplacement(p, body.asMap());
    }

    @PostMapping("/step-up/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.StepUpCreated requestStepUp(AuthenticatedPrincipal p, JsonBody body) {
        limits.approval(p.sessionId().toString());
        return recovery.requestStepUp(p, body.asMap());
    }

    @PostMapping("/step-up/approve")
    public IdentityViews.Approved approveStepUp(AuthenticatedPrincipal p, JsonBody body) {
        limits.approval(p.sessionId().toString());
        return recovery.approveStepUp(p, body.asMap());
    }
}
