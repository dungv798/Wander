package com.wander.identity.application.service;

import com.wander.identity.application.view.IdentityViews.EventView;
import com.wander.identity.application.view.IdentityViews.EventsView;
import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.model.IdentityModel.SecurityEvent;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.vocabulary.EventKind;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Nhật ký sự kiện bảo mật (BE-11): các dịch vụ khác ghi sự kiện qua {@link #record}, màn Bảo mật đọc qua {@link #recent} và
 * đánh dấu đã xem qua {@link #markSeen}. Mỗi danh tính giữ tối đa {@value IdentityConstants#MAX_EVENTS_PER_IDENTITY} sự kiện mới nhất.
 */
@Service
@Transactional
public class SecurityEventService {

    private final IdentityStore store;
    private final Clock clock;

    /** Nhận cổng lưu trữ và đồng hồ (test thay bằng đồng hồ giả). */
    public SecurityEventService(IdentityStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /** Ghi một sự kiện của danh tính tại thời điểm hiện tại; {@code deviceName} là nhãn tự khai (có thể null). */
    public void record(UUID identityId, EventKind kind, String deviceName) {
        store.addEvent(new SecurityEvent(identityId, kind, deviceName, Timestamps.now(clock)), IdentityConstants.MAX_EVENTS_PER_IDENTITY);
    }

    /** Sự kiện gần đây (mới nhất trước) và cờ "chưa xem". */
    @Transactional(readOnly = true)
    public EventsView recent(UUID identityId) {
        return new EventsView(store.recentEvents(identityId, IdentityConstants.MAX_EVENTS_PER_IDENTITY).stream()
                .map(event -> new EventView(event.kind().code(), event.deviceName(), Timestamps.format(event.occurredAt()))).toList(),
                store.hasUnseenAlert(identityId));
    }

    /** Chủ đã mở màn Bảo mật: tắt cờ "chưa xem" cho tới khi có thiết bị mới. */
    public EventsView markSeen(UUID identityId) {
        store.markEventsSeen(identityId);
        return recent(identityId);
    }
}
