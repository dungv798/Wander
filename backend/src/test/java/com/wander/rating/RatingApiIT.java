package com.wander.rating;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Rating Wander cho quán (DR-032): điểm 1–5, lời bình ngắn, tổng hợp từ 1 lượt, báo cáo ẩn lời bình. */
class RatingApiIT extends ApiTestSupport {

    private static String place() {
        return "osm:node:" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String path(String placeRef) {
        return "/api/places/" + placeRef + "/rating";
    }

    @Test
    @DisplayName("cần phiên: không token thì 401; quán chưa ai chấm thì không có trung bình, 0 lượt, không có điểm của mình")
    void requiresSessionAndStartsEmpty() {
        String ref = place();
        assertThat(call("GET", path(ref), null).status()).isEqualTo(401);
        User user = newUser();
        Res empty = call("GET", path(ref), user.token());
        assertThat(empty.status()).isEqualTo(200);
        assertThat(empty.at("rating.summary.average")).isNull();
        assertThat(empty.num("rating.summary.count")).isZero();
        assertThat(empty.at("rating.mine")).isNull();
        assertThat(empty.list("rating.comments")).isEmpty();
    }

    @Test
    @DisplayName("hiện điểm từ 1 lượt; thêm người thứ hai thì trung bình một chữ số; sửa điểm không tăng số lượt; xóa trả về trống")
    void aggregatesFromFirstVoteAndUpserts() {
        String ref = place();
        User a = newUser();
        User b = newUser();
        Res first = call("PUT", path(ref), a.token(), map("stars", 5));
        assertThat(first.status()).isEqualTo(200);
        assertThat(first.num("rating.summary.count")).isEqualTo(1);
        assertThat(first.at("rating.summary.average")).isEqualTo(5.0);
        assertThat(first.num("rating.mine.stars")).isEqualTo(5);

        Res second = call("PUT", path(ref), b.token(), map("stars", 4, "comment", "  Phở ngon,   nước   trong  "));
        assertThat(second.at("rating.summary.average")).isEqualTo(4.5);
        assertThat(second.num("rating.summary.count")).isEqualTo(2);
        assertThat(second.list("rating.comments")).hasSize(1);
        assertThat(second.str("rating.comments.0.comment")).isEqualTo("Phở ngon, nước trong");
        assertThat(second.at("rating.comments.0.mine")).isEqualTo(true);
        assertThat(call("GET", path(ref), a.token()).at("rating.comments.0.mine")).as("A không phải tác giả lời bình của B").isEqualTo(false);
        assertThat(second.toString()).as("không lộ danh tính").doesNotContain(b.identityId());

        Res edited = call("PUT", path(ref), a.token(), map("stars", 3));
        assertThat(edited.num("rating.summary.count")).isEqualTo(2);
        assertThat(edited.at("rating.summary.average")).isEqualTo(3.5);

        Res removed = call("DELETE", path(ref), a.token());
        assertThat(removed.num("rating.summary.count")).isEqualTo(1);
        assertThat(removed.at("rating.mine")).isNull();
        assertThat(call("DELETE", path(ref), a.token()).status()).as("xóa lần nữa vẫn 200, không lỗi").isEqualTo(200);
    }

    @Test
    @DisplayName("dữ liệu sai bị từ chối: điểm ngoài 1–5/thập phân/chuỗi/thiếu, lời bình quá 280 ký tự hoặc ký tự vô hình, mã quán sai dạng")
    void rejectsInvalidInput() {
        String ref = place();
        User user = newUser();
        assertThat(call("PUT", path(ref), user.token(), map("stars", 0)).code()).isEqualTo("OUT_OF_RANGE");
        assertThat(call("PUT", path(ref), user.token(), map("stars", 6)).code()).isEqualTo("OUT_OF_RANGE");
        assertThat(call("PUT", path(ref), user.token(), map("stars", 4.5)).code()).isEqualTo("MALFORMED");
        assertThat(call("PUT", path(ref), user.token(), map("stars", "5")).code()).isEqualTo("MALFORMED");
        assertThat(call("PUT", path(ref), user.token(), map()).code()).isEqualTo("REQUIRED");
        assertThat(call("PUT", path(ref), user.token(), map("stars", 5, "comment", "a".repeat(281))).code()).isEqualTo("TOO_LONG");
        assertThat(call("PUT", path(ref), user.token(), map("stars", 5, "comment", "a".repeat(280))).status()).isEqualTo(200);
        assertThat(call("PUT", path(ref), user.token(), map("stars", 5, "comment", "ẩn​dấu")).code()).isEqualTo("MALFORMED");
        assertThat(call("PUT", path(ref), user.token(), map("stars", 5, "comment", 7)).code()).isEqualTo("MALFORMED");
        assertThat(call("PUT", "/api/places/bad%20ref%3Cscript%3E/rating", user.token(), map("stars", 5)).code()).isEqualTo("MALFORMED");
    }

    @Test
    @DisplayName("báo cáo: đủ 3 người khác nhau thì ẩn lời bình nhưng điểm sao vẫn tính; báo cáo trùng không tính thêm; không báo cáo chính mình")
    void reportsHideCommentButKeepStars() {
        String ref = place();
        User author = newUser();
        Res rated = call("PUT", path(ref), author.token(), map("stars", 2, "comment", "Quán này không tốt"));
        String ratingId = rated.str("rating.comments.0.id");
        String report = "/api/places/" + ref + "/ratings/" + ratingId + "/report";

        Res own = call("POST", report, author.token());
        assertThat(own.status()).isEqualTo(409);
        assertThat(own.code()).isEqualTo("CANNOT_REPORT_OWN");

        User r1 = newUser();
        assertThat(call("POST", report, r1.token()).status()).isEqualTo(204);
        assertThat(call("POST", report, r1.token()).status()).as("trùng người báo cáo vẫn 204").isEqualTo(204);
        assertThat(call("POST", report, newUser().token()).status()).isEqualTo(204);
        assertThat(call("GET", path(ref), r1.token()).list("rating.comments")).as("mới 2 người khác nhau").hasSize(1);
        assertThat(call("POST", report, newUser().token()).status()).isEqualTo(204);

        Res after = call("GET", path(ref), r1.token());
        assertThat(after.list("rating.comments")).as("đủ 3 người khác nhau: ẩn").isEmpty();
        assertThat(after.num("rating.summary.count")).as("điểm sao vẫn tính").isEqualTo(1);
        assertThat(after.at("rating.summary.average")).isEqualTo(2.0);

        assertThat(call("POST", "/api/places/" + ref + "/ratings/" + UUID.randomUUID() + "/report", r1.token()).status()).isEqualTo(404);
        assertThat(call("POST", "/api/places/other-place/ratings/" + ratingId + "/report", r1.token()).status()).as("sai quán").isEqualTo(404);
        assertThat(call("POST", "/api/places/" + ref + "/ratings/not-a-uuid/report", r1.token()).status()).isEqualTo(404);
    }

    @Test
    @DisplayName("đổi sao hoặc gửi lại đúng chữ cũ KHÔNG gỡ ẩn: báo cáo chỉ bị xóa khi lời bình đổi nội dung")
    void resavingSameCommentKeepsReports() {
        String ref = place();
        User author = newUser();
        String ratingId = call("PUT", path(ref), author.token(), map("stars", 3, "comment", "Tạm được")).str("rating.comments.0.id");
        String report = "/api/places/" + ref + "/ratings/" + ratingId + "/report";
        for (int i = 0; i < 3; i++) call("POST", report, newUser().token());
        assertThat(call("PUT", path(ref), author.token(), map("stars", 5, "comment", "Tạm được")).list("rating.comments")).as("đổi sao: vẫn ẩn").isEmpty();
        assertThat(call("PUT", path(ref), author.token(), map("stars", 5, "comment", "Tạm được")).list("rating.comments")).as("gửi lại đúng chữ: vẫn ẩn").isEmpty();
    }

    @Test
    @DisplayName("tác giả đổi nội dung lời bình thì báo cáo cũ bị xóa (nhắm vào nội dung cũ)")
    void resavingClearsOldReports() {
        String ref = place();
        User author = newUser();
        String ratingId = call("PUT", path(ref), author.token(), map("stars", 3, "comment", "Tạm được")).str("rating.comments.0.id");
        String report = "/api/places/" + ref + "/ratings/" + ratingId + "/report";
        for (int i = 0; i < 3; i++) call("POST", report, newUser().token());
        assertThat(call("GET", path(ref), author.token()).list("rating.comments")).isEmpty();
        Res edited = call("PUT", path(ref), author.token(), map("stars", 3, "comment", "Tạm được, phục vụ nhanh"));
        assertThat(edited.list("rating.comments")).hasSize(1);
    }
}
