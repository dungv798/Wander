package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.wander.support.ApiTestSupport;
import jakarta.persistence.EntityManagerFactory;
import java.time.Duration;
import java.util.Map;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Guards against the N+1 query problem on the read paths: the number of SQL statements a request prepares must not grow with the amount
 * of data it returns. Each test builds a small and a large data set, waits until the background outbox listener is idle (so it does not
 * add statements of its own), and compares the statement counts Hibernate reports for the same request on both.
 */
class QueryCountIT extends ApiTestSupport {

    /** Upper bound for one read request: measured 6 for a trip and 2 for the trip list; a loop over rows would exceed 8 at once. */
    private static final long MAX_STATEMENTS_PER_READ = 8;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private Statistics statistics;

    @BeforeEach
    void enableStatistics() {
        statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
    }

    /** Waits until no security-event publication is pending, so the listener's own statements cannot be counted as the request's. */
    private void waitForIdleOutbox() {
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(jdbc.sql(
                "SELECT count(*) FROM event_publication WHERE completion_date IS NULL").query(Long.class).single()).isZero());
    }

    /** Number of SQL statements prepared while {@code request} runs. */
    private long statementsDuring(Runnable request) {
        waitForIdleOutbox();
        statistics.clear();
        request.run();
        return statistics.getPrepareStatementCount();
    }

    private void addItems(String token, String trip, int count) {
        for (int i = 0; i < count; i++) {
            newItem(token, trip, Map.of("day", "2026-08-31", "type", "food", "title", "Mục " + i));
        }
    }

    @Test
    @DisplayName("reading one trip prepares the same number of statements for 1 item and for 25 items")
    void tripReadDoesNotGrowWithItems() {
        User user = newUser();
        String small = newTrip(user.token());
        addItems(user.token(), small, 1);
        String large = newTrip(user.token());
        addItems(user.token(), large, 25);

        long forOne = statementsDuring(() -> assertThat(call("GET", "/api/trips/" + small, user.token()).status()).isEqualTo(200));
        long forTwentyFive = statementsDuring(() -> assertThat(call("GET", "/api/trips/" + large, user.token()).status()).isEqualTo(200));

        assertThat(forTwentyFive).as("statements: 1 item = %d, 25 items = %d", forOne, forTwentyFive).isEqualTo(forOne);
        assertThat(forOne).isLessThanOrEqualTo(MAX_STATEMENTS_PER_READ);
    }

    @Test
    @DisplayName("listing trips prepares the same number of statements for 1 trip and for 12 trips")
    void tripListDoesNotGrowWithTrips() {
        User few = newUser();
        newTrip(few.token());
        User many = newUser();
        for (int i = 0; i < 12; i++) {
            addItems(many.token(), newTrip(many.token()), 1);
        }

        long forOne = statementsDuring(() -> assertThat(call("GET", "/api/trips", few.token()).status()).isEqualTo(200));
        long forTwelve = statementsDuring(() -> assertThat(call("GET", "/api/trips", many.token()).status()).isEqualTo(200));

        assertThat(forTwelve).as("statements: 1 trip = %d, 12 trips = %d", forOne, forTwelve).isEqualTo(forOne);
        assertThat(forOne).isLessThanOrEqualTo(MAX_STATEMENTS_PER_READ);
    }
}
