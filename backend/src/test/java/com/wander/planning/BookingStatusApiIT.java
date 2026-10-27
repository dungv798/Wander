package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** A-14 (Q14, DR-003): trạng thái đặt chỗ của mục qua API. */
class BookingStatusApiIT extends ApiTestSupport {

    private static final String DAY2 = "2026-08-30";

    @Test
    @DisplayName("mục mới của loại có đặt chỗ mặc định 'Chờ xác nhận'; Nghỉ và Việc cần làm không có")
    void defaultsByType() {
        User u = newUser();
        String trip = newTrip(u.token());
        Res food = call("POST", "/api/trips/" + trip + "/items", u.token(), item(Map.of("type", "food", "title", "Phở")));
        assertThat(food.status()).isEqualTo(201);
        assertThat(food.str("item.booking")).isEqualTo("pending");
        assertThat(food.str("item.bookingLabel")).isEqualTo("Chờ xác nhận");

        Res rest = call("POST", "/api/trips/" + trip + "/items", u.token(), item(Map.of("type", "rest", "title", "Nghỉ")));
        assertThat(rest.status()).isEqualTo(201);
        assertThat(rest.at("item.booking")).isNull();
        assertThat(rest.at("item.bookingLabel")).isNull();
        Res task = call("POST", "/api/trips/" + trip + "/items", u.token(), item(Map.of("type", "task", "title", "In vé")));
        assertThat(task.at("item.booking")).isNull();
    }

    @Test
    @DisplayName("đặt trạng thái khi tạo, đổi sang 'Đã đặt' rồi về 'Chờ xác nhận'; các trường khác giữ nguyên; hiện trong chi tiết chuyến")
    void changeBooking() {
        User u = newUser();
        String trip = newTrip(u.token());
        Res created = call("POST", "/api/trips/" + trip + "/items", u.token(),
                item(Map.of("type", "lodging", "title", "Khách sạn", "cost", 500, "booking", "booked")));
        assertThat(created.str("item.booking")).isEqualTo("booked");
        assertThat(created.str("item.bookingLabel")).isEqualTo("Đã đặt");
        String id = created.str("item.id");

        Res back = call("PATCH", "/api/trips/" + trip + "/items/" + id, u.token(), Map.of("booking", "pending"));
        assertThat(back.status()).isEqualTo(200);
        assertThat(back.str("item.booking")).isEqualTo("pending");
        assertThat(back.str("item.title")).isEqualTo("Khách sạn");
        assertThat(back.num("item.costK")).isEqualTo(500);

        Res booked = call("PATCH", "/api/trips/" + trip + "/items/" + id, u.token(), Map.of("booking", "booked"));
        assertThat(booked.str("item.booking")).isEqualTo("booked");
        // gửi booking: null tường minh = "Chờ xác nhận"; không gửi khóa = giữ nguyên
        Res nulled = call("PATCH", "/api/trips/" + trip + "/items/" + id, u.token(), map("booking", null));
        assertThat(nulled.str("item.booking")).isEqualTo("pending");
        call("PATCH", "/api/trips/" + trip + "/items/" + id, u.token(), Map.of("booking", "booked"));
        // sửa trường khác không đụng tới trạng thái đặt chỗ
        Res retitled = call("PATCH", "/api/trips/" + trip + "/items/" + id, u.token(), Map.of("title", "Khách sạn mới"));
        assertThat(retitled.str("item.booking")).isEqualTo("booked");

        Res detail = call("GET", "/api/trips/" + trip, u.token());
        assertThat(detail.str("days.1.items.0.booking")).isEqualTo("booked");
        assertThat(detail.str("days.1.items.0.bookingLabel")).isEqualTo("Đã đặt");
        assertThat(DAY2).isEqualTo(detail.str("days.1.date"));
    }

    @Test
    @DisplayName("giá trị không hợp lệ bị từ chối; Nghỉ/Việc cần làm không nhận trạng thái; đổi loại sang Nghỉ bỏ trạng thái")
    void validation() {
        User u = newUser();
        String trip = newTrip(u.token());

        Res bad = call("POST", "/api/trips/" + trip + "/items", u.token(), item(Map.of("type", "food", "title", "x", "booking", "maybe")));
        assertThat(bad.status()).isBetween(400, 422);
        assertThat(bad.code()).isEqualTo("INVALID_BOOKING");
        Res badType = call("POST", "/api/trips/" + trip + "/items", u.token(), item(Map.of("type", "food", "title", "x", "booking", 1)));
        assertThat(badType.code()).isEqualTo("INVALID_BOOKING");

        Res restBooked = call("POST", "/api/trips/" + trip + "/items", u.token(),
                item(Map.of("type", "rest", "title", "Nghỉ", "booking", "booked")));
        assertThat(restBooked.status()).isBetween(400, 422);
        assertThat(restBooked.code()).isEqualTo("BOOKING_NOT_APPLICABLE");

        String id = newItem(u.token(), trip, Map.of("type", "tour", "title", "Tour", "booking", "booked"));
        Res toRest = call("PATCH", "/api/trips/" + trip + "/items/" + id, u.token(), Map.of("type", "rest"));
        assertThat(toRest.status()).isEqualTo(200);
        assertThat(toRest.at("item.booking")).isNull();
        Res backToTour = call("PATCH", "/api/trips/" + trip + "/items/" + id, u.token(), Map.of("type", "tour"));
        assertThat(backToTour.str("item.booking")).isEqualTo("pending");

        // chỉ chủ chuyến sửa được (INV-6)
        User other = newUser();
        assertThat(call("PATCH", "/api/trips/" + trip + "/items/" + id, other.token(), Map.of("booking", "booked")).status()).isEqualTo(404);
    }

    @Test
    @DisplayName("trạng thái đặt chỗ được giữ qua xóa mềm và khôi phục")
    void survivesSoftDeleteAndRestore() {
        User u = newUser();
        String trip = newTrip(u.token());
        String id = newItem(u.token(), trip, Map.of("type", "car_rental", "title", "Thuê xe", "booking", "booked"));
        assertThat(call("DELETE", "/api/trips/" + trip + "/items/" + id, u.token()).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + trip + "/trash", u.token()).str("items.0.booking")).isEqualTo("booked");
        Res restored = call("POST", "/api/trips/" + trip + "/items/" + id + "/restore", u.token());
        assertThat(restored.str("item.booking")).isEqualTo("booked");
    }
}
