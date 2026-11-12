package com.wander.identity.application.service;

import com.wander.identity.application.input.IdentityInput;
import com.wander.identity.application.view.IdentityViews.Approved;
import com.wander.identity.application.view.IdentityViews.Denied;
import com.wander.identity.application.view.IdentityViews.DeviceLinkCreated;
import com.wander.identity.application.view.IdentityViews.DeviceLinkStatus;
import com.wander.identity.application.view.IdentityViews.LinkPreview;
import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.model.IdentityModel.DeviceLink;
import com.wander.identity.domain.model.IdentityModel.LinkState;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.rule.MatchChallenge;
import com.wander.identity.domain.rule.Secrets;
import com.wander.identity.domain.vocabulary.EventKind;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** A trusted device approves a new device (D21). RG-1: the design is not approved yet. */
@Service
@Transactional
public class DeviceLinkService {

    private final IdentityStore store;
    private final Clock clock;
    private final SecurityEventService events;

    /** Takes the storage port, the clock (tests replace it with a fake) and the security event log. */
    public DeviceLinkService(IdentityStore store, Clock clock, SecurityEventService events) {
        this.store = store;
        this.clock = clock;
        this.events = events;
    }

    /** The new device generates its own session secret and only sends it so the server keeps its hash; it receives a pairing code for the old device to type. */
    public DeviceLinkCreated createLink(String sessionToken, String deviceNameRaw) {
        String tokenHash = Secrets.hashToken(IdentityInput.sessionToken(sessionToken));
        String deviceName = IdentityInput.deviceName(deviceNameRaw);
        if (store.isTokenHashInUse(tokenHash)) throw IdentityInput.tokenInUse();
        Instant now = Timestamps.now(clock);
        String pairingCode = Secrets.newShortCode();
        while (store.isPairingCodeActive(pairingCode, now)) pairingCode = Secrets.newShortCode();
        Instant expiresAt = now.plus(IdentityConstants.APPROVAL_TTL);
        UUID id = UUID.randomUUID();
        MatchChallenge challenge = MatchChallenge.random();
        store.saveDeviceLink(new DeviceLink(id, pairingCode, tokenHash, LinkState.PENDING, null, now, expiresAt, deviceName,
                challenge.number(), challenge.optionsText()));
        return new DeviceLinkCreated(id.toString(), pairingCode, challenge.number(), Timestamps.format(expiresAt));
    }

    /** Displayed status of a pairing request (pending, approved, expired); an unknown request is a 404. */
    @Transactional(readOnly = true)
    public DeviceLinkStatus getLinkStatus(String requestId) {
        DeviceLink link = Ids.parse(requestId).flatMap(store::findDeviceLink).orElseThrow(WanderException::notFound);
        return new DeviceLinkStatus(link.visibleState(Timestamps.now(clock)).name().toLowerCase(Locale.ROOT));
    }

    /**
     * The approving device previews the request (DR-018 E1: 'the action is stated clearly on the approving device'): self-declared device name, time and the matching-number
     * choices fixed at creation. Changes no state and creates no session.
     */
    public LinkPreview previewLink(String pairingCode) {
        DeviceLink link = findPendingLink(pairingCode, false);
        return new LinkPreview(link.id().toString(), link.deviceName(), Timestamps.format(link.createdAt()), link.challenge().options());
    }

    /** The approving device actively denies: the request becomes denied and can never be approved again. */
    public Denied denyLink(String pairingCode) {
        store.saveDeviceLink(findPendingLink(pairingCode, true).deny());
        return Denied.YES;
    }

    /**
     * A device that already has a session approves by CHOOSING THE RIGHT MATCHING NUMBER: a session is created for the secret the new device generated itself. The pairing code is
     * single-use. A wrong choice => the request is denied for good (kept even though an error is thrown, hence {@code noRollbackFor}). A missing or malformed number is rejected
     * before the request is touched. NOTE: any {@code WanderException} added to this method AFTER the write would commit half the work; only throw
     * before writing or right after the denying write.
     */
    @Transactional(noRollbackFor = WanderException.class)
    public Approved approveLink(AuthenticatedPrincipal principal, String pairingCode, Integer number) {
        int chosen = IdentityInput.matchNumber(number);
        DeviceLink link = findPendingLink(pairingCode, true);
        Instant now = Timestamps.now(clock);
        if (!link.challenge().matches(chosen)) {
            store.saveDeviceLink(link.deny());
            throw WanderException.forbidden(IdentityErrorCodes.MATCH_MISMATCH, IdentityMessages.MATCH_MISMATCH);
        }
        store.addSession(Session.open(principal.identityId(), link.sessionTokenHash(), link.deviceName(), now));
        store.saveDeviceLink(link.approve(principal.identityId()));
        events.record(principal.identityId(), EventKind.PAIRED, link.deviceName());
        return Approved.YES;
    }

    /**
     * The pairing request that is pending and still valid for the pairing code the user typed; {@code lock} = row lock (approve/deny) or a plain read (preview).
     * Wrong, expired or already handled => INVALID_PAIRING_CODE.
     */
    private DeviceLink findPendingLink(String pairingCodeRaw, boolean lock) {
        String code = Secrets.normalize(pairingCodeRaw, IdentityConstants.SHORT_CODE_SYMBOLS);
        if (code == null) throw invalidPairingCode();
        String pairingCode = Secrets.formatShort(code);
        Instant now = Timestamps.now(clock);
        return (lock ? store.findActiveDeviceLinkForUpdate(pairingCode, now) : store.findActiveDeviceLink(pairingCode, now))
                .orElseThrow(DeviceLinkService::invalidPairingCode);
    }

    /** Error: the device pairing code is wrong or expired. */
    private static WanderException invalidPairingCode() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_PAIRING_CODE, IdentityMessages.INVALID_PAIRING_CODE, null);
    }
}
