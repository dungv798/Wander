package com.wander.identity.application.view;

import java.util.List;

/** Results returned to the Identity API; field names keep the old contract (web/src/api.ts). */
public final class IdentityViews {

    private IdentityViews() {
    }

    public record CreatedIdentity(String identityId, String token, String recoveryCode) {
    }

    /** The session of one device. {@code deviceName} is declared by the device itself and NOT VERIFIED (it can be impersonated); it is only a label, never evidence. */
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

    /** One line of 'Recent activity': the event kind, the related device name (self-declared, unverified; may be null) and the ISO time. */
    public record EventView(String kind, String deviceName, String at) {
    }

    /** The security event log (newest first) and the 'unseen' flag (a new device was added since the last time it was viewed). */
    public record EventsView(List<EventView> events, boolean unseen) {
    }

    /** Preview of a pairing request on the approving device: the device name the new device declared (unverified), the time and the matching-number choices. */
    public record LinkPreview(String requestId, String deviceName, String createdAt, List<Integer> options) {
    }

    /** The request has been denied. */
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

    /** Preview of a re-authentication request on the approving device: the action, the requesting device name (self-declared, unverified), the time, the choices. */
    public record StepUpPreview(String requestId, String operation, String requesterDeviceName, String createdAt, List<Integer> options) {
    }
}
