package com.wander.identity.application.service;

import com.wander.identity.application.input.IdentityFields;
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
    private final SecurityEventService events;

    /** Nhận cổng lưu trữ, đồng hồ (test thay bằng đồng hồ giả) và nhật ký sự kiện bảo mật. */
    public DeviceLinkService(IdentityStore store, Clock clock, SecurityEventService events) {
        this.store = store;
        this.clock = clock;
        this.events = events;
    }

    /** Thiết bị mới tự sinh bí mật phiên, chỉ gửi lên để server giữ băm; nhận mã ghép để thiết bị cũ nhập. */
    public DeviceLinkCreated createLink(Map<String, Object> input) {
        String tokenHash = Secrets.hashToken(IdentityInput.sessionToken(input.get(IdentityFields.SESSION_TOKEN)));
        String deviceName = IdentityInput.deviceName(input.get(IdentityFields.DEVICE_NAME));
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

    /** Trạng thái hiển thị của yêu cầu ghép (pending, approved, expired); yêu cầu không có thì 404. */
    @Transactional(readOnly = true)
    public DeviceLinkStatus getLinkStatus(String requestId) {
        DeviceLink link = Ids.parse(requestId).flatMap(store::findDeviceLink).orElseThrow(WanderException::notFound);
        return new DeviceLinkStatus(link.visibleState(Timestamps.now(clock)).name().toLowerCase(Locale.ROOT));
    }

    /**
     * Máy duyệt xem trước yêu cầu (DR-018 E1: "thao tác nêu rõ trên máy duyệt"): tên máy tự khai, thời điểm và các lựa chọn số
     * khớp cố định lúc tạo. Không đổi trạng thái, không tạo phiên.
     */
    public LinkPreview previewLink(Map<String, Object> input) {
        DeviceLink link = findPendingLink(input, false);
        return new LinkPreview(link.id().toString(), link.deviceName(), Timestamps.format(link.createdAt()), link.challenge().options());
    }

    /** Máy duyệt từ chối chủ động: yêu cầu thành denied và không bao giờ duyệt lại được. */
    public Denied denyLink(Map<String, Object> input) {
        store.saveDeviceLink(findPendingLink(input, true).deny());
        return Denied.YES;
    }

    /**
     * Thiết bị đã có phiên duyệt bằng cách CHỌN ĐÚNG SỐ KHỚP: tạo phiên cho bí mật mà thiết bị mới đã tự sinh. Mã ghép dùng một
     * lần. Chọn sai ⇒ yêu cầu bị từ chối vĩnh viễn (giữ lại dù ném lỗi, nên {@code noRollbackFor}). Số thiếu/sai dạng bị từ chối
     * trước khi đụng tới yêu cầu. LƯU Ý: mọi {@code WanderException} thêm vào phương thức này SAU lần ghi sẽ commit dở; chỉ ném
     * lỗi trước khi ghi hoặc ngay sau lần ghi từ chối.
     */
    @Transactional(noRollbackFor = WanderException.class)
    public Approved approveLink(AuthenticatedPrincipal principal, Map<String, Object> input) {
        int chosen = IdentityInput.matchNumber(input.get(IdentityFields.NUMBER));
        DeviceLink link = findPendingLink(input, true);
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
     * Yêu cầu ghép đang chờ và còn hạn theo mã ghép người dùng nhập; {@code lock} = khóa dòng (duyệt/từ chối) hay đọc thường (xem
     * trước). Sai, hết hạn hoặc đã xử lý ⇒ INVALID_PAIRING_CODE.
     */
    private DeviceLink findPendingLink(Map<String, Object> input, boolean lock) {
        String code = Secrets.normalize(input.get(IdentityFields.PAIRING_CODE), IdentityConstants.SHORT_CODE_SYMBOLS);
        if (code == null) throw invalidPairingCode();
        String pairingCode = Secrets.formatShort(code);
        Instant now = Timestamps.now(clock);
        return (lock ? store.findActiveDeviceLinkForUpdate(pairingCode, now) : store.findActiveDeviceLink(pairingCode, now))
                .orElseThrow(DeviceLinkService::invalidPairingCode);
    }

    /** Lỗi mã ghép thiết bị sai hoặc hết hạn. */
    private static WanderException invalidPairingCode() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_PAIRING_CODE, IdentityMessages.INVALID_PAIRING_CODE, null);
    }
}
