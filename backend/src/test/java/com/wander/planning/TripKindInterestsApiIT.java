package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * DR-018 F2 / ADR-014: {@code kind} ("ai đi", chọn một) và {@code interests} (sở thích, chọn nhiều) là thuộc tính của chuyến.
 * Chỉ là nhãn như {@code styles} và {@code pace}: không đổi hành vi nào khác.
 */
class TripKindInterestsApiIT extends ApiTestSupport {

    private Res create(User u, Map<String, Object> extra) {
        Map<String, Object> body = map("name", "Hà Giang", "destination", "Hà Giang", "startDate", "2026-08-29", "endDate", "2026-09-06");
        body.putAll(extra);
        return call("POST", "/api/trips", u.token(), body);
    }

    @Test
    @DisplayName("mặc định chưa đặt: kind là null, interests rỗng ở tạo, danh sách và chi tiết")
    void defaultsAreEmpty() {
        User u = newUser();
        Res r = create(u, Map.of());
        assertThat(r.status()).isEqualTo(201);
        assertThat(r.at("trip.kind")).isNull();
        assertThat(r.list("trip.interests")).isEmpty();
        String id = r.str("trip.id");
        assertThat(call("GET", "/api/trips/" + id, u.token()).at("trip.kind")).isNull();
        assertThat(call("GET", "/api/trips", u.token()).list("trips.0.interests")).isEmpty();
    }

    @Test
    @DisplayName("tạo kèm kind và interests: trả mã + nhãn; interests sắp theo thứ tự cố định và bỏ trùng")
    void createWithValues() {
        User u = newUser();
        Res r = create(u, map("kind", "family", "interests", List.of("am", "canh", "am")));
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(201);
        assertThat(r.str("trip.kind.code")).isEqualTo("family");
        assertThat(r.str("trip.kind.label")).isEqualTo("Gia đình");
        assertThat(r.list("trip.interests")).hasSize(2);
        assertThat(r.str("trip.interests.0.code")).isEqualTo("canh");
        assertThat(r.str("trip.interests.0.label")).isEqualTo("Cảnh quan");
        assertThat(r.str("trip.interests.1.code")).isEqualTo("am");
        assertThat(r.str("trip.interests.1.label")).isEqualTo("Ẩm thực");

        Res detail = call("GET", "/api/trips/" + r.str("trip.id"), u.token());
        assertThat(detail.str("trip.kind.code")).isEqualTo("family");
        assertThat(detail.str("trip.interests.1.code")).isEqualTo("am");
        assertThat(call("GET", "/api/trips", u.token()).str("trips.0.kind.label")).isEqualTo("Gia đình");
    }

    @Test
    @DisplayName("sửa: không nêu thì giữ nguyên, null hoặc rỗng thì xóa; sửa tên và lệnh lịch không đụng tới")
    void patchSemantics() {
        User u = newUser();
        String id = create(u, map("kind", "couple", "interests", List.of("van", "leo"))).str("trip.id");
        String path = "/api/trips/" + id;

        Res renamed = call("PATCH", path, u.token(), map("name", "Tên mới"));
        assertThat(renamed.str("trip.kind.code")).isEqualTo("couple");
        assertThat(renamed.list("trip.interests")).hasSize(2);
        Res scheduled = call("POST", path + "/schedule", u.token(), map("endDate", "2026-09-08"));
        assertThat(scheduled.status()).as(String.valueOf(scheduled.body())).isEqualTo(200);
        assertThat(scheduled.str("trip.kind.code")).isEqualTo("couple");
        assertThat(scheduled.list("trip.interests")).hasSize(2);

        assertThat(call("PATCH", path, u.token(), map("kind", "work")).str("trip.kind.code")).isEqualTo("work");
        assertThat(call("PATCH", path, u.token(), map("kind", null)).at("trip.kind")).isNull();
        assertThat(call("PATCH", path, u.token(), map("kind", "solo")).str("trip.kind.code")).isEqualTo("solo");
        assertThat(call("PATCH", path, u.token(), map("kind", "")).at("trip.kind")).isNull();
        assertThat(call("PATCH", path, u.token(), map("interests", List.of("cho"))).str("trip.interests.0.code")).isEqualTo("cho");
        assertThat(call("PATCH", path, u.token(), map("interests", List.of())).list("trip.interests")).isEmpty();
        assertThat(call("PATCH", path, u.token(), map("interests", List.of("luu"))).list("trip.interests")).hasSize(1);
        assertThat(call("PATCH", path, u.token(), map("interests", null)).list("trip.interests")).isEmpty();
    }

    @Test
    @DisplayName("giá trị sai bị từ chối và không đổi gì: mã lạ, nhãn tiếng Việt, sai kiểu")
    void invalidValuesAreRejected() {
        User u = newUser();
        for (Object badKind : new Object[] {"stranger", "Gia đình", 5, List.of("family")}) {
            Res r = create(u, map("kind", badKind));
            assertThat(r.status()).as("kind %s", badKind).isEqualTo(400);
            assertThat(r.code()).isEqualTo("INVALID_KIND");
        }
        for (Object badInterests : new Object[] {"am", List.of("khong-co"), List.of(1), List.of("Ẩm thực"), Map.of("am", true)}) {
            Res r = create(u, map("interests", badInterests));
            assertThat(r.status()).as("interests %s", badInterests).isEqualTo(400);
            assertThat(r.code()).isEqualTo("INVALID_INTEREST");
        }
        String id = create(u, map("kind", "friends", "interests", List.of("am"))).str("trip.id");
        assertThat(call("PATCH", "/api/trips/" + id, u.token(), map("kind", "stranger")).code()).isEqualTo("INVALID_KIND");
        assertThat(call("PATCH", "/api/trips/" + id, u.token(), map("interests", List.of("x"))).code()).isEqualTo("INVALID_INTEREST");
        Res after = call("GET", "/api/trips/" + id, u.token());
        assertThat(after.str("trip.kind.code")).isEqualTo("friends");
        assertThat(after.str("trip.interests.0.code")).isEqualTo("am");
    }
}
