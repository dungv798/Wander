package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Lát 5 (data-needs §2): tên thiết bị do thiết bị tự khai lúc tạo danh tính, ghép máy hoặc khôi phục; hiện ở danh sách phiên
 * (màn Bảo mật) và đổi được cho chính máy đang dùng. Tên chỉ là nhãn để người dùng nhận ra máy, không dùng để xác thực.
 */
class DeviceNameApiIT extends ApiTestSupport {

    private static final String SESSIONS = "/api/sessions";
    private static final String CURRENT = "/api/sessions/current";

    /** Tên thiết bị của phiên đang dùng trong danh sách phiên. */
    private String currentName(String token) {
        Res list = call("GET", SESSIONS, token);
        for (Object session : list.list("sessions")) {
            Map<?, ?> view = (Map<?, ?>) session;
            if (Boolean.TRUE.equals(view.get("current"))) return (String) view.get("deviceName");
        }
        throw new AssertionError("không có phiên hiện tại trong danh sách");
    }

    @Test
    @DisplayName("tạo danh tính kèm deviceName: được cắt khoảng trắng và hiện ở phiên hiện tại")
    void identityCreationRecordsName() {
        Res created = call("POST", "/api/identity", null, map("skipRecoveryCode", true, "deviceName", "  iPhone của Dũng  "));
        assertThat(created.status()).as(String.valueOf(created.body())).isEqualTo(201);
        assertThat(currentName(created.str("token"))).isEqualTo("iPhone của Dũng");
    }

    @Test
    @DisplayName("deviceName tùy chọn: không nêu hoặc toàn khoảng trắng = chưa đặt tên")
    void nameIsOptional() {
        User plain = newUser();
        assertThat(currentName(plain.token())).isNull();
        Res blank = call("POST", "/api/identity", null, map("skipRecoveryCode", true, "deviceName", "   "));
        assertThat(blank.status()).isEqualTo(201);
        assertThat(currentName(blank.str("token"))).isNull();
    }

    @Test
    @DisplayName("deviceName sai: quá 60 ký tự ⇒ TOO_LONG; không phải chuỗi hoặc có ký tự điều khiển ⇒ MALFORMED; không tạo danh tính")
    void invalidNamesAreRejected() {
        long before = jdbc.sql("SELECT count(*) FROM identities").query(Long.class).single();
        Res tooLong = call("POST", "/api/identity", null, map("deviceName", "x".repeat(61)));
        assertThat(tooLong.status()).isEqualTo(400);
        assertThat(tooLong.code()).isEqualTo("TOO_LONG");
        assertThat(call("POST", "/api/identity", null, map("deviceName", 123)).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", "/api/identity", null, map("deviceName", "a\nb")).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", "/api/identity", null, map("deviceName", "x".repeat(60))).status()).isEqualTo(201);
        assertThat(jdbc.sql("SELECT count(*) FROM identities").query(Long.class).single()).isEqualTo(before + 1);
    }

    @Test
    @DisplayName("an ninh: ký tự định dạng/vô hình của Unicode (RTL override, zero-width, tách dòng, BOM) bị từ chối ở mọi lối vào")
    void invisibleAndBidiCharactersAreRejected() {
        User u = newUser();
        for (String bad : List.of("Lịch‮abc", "​", "a​b", "a b", "﻿x", "x⁦y", "x⁠y", "xy")) {
            assertThat(call("POST", "/api/identity", null, map("deviceName", bad)).code()).as("tạo danh tính: %s", bad).isEqualTo("MALFORMED");
            assertThat(call("PATCH", CURRENT, u.token(), map("deviceName", bad)).code()).as("đổi tên: %s", bad).isEqualTo("MALFORMED");
            assertThat(call("POST", "/api/device-links", null, map("sessionToken", newSessionToken(), "deviceName", bad)).code())
                    .as("ghép máy: %s", bad).isEqualTo("MALFORMED");
        }
        assertThat(currentName(u.token())).isNull();
    }

    @Test
    @DisplayName("tên được chuẩn hóa NFC và gộp khoảng trắng liên tiếp; giới hạn 60 tính theo ký tự (code point) khớp CHECK của DB")
    void namesAreNormalized() {
        Res decomposed = call("POST", "/api/identity", null, map("skipRecoveryCode", true, "deviceName", "Máy   của  Dũng"));
        assertThat(decomposed.status()).isEqualTo(201);
        assertThat(currentName(decomposed.str("token"))).isEqualTo("Máy của Dũng");

        Res sixtyEmoji = call("POST", "/api/identity", null, map("skipRecoveryCode", true, "deviceName", "😀".repeat(60)));
        assertThat(sixtyEmoji.status()).as(String.valueOf(sixtyEmoji.body())).isEqualTo(201);
        assertThat(call("POST", "/api/identity", null, map("deviceName", "😀".repeat(61))).code()).isEqualTo("TOO_LONG");
    }

    @Test
    @DisplayName("đổi tên thiết bị hiện tại: chỉ đổi phiên của chính máy này; trống = xóa tên; thiếu trường ⇒ REQUIRED")
    void renameCurrentDevice() {
        User u = newUser();
        String second = newSessionToken();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", second, "deviceName", "Laptop"));
        assertThat(call("POST", "/api/device-links/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).status()).isEqualTo(200);

        Res renamed = call("PATCH", CURRENT, u.token(), map("deviceName", "Máy bàn"));
        assertThat(renamed.status()).as(String.valueOf(renamed.body())).isEqualTo(200);
        assertThat(renamed.str("deviceName")).isEqualTo("Máy bàn");
        assertThat(renamed.at("current")).isEqualTo(true);
        assertThat(currentName(u.token())).isEqualTo("Máy bàn");
        assertThat(currentName(second)).isEqualTo("Laptop");

        assertThat(call("PATCH", CURRENT, u.token(), map("deviceName", "")).status()).isEqualTo(200);
        assertThat(currentName(u.token())).isNull();
        assertThat(call("PATCH", CURRENT, u.token(), map("khac", "x")).code()).isEqualTo("REQUIRED");
        assertThat(call("PATCH", CURRENT, u.token(), map("deviceName", "y".repeat(61))).code()).isEqualTo("TOO_LONG");
        assertThat(call("PATCH", CURRENT, null, map("deviceName", "Z")).status()).isEqualTo(401);
    }

    @Test
    @DisplayName("ghép thiết bị: tên khai lúc tạo yêu cầu thành tên của phiên mới sau khi được duyệt")
    void deviceLinkCarriesName() {
        User u = newUser();
        String second = newSessionToken();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", second, "deviceName", "iPad"));
        assertThat(link.status()).isEqualTo(201);
        assertThat(call("POST", "/api/device-links/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).status()).isEqualTo(200);
        assertThat(currentName(second)).isEqualTo("iPad");
        List<Object> sessions = call("GET", SESSIONS, u.token()).list("sessions");
        assertThat(sessions).hasSize(2);
    }

    @Test
    @DisplayName("khôi phục: tên khai lúc bắt đầu thành tên của phiên mới khi hoàn tất")
    void recoveryCarriesName() {
        User u = newUser();
        String token = newSessionToken();
        String attempt = newAttemptId();
        Res started = call("POST", "/api/recovery/start", null,
                map("code", u.recoveryCode(), "attemptId", attempt, "sessionToken", token, "deviceName", "Máy mới"));
        assertThat(started.status()).as(String.valueOf(started.body())).isEqualTo(200);
        Res done = call("POST", "/api/recovery/complete", null, map("attemptId", attempt, "replacementCode", started.str("replacementCode")));
        assertThat(done.status()).as(String.valueOf(done.body())).isEqualTo(200);
        assertThat(currentName(token)).isEqualTo("Máy mới");
    }

    @Test
    @DisplayName("khôi phục bắt đầu lại cùng lần thử: tên mới thay tên cũ; không nêu tên thì giữ tên cũ")
    void recoveryRestartKeepsLatestName() {
        User u = newUser();
        String token = newSessionToken();
        String attempt = newAttemptId();
        Res first = call("POST", "/api/recovery/start", null,
                map("code", u.recoveryCode(), "attemptId", attempt, "sessionToken", token, "deviceName", "iPhone Dũng"));
        assertThat(first.status()).isEqualTo(200);
        Res renamed = call("POST", "/api/recovery/start", null,
                map("code", u.recoveryCode(), "attemptId", attempt, "sessionToken", token, "deviceName", "iPhone 15"));
        assertThat(renamed.status()).as(String.valueOf(renamed.body())).isEqualTo(200);
        Res kept = call("POST", "/api/recovery/start", null, map("code", u.recoveryCode(), "attemptId", attempt, "sessionToken", token));
        assertThat(kept.status()).isEqualTo(200);
        assertThat(call("POST", "/api/recovery/complete", null, map("attemptId", attempt, "replacementCode", kept.str("replacementCode")))
                .status()).isEqualTo(200);
        assertThat(currentName(token)).isEqualTo("iPhone 15");
    }

    @Test
    @DisplayName("phiên đã thu hồi không đổi được tên (401); đổi tên máy này không đụng tên máy khác của cùng danh tính")
    void revokedSessionCannotRename() {
        User u = newUser();
        String second = newSessionToken();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", second, "deviceName", "Laptop"));
        call("POST", "/api/device-links/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber")));
        String secondId = null;
        for (Object session : call("GET", SESSIONS, u.token()).list("sessions")) {
            Map<?, ?> view = (Map<?, ?>) session;
            if (!Boolean.TRUE.equals(view.get("current"))) secondId = (String) view.get("id");
        }
        assertThat(call("DELETE", SESSIONS + "/" + secondId, u.token()).status()).isEqualTo(204);
        assertThat(call("PATCH", CURRENT, second, map("deviceName", "Bị chiếm")).status()).isEqualTo(401);
        assertThat(call("PATCH", CURRENT, u.token(), map("deviceName", "Máy chính")).status()).isEqualTo(200);
        Long laptops = jdbc.sql("SELECT count(*) FROM sessions WHERE identity_id = ?::uuid AND device_name = 'Laptop'")
                .param(u.identityId()).query(Long.class).single();
        assertThat(laptops).isEqualTo(1);
    }

    @Test
    @DisplayName("deviceName sai ở ghép thiết bị và khôi phục cũng bị từ chối trước khi ghi gì")
    void invalidNameRejectedOnLinkAndRecovery() {
        User u = newUser();
        long links = jdbc.sql("SELECT count(*) FROM device_links").query(Long.class).single();
        long attempts = jdbc.sql("SELECT count(*) FROM recovery_attempts").query(Long.class).single();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", newSessionToken(), "deviceName", "x".repeat(61)));
        assertThat(link.code()).isEqualTo("TOO_LONG");
        Res start = call("POST", "/api/recovery/start", null,
                map("code", u.recoveryCode(), "attemptId", newAttemptId(), "sessionToken", newSessionToken(), "deviceName", "a\tb"));
        assertThat(start.code()).isEqualTo("MALFORMED");
        assertThat(jdbc.sql("SELECT count(*) FROM device_links").query(Long.class).single()).isEqualTo(links);
        assertThat(jdbc.sql("SELECT count(*) FROM recovery_attempts").query(Long.class).single()).isEqualTo(attempts);
    }
}
