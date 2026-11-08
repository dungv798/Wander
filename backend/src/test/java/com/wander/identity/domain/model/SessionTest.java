package com.wander.identity.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.model.IdentityModel.Session;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Kiểm tra biên hết hạn phiên bằng thời gian xác định, không cần Spring. */
class SessionTest {

    /** Phiên mất hiệu lực đúng tại hạn trượt, còn trước đó vẫn hợp lệ. */
    @Test
    @DisplayName("phiên hết hạn đúng sau 14 ngày không dùng")
    void idleBoundaryExpiresSession() {
        Session session = Session.open(UUID.randomUUID(), "hash", null, Instant.EPOCH);
        Instant deadline = Instant.EPOCH.plus(IdentityConstants.SESSION_IDLE_DAYS, ChronoUnit.DAYS);
        assertThat(session.isActive(deadline.minusMillis(1))).isTrue();
        assertThat(session.isActive(deadline)).isFalse();
        assertThat(session.isActive(deadline.plusMillis(1))).isFalse();
    }

    /** Ghi last_seen thưa: chỉ ghi lại khi đã qua đúng khoảng tối thiểu, để mỗi yêu cầu không kéo theo một lần ghi DB. */
    @Test
    @DisplayName("chỉ ghi lại last_seen sau khoảng tối thiểu")
    void touchOnlyAfterInterval() {
        Session session = Session.open(UUID.randomUUID(), "hash", null, Instant.EPOCH);
        Instant due = Instant.EPOCH.plus(IdentityConstants.SESSION_TOUCH_INTERVAL_MINUTES, ChronoUnit.MINUTES);
        assertThat(session.needsTouch(Instant.EPOCH)).isFalse();
        assertThat(session.needsTouch(due.minusMillis(1))).isFalse();
        assertThat(session.needsTouch(due)).isTrue();
    }

    /** Hoạt động gần đây không kéo dài phiên vượt trần tuyệt đối. */
    @Test
    @DisplayName("phiên hết hạn đúng sau 90 ngày dù vừa dùng")
    void absoluteBoundaryExpiresRecentlyUsedSession() {
        Instant deadline = Instant.EPOCH.plus(IdentityConstants.SESSION_ABSOLUTE_DAYS, ChronoUnit.DAYS);
        Session session = new Session(UUID.randomUUID(), UUID.randomUUID(), "hash", Instant.EPOCH,
                deadline.minusSeconds(1), null, null);
        assertThat(session.isActive(deadline.minusMillis(1))).isTrue();
        assertThat(session.isActive(deadline)).isFalse();
        assertThat(session.isActive(deadline.plusMillis(1))).isFalse();
    }

    /** Phiên đã thu hồi luôn vô hiệu dù chưa đến hạn. */
    @Test
    @DisplayName("thu hồi phiên có hiệu lực trước cả hai hạn")
    void revokedSessionIsInactive() {
        Session session = new Session(UUID.randomUUID(), UUID.randomUUID(), "hash", Instant.EPOCH,
                Instant.EPOCH, Instant.EPOCH, null);
        assertThat(session.isActive(Instant.EPOCH)).isFalse();
    }
}
