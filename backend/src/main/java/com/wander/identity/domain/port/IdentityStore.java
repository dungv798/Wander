package com.wander.identity.domain.port;

import com.wander.identity.domain.model.IdentityModel.CodeReplacement;
import com.wander.identity.domain.model.IdentityModel.DeviceLink;
import com.wander.identity.domain.model.IdentityModel.Identity;
import com.wander.identity.domain.model.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.model.IdentityModel.RecoveryCode;
import com.wander.identity.domain.model.IdentityModel.SecurityEvent;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.model.IdentityModel.StepUpRequest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Cổng lưu trữ của Identity (port). Phương thức có chữ {@code ForUpdate} khóa dòng (SELECT … FOR UPDATE)
 * để hai yêu cầu đồng thời không cùng tiêu thụ một mã (INV-7).
 */
public interface IdentityStore {

    // ---- danh tính, phiên ----

    /** Lưu danh tính mới. */
    void addIdentity(Identity identity);

    /** Lưu phiên mới. */
    void addSession(Session session);

    /** Phiên theo băm bí mật (còn hiệu lực hay không do người gọi kiểm tra). */
    Optional<Session> findSessionByTokenHash(String tokenHash);

    /** Ghi thời điểm phiên được dùng gần nhất. */
    void touchSession(UUID sessionId, Instant now);

    /** Các phiên chưa bị thu hồi của danh tính, theo thứ tự tạo. */
    List<Session> activeSessions(UUID identityId);

    /** Phiên chưa bị thu hồi của đúng danh tính này; phiên của người khác coi như không có. */
    Optional<Session> findActiveSession(UUID sessionId, UUID identityId);

    /** Ghi một sự kiện bảo mật rồi cắt bớt, chỉ giữ {@code keepLatest} sự kiện mới nhất của danh tính. */
    void addEvent(SecurityEvent event, int keepLatest);

    /** Tối đa {@code limit} sự kiện gần nhất của danh tính, mới nhất trước. */
    List<SecurityEvent> recentEvents(UUID identityId, int limit);

    /** Có sự kiện thêm thiết bị (ghép, khôi phục) mới hơn lần xem gần nhất không. */
    boolean hasUnseenAlert(UUID identityId);

    /** Ghi mốc "đã xem" của danh tính: mọi sự kiện hiện có coi như đã thấy. */
    void markEventsSeen(UUID identityId);

    /** Thu hồi một phiên. */
    void revokeSession(UUID sessionId, Instant now);

    /** Đặt hoặc xóa (null) tên thiết bị của một phiên. */
    void renameSession(UUID sessionId, String deviceName);

    /** Bí mật phiên đã thuộc về một phiên, một lần khôi phục đang chờ, hoặc một yêu cầu ghép thiết bị đang chờ. */
    boolean isTokenHashInUse(String tokenHash);

    // ---- mã khôi phục ----

    /** Lưu mã khôi phục mới. */
    void addRecoveryCode(RecoveryCode code);

    /** Ghi việc vô hiệu mã ngay (flush) trước khi thêm mã mới, vì có ràng buộc "một mã hợp lệ / danh tính". */
    void invalidateRecoveryCode(RecoveryCode invalidated);

    /** Mã còn hợp lệ theo băm. */
    Optional<RecoveryCode> findActiveCodeByHash(String codeHash);

    /** Mã còn hợp lệ của danh tính (nếu đã có). */
    Optional<RecoveryCode> findActiveCode(UUID identityId);

    /** Mã theo id, khóa dòng để hai lần khôi phục đồng thời cùng một mã chỉ một lần thắng. */
    Optional<RecoveryCode> findCodeForUpdate(UUID codeId);

    // ---- lần thử khôi phục ----

    /** Lần thử theo mã nhận diện, khóa dòng. */
    Optional<RecoveryAttempt> findAttemptForUpdate(String attemptKey);

    /** Lưu lần thử (thêm mới hoặc cập nhật). */
    void saveAttempt(RecoveryAttempt attempt);

    // ---- tái tạo mã ----

    /** Hủy mọi mã thay thế đang chờ của danh tính (chỉ có một mã chờ tại mọi thời điểm). */
    void voidPendingReplacements(UUID identityId);

    /** Lưu mã thay thế (thêm mới hoặc cập nhật). */
    void saveReplacement(CodeReplacement replacement);

    /** Mã thay thế đang chờ của đúng danh tính này. */
    Optional<CodeReplacement> findPendingReplacement(UUID id, UUID identityId);

    // ---- ghép thiết bị ----

    /** Mã ghép đang được một yêu cầu còn hạn dùng. */
    boolean isPairingCodeActive(String pairingCode, Instant now);

    /** Lưu yêu cầu ghép thiết bị (thêm mới hoặc cập nhật). */
    void saveDeviceLink(DeviceLink link);

    /** Yêu cầu ghép thiết bị theo id. */
    Optional<DeviceLink> findDeviceLink(UUID id);

    /** Yêu cầu ghép còn chờ và còn hạn theo mã ghép, đọc không khóa (xem trước). */
    Optional<DeviceLink> findActiveDeviceLink(String pairingCode, Instant now);

    /** Yêu cầu ghép còn chờ và còn hạn theo mã ghép, khóa dòng để mã chỉ dùng một lần. */
    Optional<DeviceLink> findActiveDeviceLinkForUpdate(String pairingCode, Instant now);

    // ---- xác thực lại ----

    /** Lưu yêu cầu xác thực lại (thêm mới hoặc cập nhật). */
    void saveStepUp(StepUpRequest request);

    /** Như {@link #findApprovableStepUp} nhưng khóa dòng: duyệt/từ chối đồng thời chỉ một lượt thắng. */
    Optional<StepUpRequest> findApprovableStepUpForUpdate(String approvalCode, UUID identityId, UUID notSessionId, Instant now);

    /** Yêu cầu có thể duyệt: đúng mã, đúng danh tính, đang chờ, còn hạn và do một phiên KHÁC xin (đọc không khóa). */
    Optional<StepUpRequest> findApprovableStepUp(String approvalCode, UUID identityId, UUID notSessionId, Instant now);

    /** Yêu cầu đã được duyệt và dùng được cho đúng phiên, đúng thao tác, còn hạn; khóa dòng để phê duyệt chỉ dùng một lần. */
    Optional<StepUpRequest> findUsableStepUp(UUID id, UUID identityId, UUID sessionId, String operation, Instant now);
}
