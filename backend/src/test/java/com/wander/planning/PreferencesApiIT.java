package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BE-10 (PO chọn lưu theo danh tính, 27/10/2026): sở thích "Bạn mê gì?" của onboarding gắn với danh tính chứ không với một chuyến,
 * để theo người dùng sang máy khác. Chỉ là nhãn như {@code trips.interests}; cùng tập mã {@code TripInterest}.
 */
class PreferencesApiIT extends ApiTestSupport {

    private static final String ALL = "/api/preferences";
    private static final String INTERESTS = "/api/preferences/interests";

    @Test
    @DisplayName("mặc định chưa có sở thích nào")
    void defaultsToEmpty() {
        User u = newUser();
        Res r = call("GET", ALL, u.token());
        assertThat(r.status()).isEqualTo(200);
        assertThat(r.list("interests")).isEmpty();
    }

    @Test
    @DisplayName("đặt sở thích: trả mã + nhãn, sắp theo thứ tự cố định và bỏ trùng; đọc lại được")
    void putAndRead() {
        User u = newUser();
        Res put = call("PUT", INTERESTS, u.token(), map("interests", List.of("am", "canh", "am")));
        assertThat(put.status()).as(String.valueOf(put.body())).isEqualTo(200);
        assertThat(put.list("interests")).hasSize(2);
        assertThat(put.str("interests.0.code")).isEqualTo("canh");
        assertThat(put.str("interests.0.label")).isEqualTo("Cảnh quan");
        assertThat(put.str("interests.1.code")).isEqualTo("am");

        Res read = call("GET", ALL, u.token());
        assertThat(read.list("interests")).hasSize(2);
        assertThat(read.str("interests.1.label")).isEqualTo("Ẩm thực");
    }

    @Test
    @DisplayName("PUT thay thế toàn bộ và idempotent; danh sách rỗng hoặc null thì xóa")
    void putReplacesAndClears() {
        User u = newUser();
        call("PUT", INTERESTS, u.token(), map("interests", List.of("van", "leo")));
        assertThat(call("PUT", INTERESTS, u.token(), map("interests", List.of("cho"))).list("interests")).hasSize(1);
        assertThat(call("PUT", INTERESTS, u.token(), map("interests", List.of("cho"))).list("interests")).hasSize(1);
        assertThat(call("GET", ALL, u.token()).str("interests.0.code")).isEqualTo("cho");

        assertThat(call("PUT", INTERESTS, u.token(), map("interests", List.of())).list("interests")).isEmpty();
        call("PUT", INTERESTS, u.token(), map("interests", List.of("luu")));
        assertThat(call("PUT", INTERESTS, u.token(), map("interests", null)).list("interests")).isEmpty();
        assertThat(call("GET", ALL, u.token()).list("interests")).isEmpty();
    }

    @Test
    @DisplayName("giá trị sai bị từ chối và không đổi gì: mã lạ, nhãn tiếng Việt, sai kiểu; thiếu khóa ⇒ REQUIRED")
    void invalidValuesAreRejected() {
        User u = newUser();
        call("PUT", INTERESTS, u.token(), map("interests", List.of("am")));
        for (Object bad : new Object[] {"am", List.of("khong-co"), List.of(1), List.of("Ẩm thực"), Map.of("am", true)}) {
            Res r = call("PUT", INTERESTS, u.token(), map("interests", bad));
            assertThat(r.status()).as("interests=%s", bad).isEqualTo(400);
            assertThat(r.code()).isEqualTo("INVALID_INTEREST");
        }
        Res missing = call("PUT", INTERESTS, u.token(), map("khac", 1));
        assertThat(missing.status()).isEqualTo(400);
        assertThat(missing.code()).isEqualTo("REQUIRED");
        assertThat(call("GET", ALL, u.token()).str("interests.0.code")).as("không đổi sau các lần bị từ chối").isEqualTo("am");
    }

    @Test
    @DisplayName("hai thiết bị cùng đặt sở thích LẦN ĐẦU đồng thời: cả hai thành công (không 500), kết quả cuối là một trong hai")
    void concurrentFirstPutsBothSucceed() throws Exception {
        for (int round = 0; round < 6; round++) {
            User u = newUser();
            java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(2);
            java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
            try {
                List<java.util.concurrent.Future<Res>> futures = new java.util.ArrayList<>();
                for (String code : new String[] {"am", "leo"}) {
                    futures.add(pool.submit(() -> {
                        start.await();
                        return call("PUT", INTERESTS, u.token(), map("interests", List.of(code)));
                    }));
                }
                start.countDown();
                for (java.util.concurrent.Future<Res> f : futures) {
                    Res r = f.get(30, java.util.concurrent.TimeUnit.SECONDS);
                    assertThat(r.status()).as("vòng %d: %s", round, String.valueOf(r.body())).isEqualTo(200);
                }
            } finally {
                pool.shutdownNow();
            }
            Res read = call("GET", ALL, u.token());
            assertThat(read.list("interests")).hasSize(1);
            assertThat(read.str("interests.0.code")).isIn("am", "leo");
        }
    }

    @Test
    @DisplayName("sở thích của danh tính nào chỉ danh tính đó thấy; cần phiên hợp lệ")
    void isolatedPerIdentityAndNeedsSession() {
        User a = newUser();
        User b = newUser();
        call("PUT", INTERESTS, a.token(), map("interests", List.of("leo")));
        assertThat(call("GET", ALL, b.token()).list("interests")).isEmpty();
        assertThat(call("GET", ALL, a.token()).str("interests.0.code")).isEqualTo("leo");

        assertThat(call("GET", ALL, null).status()).isEqualTo(401);
        assertThat(call("PUT", INTERESTS, null, map("interests", List.of("am"))).status()).isEqualTo(401);
    }
}
