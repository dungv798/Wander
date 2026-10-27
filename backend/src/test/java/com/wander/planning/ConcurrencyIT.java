package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.port.TripRepository;
import com.wander.support.ApiTestSupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Khóa lạc quan theo chuyến (ADR-003 §4): hai người cùng sửa một chuyến không ghi đè âm thầm.
 * Chuẩn bị cho Q8 (1b) và cho hai thiết bị cùng mở một chuyến ở 1a.
 */
class ConcurrencyIT extends ApiTestSupport {

    @Autowired
    private TripRepository trips;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("hai giao dịch nạp cùng một phiên bản chuyến: lần lưu sau bị từ chối (xác định, không phụ thuộc thời điểm)")
    void staleSaveIsRejected() {
        User u = newUser();
        UUID owner = UUID.fromString(u.identityId());
        UUID tripId = UUID.fromString(newTrip(u.token()));
        TransactionTemplate tx = new TransactionTemplate(transactionManager);

        Trip first = tx.execute(s -> trips.findOwned(tripId, owner).orElseThrow());
        Trip second = tx.execute(s -> trips.findOwned(tripId, owner).orElseThrow());
        assertThat(first.version()).isEqualTo(second.version());

        first.changeDetails("Bản của thiết bị A", first.destination(), first.range(), Instant.now());
        tx.executeWithoutResult(s -> trips.save(first));

        second.changeDetails("Bản của thiết bị B", second.destination(), second.range(), Instant.now());
        assertThatThrownBy(() -> tx.executeWithoutResult(s -> trips.save(second)))
                .isInstanceOf(OptimisticLockingFailureException.class);

        // bản của thiết bị A thắng, bản B không ghi đè
        assertThat(call("GET", "/api/trips/" + tripId, u.token()).str("trip.name")).isEqualTo("Bản của thiết bị A");
    }

    @Test
    @DisplayName("HTTP: sửa chuyến bị một giao dịch khác chen ngang ⇒ 409 CONCURRENT_MODIFICATION và không ghi đè (xác định)")
    void interleavedUpdateReturns409() throws Exception {
        User u = newUser();
        String trip = newTrip(u.token());
        String originalName = call("GET", "/api/trips/" + trip, u.token()).str("trip.name");
        ExecutorService pool = Executors.newSingleThreadExecutor();
        Future<Res> patch;
        // Kết nối JDBC riêng, giao dịch mở: giữ khóa dòng chưa commit (không phụ thuộc cách Spring gắn giao dịch).
        try (Connection other = dataSource.getConnection()) {
            other.setAutoCommit(false);
            try (PreparedStatement st = other.prepareStatement("UPDATE trips SET version = version + 1 WHERE id = ?::uuid")) {
                // "Thiết bị khác" đang ghi: tăng version và GIỮ khóa dòng.
                st.setString(1, trip);
                assertThat(st.executeUpdate()).isEqualTo(1);
            }
            // Thiết bị này đọc bản cũ (MVCC không bị chặn), rồi UPDATE của nó phải chờ khóa.
            patch = pool.submit(() -> call("PATCH", "/api/trips/" + trip, u.token(), Map.of("name", "Bản của thiết bị B")));
            awaitBlockedTripUpdate();
            other.commit(); // nhả khóa; UPDATE đang chờ đánh giá lại điều kiện version và không khớp hàng nào
        }
        try {
            Res res = patch.get(15, TimeUnit.SECONDS);
            assertThat(res.status()).as(String.valueOf(res.body())).isEqualTo(409);
            assertThat(res.code()).isEqualTo("CONCURRENT_MODIFICATION");
            assertThat(call("GET", "/api/trips/" + trip, u.token()).str("trip.name")).as("không ghi đè âm thầm").isEqualTo(originalName);
        } finally {
            pool.shutdownNow();
        }
    }

    /** Chờ (tối đa 10 giây) tới khi có một UPDATE chuyến đang bị chặn chờ khóa; hết giờ thì kịch bản chen ngang không xảy ra. */
    private void awaitBlockedTripUpdate() {
        await().alias("UPDATE chuyến phải bị chặn chờ khóa (kịch bản chen ngang)")
                .atMost(Duration.ofSeconds(10))
                .pollInterval(Duration.ofMillis(50))
                .until(() -> jdbc.sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query ILIKE 'update trips%'")
                        .query(Long.class).single() > 0);
    }

    @Test
    @DisplayName("nhiều yêu cầu song song cùng một chuyến: mỗi yêu cầu hoặc 201 hoặc 409 CONCURRENT_MODIFICATION, không mất cập nhật nào (có thể không phát sinh 409 nếu tuần tự hóa)")
    void parallelWritesNeverLoseUpdates() throws Exception {
        User u = newUser();
        String trip = newTrip(u.token());
        int n = 8;
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(n);
        try {
            List<Future<Res>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                String title = "Mục song song " + i;
                futures.add(pool.submit(() -> {
                    start.await();
                    return call("POST", "/api/trips/" + trip + "/items", u.token(), item(Map.of("type", "food", "title", title)));
                }));
            }
            start.countDown();
            int created = 0;
            for (Future<Res> f : futures) {
                Res r = f.get();
                if (r.status() == 201) {
                    created++;
                } else {
                    assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(409);
                    assertThat(r.code()).isEqualTo("CONCURRENT_MODIFICATION");
                }
            }
            assertThat(created).as("ít nhất một yêu cầu phải thắng").isGreaterThanOrEqualTo(1);
            List<Object> items = call("GET", "/api/trips/" + trip, u.token()).list("days.1.items");
            assertThat(items).as("số mục lưu được = số yêu cầu 201 (không ghi đè âm thầm)").hasSize(created);
        } finally {
            pool.shutdownNow();
        }
    }
}
