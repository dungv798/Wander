package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Hợp đồng PATCH bìa cộng thêm, lưu máy chủ và phân quyền DR-031. */
class CoverApiIT extends ApiTestSupport {
    /** Kiểm tra ghi rồi đọc lại cả chi tiết lẫn danh sách. */
    @Test
    @DisplayName("Organizer đổi ảnh và gradient; chi tiết và danh sách giữ bìa sau đọc lại")
    void persistsCover() {
        User organizer = newUser();
        String id = newTrip(organizer.token());
        String path = "/api/trips/" + id;
        for (Map<String, Object> cover : List.of(map("kind", "photo", "ref", "ho-tuyen-lam-1"),
                map("kind", "gradient", "ref", "cover-3"))) {
            Res changed = call("PATCH", path, organizer.token(), map("cover", cover));
            assertThat(changed.status()).isEqualTo(200);
            assertThat(changed.at("trip.cover")).isEqualTo(cover);
            assertThat(call("GET", path, organizer.token()).at("trip.cover")).isEqualTo(cover);
            assertThat(call("GET", "/api/trips", organizer.token()).at("trips.0.cover")).isEqualTo(cover);
        }
    }

    /** Vắng khóa giữ nguyên; null đưa về tự động và không đổi trường khác. */
    @Test
    @DisplayName("tương thích PATCH cũ, mặc định null và null trở về bìa tự động")
    void optionalAndNull() {
        User organizer = newUser();
        String path = "/api/trips/" + newTrip(organizer.token());
        assertThat(call("GET", path, organizer.token()).at("trip.cover")).isNull();
        call("PATCH", path, organizer.token(), map("cover", map("kind", "gradient", "ref", "cover-1")));
        Res renamed = call("PATCH", path, organizer.token(), map("name", "Chuyến có bìa"));
        assertThat(renamed.status()).isEqualTo(200);
        assertThat(renamed.str("trip.cover.ref")).isEqualTo("cover-1");
        Res automatic = call("PATCH", path, organizer.token(), map("cover", null));
        assertThat(automatic.status()).isEqualTo(200);
        assertThat(automatic.at("trip.cover")).isNull();
        assertThat(automatic.str("trip.name")).isEqualTo("Chuyến có bìa");
        assertThat(call("GET", path, organizer.token()).at("trip.cover")).isNull();
        assertThat(call("GET", "/api/trips", organizer.token()).at("trips.0.cover")).isNull();
    }

    /** Dữ liệu sai không làm thay đổi bìa hay tên trong cùng lệnh. */
    @Test
    @DisplayName("mã lạ hoặc sai kiểu trả 400 INVALID_COVER và không ghi một phần")
    void invalidCoverIsAtomic() {
        User organizer = newUser();
        String path = "/api/trips/" + newTrip(organizer.token());
        Map<String, Object> valid = map("kind", "gradient", "ref", "cover-2");
        call("PATCH", path, organizer.token(), map("cover", valid));
        String name = call("GET", path, organizer.token()).str("trip.name");
        for (Object invalid : List.of("cover-1", 1, List.of(), Map.of(), map("kind", "upload", "ref", "abc"),
                map("kind", "gradient", "ref", "cover-7"), map("kind", "photo", "ref", "../abc"),
                map("kind", "photo", "ref", 1), map("kind", "photo", "ref", null), map("ref", "abc"))) {
            Res response = call("PATCH", path, organizer.token(), map("cover", invalid, "name", "Không được lưu"));
            assertThat(response.status()).isEqualTo(400);
            assertThat(response.code()).isEqualTo("INVALID_COVER");
            assertThat(response.str("field")).isEqualTo("cover");
            Res unchanged = call("GET", path, organizer.token());
            assertThat(unchanged.at("trip.cover")).isEqualTo(valid);
            assertThat(unchanged.str("trip.name")).isEqualTo(name);
        }
    }

    /** Quyền được kiểm trước dữ liệu để người ngoài không dò được chuyến. */
    @Test
    @DisplayName("thành viên xem bìa nhưng sửa bị 403 NOT_ORGANIZER; người lạ và mã không có trả 404")
    void organizerOnly() {
        User organizer = newUser();
        User member = newUser();
        User outsider = newUser();
        String path = "/api/trips/" + newTrip(organizer.token());
        String code = call("POST", path + "/invites", organizer.token()).str("invite.code");
        assertThat(call("POST", "/api/invites/join", member.token(), map("code", code, "displayName", "Bạn đi cùng")).status()).isEqualTo(201);
        Map<String, Object> cover = map("kind", "gradient", "ref", "cover-4");
        call("PATCH", path, organizer.token(), map("cover", cover));
        assertThat(call("GET", path, member.token()).at("trip.cover")).isEqualTo(cover);
        for (Object value : new Object[] {cover, null, "sai"}) {
            Res denied = call("PATCH", path, member.token(), map("cover", value));
            assertThat(denied.status()).isEqualTo(403);
            assertThat(denied.code()).isEqualTo("NOT_ORGANIZER");
            assertThat(call("PATCH", path, outsider.token(), map("cover", value)).status()).isEqualTo(404);
        }
        assertThat(call("PATCH", "/api/trips/" + UUID.randomUUID(), organizer.token(), map("cover", cover)).status()).isEqualTo(404);
    }
}
