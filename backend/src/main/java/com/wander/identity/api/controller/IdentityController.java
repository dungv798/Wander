package com.wander.identity.api.controller;

import com.wander.identity.api.constant.IdentityApiConstants;
import com.wander.identity.api.request.ApprovalRequest;
import com.wander.identity.api.request.BeginReplacementRequest;
import com.wander.identity.api.request.CompleteRecoveryRequest;
import com.wander.identity.api.request.ConfirmReplacementRequest;
import com.wander.identity.api.request.CreateDeviceLinkRequest;
import com.wander.identity.api.request.CreateIdentityRequest;
import com.wander.identity.api.request.PairingRequest;
import com.wander.identity.api.request.RenameDeviceRequest;
import com.wander.identity.api.request.RequestStepUpRequest;
import com.wander.identity.api.request.StartRecoveryRequest;
import com.wander.identity.api.response.IdentityResponses;
import com.wander.identity.application.input.IdentityInput;
import com.wander.identity.application.service.DeviceLinkService;
import com.wander.identity.application.service.IdentityService;
import com.wander.identity.application.service.RecoveryService;
import com.wander.identity.application.service.SecurityEventService;
import com.wander.identity.application.view.IdentityViews;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Identity endpoints. A thin controller: rate limit, call the service, return the read model.
 * Per-address limits use {@link ClientAddress}: the direct connection address, or the address at the right hop behind a trusted proxy (AD-6).
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

    /** Takes the Identity services, the rate limiter and the resolver of the caller's address. */
    public IdentityController(IdentityService identities, RecoveryService recovery, DeviceLinkService deviceLinks,
                              SecurityEventService securityEvents, RateLimits limits, ClientAddress clientAddress) {
        this.identities = identities;
        this.recovery = recovery;
        this.deviceLinks = deviceLinks;
        this.securityEvents = securityEvents;
        this.limits = limits;
        this.clientAddress = clientAddress;
    }

    // ---- public (no session yet) ----

    /** Create an anonymous identity with its first session; limited per address. */
    @SecurityRequirements
    @PostMapping(IdentityApiConstants.IDENTITY_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.CreatedIdentity createIdentity(@RequestBody CreateIdentityRequest body, HttpServletRequest request) {
        limits.identity(clientAddress.of(request));
        return identities.createIdentity(Boolean.TRUE.equals(body.skipRecoveryCode()), IdentityInput.deviceName(body.deviceName()));
    }

    /** Steps 1-2 of recovery with a code. */
    @SecurityRequirements
    @PostMapping(IdentityApiConstants.RECOVERY_START_PATH)
    public IdentityViews.RecoveryStarted startRecovery(@RequestBody StartRecoveryRequest body, HttpServletRequest request) {
        limitRecoveryByAddress(request);
        return recovery.startRecovery(body.attemptId(), body.sessionToken(), body.deviceName(), body.code());
    }

    /** Steps 3-4 of recovery with a code. */
    @SecurityRequirements
    @PostMapping(IdentityApiConstants.RECOVERY_COMPLETE_PATH)
    public IdentityViews.Committed completeRecovery(@RequestBody CompleteRecoveryRequest body, HttpServletRequest request) {
        limitRecoveryByAddress(request);
        return recovery.completeRecovery(body.attemptId(), body.replacementCode());
    }

    /** A new device asks to be paired with a trusted device. */
    @SecurityRequirements
    @PostMapping(IdentityApiConstants.DEVICE_LINKS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.DeviceLinkCreated createDeviceLink(@RequestBody CreateDeviceLinkRequest body, HttpServletRequest request) {
        limitRecoveryByAddress(request);
        limits.pairingRequest(clientAddress.of(request));
        return deviceLinks.createLink(body.sessionToken(), body.deviceName());
    }

    /** The new device asks whether the pairing request has been approved yet. */
    @SecurityRequirements
    @GetMapping(IdentityApiConstants.DEVICE_LINK_BY_ID_PATH)
    public IdentityViews.DeviceLinkStatus deviceLinkStatus(@PathVariable String id, HttpServletRequest request) {
        limits.linkPoll(clientAddress.of(request));
        return deviceLinks.getLinkStatus(id);
    }

    // ---- a valid session is required ----

    /** The active sessions of the identity. */
    @GetMapping(IdentityApiConstants.SESSIONS_PATH)
    public IdentityResponses.SessionsResponse listSessions(AuthenticatedPrincipal principal) {
        return new IdentityResponses.SessionsResponse(identities.listActiveSessions(principal));
    }

    /** Recent security events and the 'unseen' flag of the identity. */
    @GetMapping(IdentityApiConstants.EVENTS_PATH)
    public IdentityViews.EventsView events(AuthenticatedPrincipal principal) {
        return securityEvents.recent(principal.identityId());
    }

    /** The owner opened the Security screen: mark the log as seen. */
    @PostMapping(IdentityApiConstants.EVENTS_SEEN_PATH)
    public IdentityViews.EventsView markEventsSeen(AuthenticatedPrincipal principal) {
        return securityEvents.markSeen(principal.identityId());
    }

    /** Rename or clear the name of the calling device itself; returns the session after the change. */
    @PatchMapping(IdentityApiConstants.CURRENT_SESSION_PATH)
    public IdentityViews.SessionView renameCurrentDevice(AuthenticatedPrincipal principal, @RequestBody RenameDeviceRequest body) {
        return identities.renameCurrentDevice(principal, body.deviceName());
    }

    /** Revoke one session of this identity. */
    @DeleteMapping(IdentityApiConstants.SESSION_BY_ID_PATH)
    public ResponseEntity<Void> revokeSession(AuthenticatedPrincipal principal, @PathVariable String id) {
        identities.revokeSession(principal, id);
        return ResponseEntity.noContent().build();
    }

    /** Sign out every other device; uses the same write-limit exception as revoking a single session. */
    @DeleteMapping(IdentityApiConstants.OTHER_SESSIONS_PATH)
    public ResponseEntity<Void> revokeOtherSessions(AuthenticatedPrincipal principal) {
        identities.revokeOtherSessions(principal);
        return ResponseEntity.noContent().build();
    }

    /** The approving device previews a pairing request: self-declared device name, time, matching-number choices (no state change). */
    @PostMapping(IdentityApiConstants.DEVICE_LINK_PREVIEW_PATH)
    public IdentityViews.LinkPreview previewDeviceLink(AuthenticatedPrincipal principal, @RequestBody PairingRequest body) {
        limitApprovalByIdentity(principal);
        return deviceLinks.previewLink(body.pairingCode());
    }

    /** The approving device actively denies a pairing request. */
    @PostMapping(IdentityApiConstants.DEVICE_LINK_DENY_PATH)
    public IdentityViews.Denied denyDeviceLink(AuthenticatedPrincipal principal, @RequestBody PairingRequest body) {
        limitApprovalByIdentity(principal);
        return deviceLinks.denyLink(body.pairingCode());
    }

    /** A device that already has a session approves the new device's pairing request. */
    @PostMapping(IdentityApiConstants.DEVICE_LINK_APPROVE_PATH)
    public IdentityViews.Approved approveDevice(AuthenticatedPrincipal principal, @RequestBody PairingRequest body) {
        limitApprovalByIdentity(principal);
        return deviceLinks.approveLink(principal, body.pairingCode(), body.number());
    }

    /** Whether the identity already has a valid recovery code. */
    @GetMapping(IdentityApiConstants.RECOVERY_CODE_PATH)
    public IdentityViews.CodeStatus codeStatus(AuthenticatedPrincipal principal) {
        return identities.getRecoveryCodeStatus(principal.identityId());
    }

    /** Phase 1: create or regenerate the recovery code. */
    @PostMapping(IdentityApiConstants.RECOVERY_CODE_BEGIN_PATH)
    public IdentityViews.ReplacementBegun beginReplacement(AuthenticatedPrincipal principal, @RequestBody BeginReplacementRequest body) {
        limitApprovalByIdentity(principal);
        return recovery.beginReplacement(principal, body.evidence() == null ? null : body.evidence().toInput());
    }

    /** Phase 2: confirm the new recovery code. */
    @PostMapping(IdentityApiConstants.RECOVERY_CODE_CONFIRM_PATH)
    public IdentityViews.Committed confirmReplacement(AuthenticatedPrincipal principal, @RequestBody ConfirmReplacementRequest body) {
        limitApprovalByIdentity(principal);
        return recovery.confirmReplacement(principal, body.pendingId(), body.replacementCode());
    }

    /** Ask for a re-authentication approval from another device. */
    @PostMapping(IdentityApiConstants.STEP_UP_REQUESTS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public IdentityViews.StepUpCreated requestStepUp(AuthenticatedPrincipal principal, @RequestBody RequestStepUpRequest body) {
        limitApprovalByIdentity(principal);
        limits.stepUpRequest(principal.identityId().toString());
        return recovery.requestStepUp(principal, body.operation());
    }

    /** The approving device previews a re-authentication request: the action, the requesting device name, the matching-number choices. */
    @PostMapping(IdentityApiConstants.STEP_UP_PREVIEW_PATH)
    public IdentityViews.StepUpPreview previewStepUp(AuthenticatedPrincipal principal, @RequestBody ApprovalRequest body) {
        limitApprovalByIdentity(principal);
        return recovery.previewStepUp(principal, body.approvalCode());
    }

    /** The approving device actively denies a re-authentication request. */
    @PostMapping(IdentityApiConstants.STEP_UP_DENY_PATH)
    public IdentityViews.Denied denyStepUp(AuthenticatedPrincipal principal, @RequestBody ApprovalRequest body) {
        limitApprovalByIdentity(principal);
        return recovery.denyStepUp(principal, body.approvalCode());
    }

    /** Another device approves the re-authentication request. */
    @PostMapping(IdentityApiConstants.STEP_UP_APPROVE_PATH)
    public IdentityViews.Approved approveStepUp(AuthenticatedPrincipal principal, @RequestBody ApprovalRequest body) {
        limitApprovalByIdentity(principal);
        return recovery.approveStepUp(principal, body.approvalCode(), body.number());
    }

    /** Rate limit of the recovery and device-pairing operations that have no session, per caller address. */
    private void limitRecoveryByAddress(HttpServletRequest request) {
        limits.recovery(clientAddress.of(request));
    }

    /** Rate limit of the approval and re-authentication operations, per calling identity. */
    private void limitApprovalByIdentity(AuthenticatedPrincipal principal) {
        limits.approval(principal.identityId().toString());
    }
}
