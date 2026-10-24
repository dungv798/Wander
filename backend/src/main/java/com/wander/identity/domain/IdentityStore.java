package com.wander.identity.domain;

import com.wander.identity.domain.IdentityModel.CodeReplacement;
import com.wander.identity.domain.IdentityModel.DeviceLink;
import com.wander.identity.domain.IdentityModel.Identity;
import com.wander.identity.domain.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.IdentityModel.RecoveryCode;
import com.wander.identity.domain.IdentityModel.Session;
import com.wander.identity.domain.IdentityModel.StepUpRequest;
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
    void addIdentity(Identity identity);

    void addSession(Session session);

    Optional<Session> findSessionByTokenHash(String tokenHash);

    void touchSession(UUID sessionId, Instant now);

    List<Session> activeSessions(UUID identityId);

    Optional<Session> findActiveSession(UUID sessionId, UUID identityId);

    void revokeSession(UUID sessionId, Instant now);

    /** Bí mật phiên đã thuộc về một phiên, một lần khôi phục đang chờ, hoặc một yêu cầu ghép thiết bị đang chờ. */
    boolean isTokenHashInUse(String tokenHash);

    // ---- mã khôi phục ----
    void addRecoveryCode(RecoveryCode code);

    /** Ghi việc vô hiệu mã ngay (flush) trước khi thêm mã mới, vì có ràng buộc "một mã hợp lệ / danh tính". */
    void invalidateRecoveryCode(RecoveryCode invalidated);

    Optional<RecoveryCode> findActiveCodeByHash(String codeHash);

    Optional<RecoveryCode> findActiveCode(UUID identityId);

    Optional<RecoveryCode> findCodeForUpdate(UUID codeId);

    // ---- lần thử khôi phục ----
    Optional<RecoveryAttempt> findAttemptForUpdate(String attemptKey);

    void saveAttempt(RecoveryAttempt attempt);

    // ---- tái tạo mã ----
    void voidPendingReplacements(UUID identityId);

    void saveReplacement(CodeReplacement replacement);

    Optional<CodeReplacement> findPendingReplacement(UUID id, UUID identityId);

    // ---- ghép thiết bị ----
    boolean isPairingCodeActive(String pairingCode, Instant now);

    void saveDeviceLink(DeviceLink link);

    Optional<DeviceLink> findDeviceLink(UUID id);

    Optional<DeviceLink> findActiveDeviceLinkForUpdate(String pairingCode, Instant now);

    // ---- xác thực lại ----
    void saveStepUp(StepUpRequest request);

    Optional<StepUpRequest> findApprovableStepUp(String approvalCode, UUID identityId, UUID notSessionId, Instant now);

    Optional<StepUpRequest> findUsableStepUp(UUID id, UUID identityId, UUID sessionId, String operation, Instant now);
}
