package com.wander.identity.application.service;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.model.IdentityModel.SecurityEvent;
import com.wander.identity.domain.model.SecurityEventOccurred;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.vocabulary.EventKind;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Appends {@link SecurityEventOccurred} events to the identity's activity log, after the publishing transaction has committed, in its own
 * transaction. Idempotent: delivery is at-least-once (a failed or interrupted delivery is retried or resubmitted), and an event id that
 * is already recorded is ignored, so a redelivery never produces a second entry.
 *
 * <p>Why this is an event and not a direct call: the recovery and pairing flows hold pessimistic row locks on the identity, and appending
 * to (and pruning) the log inside that transaction lengthened the lock for no benefit; a failing log write also no longer fails a
 * recovery. The outbox keeps the entry from being lost if the process dies between commit and delivery.
 */
@Component
public class SecurityEventRecorder {

    private final IdentityStore store;
    private final MeterRegistry meters;

    /** Takes the identity store the log is written to and the registry the delivery counters go to. */
    public SecurityEventRecorder(IdentityStore store, MeterRegistry meters) {
        this.store = store;
        this.meters = meters;
    }

    /** Records the event once; a repeated delivery of the same event id does nothing. */
    @ApplicationModuleListener
    public void on(SecurityEventOccurred event) {
        EventKind kind = EventKind.fromCode(event.kind()).orElseThrow();
        boolean recorded = store.addEvent(event.eventId(), new SecurityEvent(event.identityId(), kind, event.deviceName(), event.occurredAt()),
                IdentityConstants.MAX_EVENTS_PER_IDENTITY);
        if (recorded) {
            meters.counter(IdentityConstants.METRIC_EVENTS_RECORDED, IdentityConstants.METRIC_TAG_KIND, event.kind()).increment();
        } else {
            meters.counter(IdentityConstants.METRIC_EVENTS_DUPLICATE).increment();
        }
    }
}
