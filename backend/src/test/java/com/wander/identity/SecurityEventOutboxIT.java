package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.wander.identity.domain.model.SecurityEventOccurred;
import com.wander.support.ApiTestSupport;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.modulith.events.FailedEventPublications;
import org.springframework.modulith.events.ResubmissionOptions;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * The transactional outbox behind the security activity log (ADR-011): an event is stored with the transaction that publishes it, handled
 * after commit, handled at most once effectively even though delivery is at-least-once, and a failed delivery can be resubmitted.
 */
@Import(SecurityEventOutboxIT.FlakyListenerConfig.class)
class SecurityEventOutboxIT extends ApiTestSupport {

    /** Test-only second listener of the same event that fails a configurable number of times before succeeding. */
    @TestConfiguration
    static class FlakyListenerConfig {
        @Bean
        FlakyListener flakyListener() {
            return new FlakyListener();
        }
    }

    /** Fails once for each event id in {@code FAIL_ONCE}, then records the event ids it handled (static: the bean itself is proxied). */
    static class FlakyListener {
        static final java.util.Set<UUID> FAIL_ONCE = java.util.concurrent.ConcurrentHashMap.newKeySet();
        static final java.util.concurrent.CopyOnWriteArrayList<UUID> HANDLED = new java.util.concurrent.CopyOnWriteArrayList<>();

        @ApplicationModuleListener
        public void on(SecurityEventOccurred event) {
            if (FAIL_ONCE.remove(event.eventId())) {
                throw new IllegalStateException("simulated listener failure");
            }
            HANDLED.add(event.eventId());
        }
    }

    @Autowired
    private TransactionTemplate transactions;
    @Autowired
    private ApplicationEventPublisher publisher;
    @Autowired
    private FailedEventPublications failedPublications;

    /** Publishes a security event for the identity inside a new transaction; {@code commit} false rolls the transaction back. */
    private void publish(SecurityEventOccurred event, boolean commit) {
        transactions.executeWithoutResult(status -> {
            publisher.publishEvent(event);
            if (!commit) {
                status.setRollbackOnly();
            }
        });
    }

    private SecurityEventOccurred newEvent(User user) {
        return new SecurityEventOccurred(UUID.randomUUID(), UUID.fromString(user.identityId()), "paired", "Máy thử", Instant.now());
    }

    private long loggedEntries(UUID eventId) {
        return jdbc.sql("SELECT count(*) FROM identity_events WHERE event_id = ?").param(eventId).query(Long.class).single();
    }

    private long publicationsOf(UUID eventId, String listenerLike) {
        return jdbc.sql("SELECT count(*) FROM event_publication WHERE serialized_event LIKE ? AND listener_id LIKE ?")
                .param("%" + eventId + "%").param(listenerLike).query(Long.class).single();
    }

    @Test
    @DisplayName("an action's security event reaches the activity log after commit, and its publication is completed")
    void eventIsRecordedAfterCommit() {
        User user = newUser();
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            Res events = call("GET", "/api/events", user.token());
            assertThat(events.list("events")).as("the creation of the identity is in the log").isNotEmpty();
        });
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(jdbc.sql(
                "SELECT count(*) FROM event_publication WHERE status = 'COMPLETED' AND serialized_event LIKE ?")
                .param("%" + user.identityId() + "%").query(Long.class).single()).isPositive());
    }

    @Test
    @DisplayName("a transaction that rolls back publishes nothing: no outbox row and no log entry")
    void rollbackPublishesNothing() {
        SecurityEventOccurred event = newEvent(newUser());
        publish(event, false);
        await().during(Duration.ofMillis(800)).atMost(Duration.ofSeconds(5)).untilAsserted(() -> {
            assertThat(publicationsOf(event.eventId(), "%")).isZero();
            assertThat(loggedEntries(event.eventId())).isZero();
        });
    }

    @Test
    @DisplayName("delivering the same event twice (at-least-once) leaves exactly one log entry")
    void duplicateDeliveryIsHarmless() {
        SecurityEventOccurred event = newEvent(newUser());
        publish(event, true);
        publish(event, true);
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(publicationsOf(event.eventId(), "%SecurityEventRecorder%")).isEqualTo(2));
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(jdbc.sql(
                "SELECT count(*) FROM event_publication WHERE serialized_event LIKE ? AND listener_id LIKE '%SecurityEventRecorder%' AND completion_date IS NOT NULL")
                .param("%" + event.eventId() + "%").query(Long.class).single()).isEqualTo(2));
        assertThat(loggedEntries(event.eventId())).isEqualTo(1);
    }

    @Test
    @DisplayName("a failing listener leaves a FAILED publication that stays out of the log until it is resubmitted")
    void failedDeliveryCanBeResubmitted() {
        SecurityEventOccurred event = newEvent(newUser());
        FlakyListener.FAIL_ONCE.add(event.eventId());
        publish(event, true);
        String failedOfThisEvent = "SELECT count(*) FROM event_publication WHERE serialized_event LIKE ? AND listener_id LIKE '%FlakyListener%' AND status = 'FAILED'";
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(
                jdbc.sql(failedOfThisEvent).param("%" + event.eventId() + "%").query(Long.class).single()).isEqualTo(1));
        assertThat(FlakyListener.HANDLED).doesNotContain(event.eventId());

        failedPublications.resubmit(ResubmissionOptions.defaults());

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(FlakyListener.HANDLED).contains(event.eventId()));
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(
                jdbc.sql(failedOfThisEvent).param("%" + event.eventId() + "%").query(Long.class).single()).isZero());
        assertThat(loggedEntries(event.eventId())).as("the real recorder was unaffected by the other listener's failure").isEqualTo(1);
    }
}
