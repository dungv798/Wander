package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * DR-018 E1: ghép thiết bị và duyệt xác thực lại có SỐ KHỚP. Máy mới (hoặc máy đang xin) hiện một số hai chữ số; máy duyệt thấy
 * ba lựa chọn (số thật + hai số nhiễu cố định từ lúc tạo yêu cầu) cùng tên máy và thời điểm, và phải chọn đúng. Chọn sai là
 * từ chối vĩnh viễn yêu cầu đó, để kẻ gửi yêu cầu liên tục không thắng bằng cách "mệt vì bị hỏi".
 */
class PairingMatchApiIT extends ApiTestSupport {

    private static final String LINKS = "/api/device-links";

    private record Pending(Res created, String deviceToken) {
        String code() {
            return created.str("pairingCode");
        }

        String requestId() {
            return created.str("requestId");
        }

        long number() {
            return created.num("matchNumber");
        }
    }

    private Pending newLink(String deviceName) {
        String token = newSessionToken();
        Res created = call("POST", LINKS, null, map("sessionToken", token, "deviceName", deviceName));
        assertThat(created.status()).as(String.valueOf(created.body())).isEqualTo(201);
        return new Pending(created, token);
    }

    private List<Long> options(Res preview) {
        List<Long> options = new ArrayList<>();
        for (Object option : preview.list("options")) options.add(((Number) option).longValue());
        return options;
    }

    private long wrongNumber(Pending link) {
        for (long candidate = 10; candidate <= 99; candidate++) if (candidate != link.number()) return candidate;
        throw new AssertionError("không chọn được số sai");
    }

    // ---- ghép thiết bị ----

    @Test
    @DisplayName("tạo yêu cầu ghép trả số khớp hai chữ số cho máy mới; trạng thái chờ")
    void createReturnsMatchNumber() {
        Pending link = newLink("Laptop");
        assertThat(link.number()).isBetween(10L, 99L);
        assertThat(link.code()).matches("^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$");
        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("pending");
    }

    @Test
    @DisplayName("xem trước ở máy duyệt: tên máy, thời điểm, ba lựa chọn gồm số thật; ổn định giữa các lần xem; không đổi trạng thái; cần phiên")
    void previewShowsDeviceAndStableOptions() {
        User u = newUser();
        Pending link = newLink("Laptop của Dũng");

        Res first = call("POST", LINKS + "/preview", u.token(), map("pairingCode", link.code()));
        assertThat(first.status()).as(String.valueOf(first.body())).isEqualTo(200);
        assertThat(first.str("requestId")).isEqualTo(link.requestId());
        assertThat(first.str("deviceName")).isEqualTo("Laptop của Dũng");
        assertThat(first.str("createdAt")).isNotBlank();
        List<Long> options = options(first);
        assertThat(options).hasSize(3).doesNotHaveDuplicates().contains(link.number()).allMatch(n -> n >= 10 && n <= 99);

        for (int i = 0; i < 5; i++) {
            assertThat(options(call("POST", LINKS + "/preview", u.token(), map("pairingCode", link.code()))))
                    .as("số nhiễu cố định, nếu đổi mỗi lần thì xem nhiều lần sẽ lộ số thật").containsExactlyElementsOf(options);
        }
        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("pending");
        assertThat(call("GET", "/api/sessions", link.deviceToken()).status()).as("xem trước không tạo phiên").isEqualTo(401);

        assertThat(call("POST", LINKS + "/preview", null, map("pairingCode", link.code())).status()).isEqualTo(401);
        assertThat(call("POST", LINKS + "/preview", u.token(), map("pairingCode", "AAAA-AAAA")).code()).isEqualTo("INVALID_PAIRING_CODE");
    }

    @Test
    @DisplayName("chọn đúng số: duyệt, máy mới có phiên; mã ghép chỉ dùng một lần")
    void correctNumberApproves() {
        User u = newUser();
        Pending link = newLink("Laptop");
        Res approved = call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", link.number()));
        assertThat(approved.status()).as(String.valueOf(approved.body())).isEqualTo(200);
        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("approved");
        assertThat(call("GET", "/api/sessions", link.deviceToken()).status()).isEqualTo(200);
        assertThat(call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", link.number())).code())
                .isEqualTo("INVALID_PAIRING_CODE");
    }

    @Test
    @DisplayName("chọn sai số: yêu cầu bị từ chối vĩnh viễn (denied), máy mới không có phiên, chọn đúng sau đó cũng không cứu được")
    void wrongNumberDeniesForever() {
        User u = newUser();
        Pending link = newLink("Laptop");
        Res wrong = call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", wrongNumber(link)));
        assertThat(wrong.status()).isEqualTo(403);
        assertThat(wrong.code()).isEqualTo("MATCH_MISMATCH");

        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("denied");
        assertThat(call("GET", "/api/sessions", link.deviceToken()).status()).isEqualTo(401);
        assertThat(call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", link.number())).code())
                .isEqualTo("INVALID_PAIRING_CODE");
        assertThat(call("GET", "/api/sessions", link.deviceToken()).status()).isEqualTo(401);
    }

    @Test
    @DisplayName("số thiếu hoặc sai dạng bị từ chối 400 và KHÔNG làm hỏng yêu cầu (lỗi của giao diện, không phải chọn sai)")
    void malformedNumberDoesNotDeny() {
        User u = newUser();
        Pending link = newLink("Laptop");
        assertThat(call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code())).code()).isEqualTo("REQUIRED");
        for (Object bad : new Object[] {"42", 4.5, 9, 100, -50, List.of(42), true}) {
            Res r = call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", bad));
            assertThat(r.status()).as("number=%s", bad).isEqualTo(400);
            assertThat(r.code()).isEqualTo("MALFORMED");
        }
        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("pending");
        assertThat(call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", link.number())).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("từ chối chủ động: yêu cầu thành denied, không còn duyệt được")
    void explicitDeny() {
        User u = newUser();
        Pending link = newLink("Laptop");
        assertThat(call("POST", LINKS + "/deny", u.token(), map("pairingCode", link.code())).status()).isEqualTo(200);
        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("denied");
        assertThat(call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", link.number())).code())
                .isEqualTo("INVALID_PAIRING_CODE");
        assertThat(call("POST", LINKS + "/deny", null, map("pairingCode", link.code())).status()).isEqualTo(401);
        assertThat(call("POST", LINKS + "/deny", u.token(), map("pairingCode", "AAAA-AAAA")).code()).isEqualTo("INVALID_PAIRING_CODE");
    }

    @Test
    @DisplayName("yêu cầu hết hạn (5 phút): không xem trước, không duyệt, không từ chối; trạng thái expired")
    void expiredLinkIsDead() {
        User u = newUser();
        Pending link = newLink("Laptop");
        jdbc.sql("UPDATE device_links SET expires_at = now() - interval '1 second' WHERE id = ?::uuid").param(link.requestId()).update();
        assertThat(call("POST", LINKS + "/preview", u.token(), map("pairingCode", link.code())).code()).isEqualTo("INVALID_PAIRING_CODE");
        assertThat(call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", link.number())).code())
                .isEqualTo("INVALID_PAIRING_CODE");
        assertThat(call("POST", LINKS + "/deny", u.token(), map("pairingCode", link.code())).code()).isEqualTo("INVALID_PAIRING_CODE");
        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("expired");
    }

    /** Chạy các tác vụ cùng lúc (chờ nhau ở vạch xuất phát) và gom kết quả theo thứ tự tác vụ. */
    private List<Res> runConcurrently(List<java.util.concurrent.Callable<Res>> tasks) throws Exception {
        java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(tasks.size());
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
        try {
            List<java.util.concurrent.Future<Res>> futures = new ArrayList<>();
            for (java.util.concurrent.Callable<Res> task : tasks) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return task.call();
                }));
            }
            start.countDown();
            List<Res> results = new ArrayList<>();
            for (java.util.concurrent.Future<Res> future : futures) results.add(future.get(30, java.util.concurrent.TimeUnit.SECONDS));
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    /** Đếm kết quả: lượt được xử lý (200 duyệt hoặc 403 MATCH_MISMATCH) và lượt báo mã không còn hiệu lực. */
    private record Tally(long processed, long approved, long rejectedAsStale) {
    }

    private Tally tally(List<Res> results, String staleCode) {
        long approved = results.stream().filter(r -> r.status() == 200).count();
        long mismatch = results.stream().filter(r -> r.status() == 403 && "MATCH_MISMATCH".equals(r.code())).count();
        long stale = results.stream().filter(r -> staleCode.equals(r.code())).count();
        return new Tally(approved + mismatch, approved, stale);
    }

    @Test
    @DisplayName("đồng thời (ghép máy): nhiều lượt duyệt cùng lúc với số khác nhau chỉ xử lý yêu cầu ĐÚNG MỘT lần; trạng thái cuối nhất quán")
    void concurrentLinkAnswersResolveExactlyOnce() throws Exception {
        for (int round = 0; round < 8; round++) {
            User u = newUser();
            Pending link = newLink("Laptop");
            List<Long> numbers = options(call("POST", LINKS + "/preview", u.token(), map("pairingCode", link.code())));
            List<java.util.concurrent.Callable<Res>> tasks = new ArrayList<>();
            for (long number : numbers) {
                tasks.add(() -> call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.code(), "number", number)));
            }
            Tally t = tally(runConcurrently(tasks), "INVALID_PAIRING_CODE");
            assertThat(t.processed()).as("vòng %d: đúng một lượt được xử lý", round).isEqualTo(1);
            assertThat(t.rejectedAsStale()).isEqualTo(2);
            String status = call("GET", LINKS + "/" + link.requestId(), null).str("status");
            assertThat(status).isEqualTo(t.approved() == 1 ? "approved" : "denied");
            assertThat(call("GET", "/api/sessions", link.deviceToken()).status()).isEqualTo(t.approved() == 1 ? 200 : 401);
        }
    }

    @Test
    @DisplayName("đồng thời (xác thực lại): nhiều lượt duyệt cùng lúc với số khác nhau chỉ xử lý yêu cầu ĐÚNG MỘT lần, không vừa từ chối vừa duyệt")
    void concurrentStepUpAnswersResolveExactlyOnce() throws Exception {
        for (int round = 0; round < 8; round++) {
            User u = newUser();
            String other = secondDevice(u, "iPad");
            Res request = requestStepUp(u);
            List<Long> numbers = options(call("POST", "/api/step-up/preview", other, map("approvalCode", request.str("approvalCode"))));
            List<java.util.concurrent.Callable<Res>> tasks = new ArrayList<>();
            for (long number : numbers) {
                tasks.add(() -> call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"), "number", number)));
            }
            Tally t = tally(runConcurrently(tasks), "INVALID_APPROVAL_CODE");
            assertThat(t.processed()).as("vòng %d: đúng một lượt được xử lý", round).isEqualTo(1);
            assertThat(t.rejectedAsStale()).isEqualTo(2);
            String state = jdbc.sql("SELECT state FROM step_up_requests WHERE id = ?::uuid").param(request.str("requestId")).query(String.class).single();
            assertThat(state).isEqualTo(t.approved() == 1 ? "approved" : "denied");
        }
    }

    // ---- xác thực lại (step-up) ----

    private Res requestStepUp(User u) {
        Res r = call("POST", "/api/step-up/requests", u.token(), Map.of("operation", "regenerate_code"));
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(201);
        return r;
    }

    private String secondDevice(User u, String name) {
        String token = newSessionToken();
        Res link = call("POST", LINKS, null, map("sessionToken", token, "deviceName", name));
        long number = link.num("matchNumber");
        assertThat(call("POST", LINKS + "/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", number)).status())
                .isEqualTo(200);
        return token;
    }

    @Test
    @DisplayName("step-up: máy đang xin nhận số khớp; máy khác xem trước thao tác và tên máy xin, chọn đúng thì duyệt")
    void stepUpWithMatchNumber() {
        User u = newUser();
        String other = secondDevice(u, "iPad");
        Res request = requestStepUp(u);
        assertThat(request.num("matchNumber")).isBetween(10L, 99L);

        Res preview = call("POST", "/api/step-up/preview", other, map("approvalCode", request.str("approvalCode")));
        assertThat(preview.status()).as(String.valueOf(preview.body())).isEqualTo(200);
        assertThat(preview.str("operation")).isEqualTo("regenerate_code");
        assertThat(preview.at("requesterDeviceName")).as("máy đang xin chưa đặt tên").isNull();
        assertThat(options(preview)).hasSize(3).contains(request.num("matchNumber"));

        assertThat(call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"))).code()).isEqualTo("REQUIRED");
        Res approved = call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"), "number", request.num("matchNumber")));
        assertThat(approved.status()).as(String.valueOf(approved.body())).isEqualTo(200);
    }

    @Test
    @DisplayName("step-up: chọn sai số thì yêu cầu bị từ chối vĩnh viễn; máy đang xin không dùng được; chọn đúng sau đó cũng không cứu")
    void stepUpWrongNumberDenies() {
        User u = newUser();
        String other = secondDevice(u, "iPad");
        Res request = requestStepUp(u);
        long real = request.num("matchNumber");
        long wrong = real == 10 ? 11 : 10;

        Res denied = call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"), "number", wrong));
        assertThat(denied.status()).isEqualTo(403);
        assertThat(denied.code()).isEqualTo("MATCH_MISMATCH");
        assertThat(call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"), "number", real)).code())
                .isEqualTo("INVALID_APPROVAL_CODE");
        Res use = call("POST", "/api/recovery-code/begin", u.token(), Map.of("evidence", Map.of("type", "approval", "requestId", request.str("requestId"))));
        assertThat(use.status()).isEqualTo(403);
        assertThat(use.code()).isEqualTo("STEP_UP_REQUIRED");
    }

    @Test
    @DisplayName("step-up: danh tính khác và chính phiên đang xin đều không xem trước/duyệt/từ chối được (INVALID_APPROVAL_CODE)")
    void stepUpOnlyOtherSessionsOfSameIdentity() {
        User u = newUser();
        String other = secondDevice(u, "iPad");
        User stranger = newUser();
        Res request = requestStepUp(u);
        Map<String, Object> code = map("approvalCode", request.str("approvalCode"));
        Map<String, Object> withNumber = map("approvalCode", request.str("approvalCode"), "number", request.num("matchNumber"));

        for (String token : new String[] {stranger.token(), u.token()}) {
            assertThat(call("POST", "/api/step-up/preview", token, code).code()).isEqualTo("INVALID_APPROVAL_CODE");
            assertThat(call("POST", "/api/step-up/approve", token, withNumber).code()).isEqualTo("INVALID_APPROVAL_CODE");
            assertThat(call("POST", "/api/step-up/deny", token, code).code()).isEqualTo("INVALID_APPROVAL_CODE");
        }
        assertThat(jdbc.sql("SELECT state FROM step_up_requests WHERE id = ?::uuid").param(request.str("requestId")).query(String.class).single())
                .as("không ai trái phép làm đổi trạng thái").isEqualTo("pending");
        assertThat(call("POST", "/api/step-up/approve", other, withNumber).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("step-up hết hạn: không xem trước, không duyệt, không từ chối")
    void expiredStepUpIsDead() {
        User u = newUser();
        String other = secondDevice(u, "iPad");
        Res request = requestStepUp(u);
        jdbc.sql("UPDATE step_up_requests SET expires_at = now() - interval '1 second' WHERE id = ?::uuid").param(request.str("requestId")).update();
        Map<String, Object> code = map("approvalCode", request.str("approvalCode"));
        assertThat(call("POST", "/api/step-up/preview", other, code).code()).isEqualTo("INVALID_APPROVAL_CODE");
        assertThat(call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"), "number", request.num("matchNumber")))
                .code()).isEqualTo("INVALID_APPROVAL_CODE");
        assertThat(call("POST", "/api/step-up/deny", other, code).code()).isEqualTo("INVALID_APPROVAL_CODE");
    }

    @Test
    @DisplayName("phiên đã thu hồi không xem trước/duyệt được (401)")
    void revokedSessionCannotAnswer() {
        User u = newUser();
        String other = secondDevice(u, "iPad");
        Pending link = newLink("Laptop");
        String otherId = null;
        for (Object session : call("GET", "/api/sessions", u.token()).list("sessions")) {
            Map<?, ?> view = (Map<?, ?>) session;
            if (!Boolean.TRUE.equals(view.get("current"))) otherId = (String) view.get("id");
        }
        assertThat(call("DELETE", "/api/sessions/" + otherId, u.token()).status()).isEqualTo(204);
        assertThat(call("POST", LINKS + "/preview", other, map("pairingCode", link.code())).status()).isEqualTo(401);
        assertThat(call("POST", LINKS + "/approve", other, map("pairingCode", link.code(), "number", link.number())).status()).isEqualTo(401);
        assertThat(call("GET", LINKS + "/" + link.requestId(), null).str("status")).isEqualTo("pending");
    }

    @Test
    @DisplayName("đồng thời: một phê duyệt step-up đã duyệt chỉ dùng được ĐÚNG MỘT lần dù hai yêu cầu tạo lại mã chạy cùng lúc")
    void concurrentUseOfApprovalConsumesOnce() throws Exception {
        for (int round = 0; round < 6; round++) {
            User u = newUser();
            String other = secondDevice(u, "iPad");
            Res request = requestStepUp(u);
            assertThat(call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"), "number", request.num("matchNumber")))
                    .status()).isEqualTo(200);
            Map<String, Object> evidence = Map.of("evidence", Map.of("type", "approval", "requestId", request.str("requestId")));
            List<java.util.concurrent.Callable<Res>> tasks = new ArrayList<>();
            for (int i = 0; i < 3; i++) tasks.add(() -> call("POST", "/api/recovery-code/begin", u.token(), evidence));
            long ok = runConcurrently(tasks).stream().filter(r -> r.status() == 200).count();
            assertThat(ok).as("vòng %d: phê duyệt dùng một lần", round).isEqualTo(1);
        }
    }

    @Test
    @DisplayName("step-up: tên máy đang xin hiện cho máy duyệt; từ chối chủ động thì không duyệt được nữa")
    void stepUpShowsRequesterAndCanBeDenied() {
        User u = newUser();
        assertThat(call("PATCH", "/api/sessions/current", u.token(), map("deviceName", "Máy chính")).status()).isEqualTo(200);
        String other = secondDevice(u, "iPad");
        Res request = requestStepUp(u);
        Res preview = call("POST", "/api/step-up/preview", other, map("approvalCode", request.str("approvalCode")));
        assertThat(preview.str("requesterDeviceName")).isEqualTo("Máy chính");

        assertThat(call("POST", "/api/step-up/deny", other, map("approvalCode", request.str("approvalCode"))).status()).isEqualTo(200);
        assertThat(call("POST", "/api/step-up/approve", other, map("approvalCode", request.str("approvalCode"), "number", request.num("matchNumber")))
                .code()).isEqualTo("INVALID_APPROVAL_CODE");
    }
}
