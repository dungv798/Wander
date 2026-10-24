package com.wander.identity.application;

import com.wander.identity.application.IdentityViews.Approved;
import com.wander.identity.application.IdentityViews.DeviceLinkCreated;
import com.wander.identity.application.IdentityViews.DeviceLinkStatus;
import com.wander.identity.domain.IdentityModel.DeviceLink;
import com.wander.identity.domain.IdentityModel.LinkState;
import com.wander.identity.domain.IdentityModel.Session;
import com.wander.identity.domain.IdentityStore;
import com.wander.identity.domain.Secrets;
import com.wander.shared.kernel.AuthenticatedPrincipal;
import com.wander.shared.kernel.Ids;
import com.wander.shared.kernel.Timestamps;
import com.wander.shared.kernel.WanderException;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Thiết bị tin cậy duyệt thiết bị mới (D21). RG-1: thiết kế chưa được duyệt. */
@Service
@Transactional
public class DeviceLinkService {

    private final IdentityStore store;
    private final Clock clock;

    public DeviceLinkService(IdentityStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /** Thiết bị mới tự sinh bí mật phiên, chỉ gửi lên để server giữ băm; nhận mã ghép để thiết bị cũ nhập. */
    public DeviceLinkCreated create(Map<String, Object> in) {
        String tokenHash = Secrets.hashToken(RecoveryService.sessionToken(in.get("sessionToken")));
        if (store.isTokenHashInUse(tokenHash)) throw RecoveryService.tokenInUse();
        Instant now = now();
        String pairingCode = Secrets.newShortCode();
        while (store.isPairingCodeActive(pairingCode, now)) pairingCode = Secrets.newShortCode();
        Instant expiresAt = now.plus(RecoveryService.APPROVAL_TTL);
        UUID id = UUID.randomUUID();
        store.saveDeviceLink(new DeviceLink(id, pairingCode, tokenHash, LinkState.PENDING, null, now, expiresAt));
        return new DeviceLinkCreated(id.toString(), pairingCode, Timestamps.format(expiresAt));
    }

    @Transactional(readOnly = true)
    public DeviceLinkStatus status(String requestId) {
        DeviceLink link = Ids.parse(requestId).flatMap(store::findDeviceLink).orElseThrow(WanderException::notFound);
        return new DeviceLinkStatus(link.visibleState(now()).name().toLowerCase(Locale.ROOT));
    }

    /** Thiết bị đã có phiên duyệt: tạo phiên cho bí mật mà thiết bị mới đã tự sinh. Mã ghép dùng một lần. */
    public Approved approve(AuthenticatedPrincipal p, Map<String, Object> in) {
        String code = Secrets.normalize(in.get("pairingCode"), Secrets.SHORT_CODE_SYMBOLS);
        WanderException invalid = WanderException.invalid("INVALID_PAIRING_CODE", "Mã ghép thiết bị không hợp lệ hoặc đã hết hạn.", null);
        if (code == null) throw invalid;
        Instant now = now();
        DeviceLink link = store.findActiveDeviceLinkForUpdate(Secrets.formatShort(code), now).orElseThrow(() -> invalid);
        store.addSession(Session.open(p.identityId(), link.sessionTokenHash(), now));
        store.saveDeviceLink(link.approve(p.identityId()));
        return Approved.YES;
    }

    private Instant now() {
        return Timestamps.truncate(clock.instant());
    }
}
