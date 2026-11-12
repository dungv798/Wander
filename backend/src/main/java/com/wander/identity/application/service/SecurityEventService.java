package com.wander.identity.application.service;

import com.wander.identity.application.view.IdentityViews.EventView;
import com.wander.identity.application.view.IdentityViews.EventsView;
import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.model.SecurityEventOccurred;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.vocabulary.EventKind;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Security event log (BE-11): other services record events through {@link #record}, the Security screen reads through {@link #recent} and
 * marks them seen through {@link #markSeen}. Each identity keeps at most {@value IdentityConstants#MAX_EVENTS_PER_IDENTITY} of the latest events.
 */
@Service
@Transactional
public class SecurityEventService {

    private final IdentityStore store;
    private final Clock clock;
    private final ApplicationEventPublisher publisher;

    /** Takes the store (reads), the clock (tests replace it) and the publisher used for the outbox. */
    public SecurityEventService(IdentityStore store, Clock clock, ApplicationEventPublisher publisher) {
        this.store = store;
        this.clock = clock;
        this.publisher = publisher;
    }

    /**
     * Announces a security event of an identity at the current time ({@code deviceName} is a self-declared label, may be null). The
     * event is published inside the caller's transaction and appended to the log by {@link SecurityEventRecorder} after commit, so
     * nothing is announced for an action that rolls back.
     */
    public void record(UUID identityId, EventKind kind, String deviceName) {
        publisher.publishEvent(new SecurityEventOccurred(UUID.randomUUID(), identityId, kind.code(), deviceName, Timestamps.now(clock)));
    }

    /** Recent events (newest first) and the 'unseen' flag. */
    @Transactional(readOnly = true)
    public EventsView recent(UUID identityId) {
        return new EventsView(store.recentEvents(identityId, IdentityConstants.MAX_EVENTS_PER_IDENTITY).stream()
                .map(event -> new EventView(event.kind().code(), event.deviceName(), Timestamps.format(event.occurredAt()))).toList(),
                store.hasUnseenAlert(identityId));
    }

    /** The owner opened the Security screen: turn the 'unseen' flag off until a new device appears. */
    public EventsView markSeen(UUID identityId) {
        store.markEventsSeen(identityId);
        return recent(identityId);
    }
}
