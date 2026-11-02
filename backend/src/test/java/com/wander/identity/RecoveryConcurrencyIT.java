package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Chạy HTTP đồng thời thật, không coi hai lời gọi tuần tự là bằng chứng chống race. */
class RecoveryConcurrencyIT extends ApiTestSupport {

    private List<Res> race(Callable<Res> left, Callable<Res> right) throws Exception {
        var ready = new CountDownLatch(2);
        var go = new CountDownLatch(1);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = executor.submit(() -> { ready.countDown(); go.await(); return left.call(); });
            var second = executor.submit(() -> { ready.countDown(); go.await(); return right.call(); });
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            go.countDown();
            return List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS));
        }
    }

    private Res start(User user, String attempt, String token) {
        Res result = call("POST", "/api/recovery/start", null,
                map("code", user.recoveryCode(), "attemptId", attempt, "sessionToken", token));
        assertThat(result.status()).isEqualTo(200);
        return result;
    }

    private void oneActiveCode(User user) {
        assertThat(jdbc.sql("SELECT count(*) FROM recovery_codes WHERE identity_id = ?::uuid AND invalidated_at IS NULL")
                .param(user.identityId()).query(Long.class).single()).isEqualTo(1);
    }

    @Test
    @DisplayName("hai recovery đồng thời: một phiên thắng, phiên thua không có quyền, chỉ một mã còn hiệu lực")
    void recoveryAgainstRecovery() throws Exception {
        User user = newUser();
        String firstId = newAttemptId(), secondId = newAttemptId();
        String firstToken = newSessionToken(), secondToken = newSessionToken();
        Res first = start(user, firstId, firstToken), second = start(user, secondId, secondToken);
        List<Res> results = race(
                () -> call("POST", "/api/recovery/complete", null, map("attemptId", firstId, "replacementCode", first.str("replacementCode"))),
                () -> call("POST", "/api/recovery/complete", null, map("attemptId", secondId, "replacementCode", second.str("replacementCode"))));
        assertThat(results).extracting(Res::status).containsExactlyInAnyOrder(200, 409);
        assertThat(List.of(call("GET", "/api/sessions", firstToken).status(), call("GET", "/api/sessions", secondToken).status()))
                .containsExactlyInAnyOrder(200, 401);
        oneActiveCode(user);
    }

    @Test
    @DisplayName("hai xác nhận cùng mã chờ: chỉ một commit, không lỗi 500 hoặc thêm hai mã")
    void replacementAgainstItself() throws Exception {
        User user = newUser();
        Res begun = call("POST", "/api/recovery-code/begin", user.token(), map("evidence", map("type", "code", "code", user.recoveryCode())));
        assertThat(begun.status()).isEqualTo(200);
        var confirmation = map("pendingId", begun.str("pendingId"), "replacementCode", begun.str("replacementCode"));
        List<Res> results = race(() -> call("POST", "/api/recovery-code/confirm", user.token(), confirmation),
                () -> call("POST", "/api/recovery-code/confirm", user.token(), confirmation));
        assertThat(results).extracting(Res::status).containsExactlyInAnyOrder(200, 404);
        oneActiveCode(user);
    }

    @Test
    @DisplayName("recovery và tái tạo cùng mã cũ: một bên thắng, bên kia 409; không mất mã hoặc ghi đè mã mới")
    void recoveryAgainstReplacement() throws Exception {
        User user = newUser();
        String attempt = newAttemptId();
        Res recovery = start(user, attempt, newSessionToken());
        Res begun = call("POST", "/api/recovery-code/begin", user.token(), map("evidence", map("type", "code", "code", user.recoveryCode())));
        assertThat(begun.status()).isEqualTo(200);
        List<Res> results = race(
                () -> call("POST", "/api/recovery/complete", null, map("attemptId", attempt, "replacementCode", recovery.str("replacementCode"))),
                () -> call("POST", "/api/recovery-code/confirm", user.token(),
                        map("pendingId", begun.str("pendingId"), "replacementCode", begun.str("replacementCode"))));
        assertThat(results).extracting(Res::status).containsExactlyInAnyOrder(200, 409);
        oneActiveCode(user);
    }
}
