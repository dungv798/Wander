package com.wander.identity.application.service;

import com.wander.identity.application.input.IdentityFields;
import com.wander.identity.application.input.IdentityInput;
import com.wander.identity.application.view.IdentityViews.Approved;
import com.wander.identity.application.view.IdentityViews.DeviceLinkCreated;
import com.wander.identity.application.view.IdentityViews.DeviceLinkStatus;
import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.model.IdentityModel.DeviceLink;
import com.wander.identity.domain.model.IdentityModel.LinkState;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.rule.Secrets;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
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

    /** Nhận cổng lưu trữ và đồng hồ (test thay bằng đồng hồ giả). */
    public DeviceLinkService(IdentityStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /** Thiết bị mới tự sinh bí mật phiên, chỉ gửi lên để server giữ băm; nhận mã ghép để thiết bị cũ nhập. */
    public DeviceLinkCreated createLink(Map<String, Object> input) {
        String tokenHash = Secrets.hashToken(IdentityInput.sessionToken(input.get(IdentityFields.SESSION_TOKEN)));
        if (store.isTokenHashInUse(tokenHash)) throw IdentityInput.tokenInUse();
        Instant now = Timestamps.now(clock);
        String pairingCode = Secrets.newShortCode();
        while (store.isPairingCodeActive(pairingCode, now)) pairingCode = Secrets.newShortCode();
        Instant expiresAt = now.plus(IdentityConstants.APPROVAL_TTL);
        UUID id = UUID.randomUUID();
        store.saveDeviceLink(new DeviceLink(id, pairingCode, tokenHash, LinkState.PENDING, null, now, expiresAt));
        return new DeviceLinkCreated(id.toString(), pairingCode, Timestamps.format(expiresAt));
    }

    /** Trạng thái hiển thị của yêu cầu ghép (pending, approved, expired); yêu cầu không có thì 404. */
    @Transactional(readOnly = true)
    public DeviceLinkStatus getLinkStatus(String requestId) {
        DeviceLink link = Ids.parse(requestId).flatMap(store::findDeviceLink).orElseThrow(WanderException::notFound);
        return new DeviceLinkStatus(link.visibleState(Timestamps.now(clock)).name().toLowerCase(Locale.ROOT));
    }

    /** Thiết bị đã có phiên duyệt: tạo phiên cho bí mật mà thiết bị mới đã tự sinh. Mã ghép dùng một lần. */
    public Approved approveLink(AuthenticatedPrincipal principal, Map<String, Object> input) {
        String code = Secrets.normalize(input.get(IdentityFields.PAIRING_CODE), IdentityConstants.SHORT_CODE_SYMBOLS);
        if (code == null) throw invalidPairingCode();
        Instant now = Timestamps.now(clock);
        DeviceLink link = store.findActiveDeviceLinkForUpdate(Secrets.formatShort(code), now)
                .orElseThrow(DeviceLinkService::invalidPairingCode);
        store.addSession(Session.open(principal.identityId(), link.sessionTokenHash(), now));
        store.saveDeviceLink(link.approve(principal.identityId()));
        return Approved.YES;
    }

    /** Lỗi mã ghép thiết bị sai hoặc hết hạn. */
    private static WanderException invalidPairingCode() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_PAIRING_CODE, IdentityMessages.INVALID_PAIRING_CODE, null);
    }
}
