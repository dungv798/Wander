package com.wander.shared.web.request;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/** Địa chỉ người gọi sau proxy (AD-6): chỉ tin các mục bên phải do hạ tầng của mình thêm vào. */
class ClientAddressTest {

    private static MockHttpServletRequest request(String remote, String... forwardedFor) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        r.setRemoteAddr(remote);
        for (String h : forwardedFor) r.addHeader("X-Forwarded-For", h);
        return r;
    }

    @Test
    @DisplayName("mặc định (0 proxy tin cậy): bỏ qua X-Forwarded-For, kẻ tấn công không tự đặt được địa chỉ")
    void ignoresHeaderWithoutTrustedProxies() {
        ClientAddress direct = new ClientAddress(0);
        assertThat(direct.of(request("10.0.0.5", "203.0.113.7"))).isEqualTo("10.0.0.5");
        assertThat(direct.of(request("10.0.0.5"))).isEqualTo("10.0.0.5");
    }

    @Test
    @DisplayName("IPv6 gộp về /64: cùng một dải không sinh vô hạn khóa; IPv4 và IPv4 nhúng giữ nguyên")
    void groupsIpv6IntoPrefix64() {
        ClientAddress direct = new ClientAddress(0);
        String a = direct.of(request("2001:db8:1:2:aaaa:bbbb:cccc:dddd"));
        assertThat(a).isEqualTo("20010db800010002/64");
        assertThat(direct.of(request("2001:db8:1:2::1"))).as("cùng /64").isEqualTo(a);
        assertThat(direct.of(request("2001:db8:1:3::1"))).as("/64 khác").isNotEqualTo(a);
        assertThat(direct.of(request("203.0.113.7"))).isEqualTo("203.0.113.7");
        assertThat(direct.of(request("::ffff:203.0.113.7"))).as("IPv4 nhúng").isEqualTo("::ffff:203.0.113.7");
    }

    @Test
    @DisplayName("một proxy tin cậy: lấy mục ngoài cùng bên phải")
    void oneTrustedHop() {
        assertThat(new ClientAddress(1).of(request("10.0.0.5", "198.51.100.1, 203.0.113.7"))).isEqualTo("203.0.113.7");
    }

    @Test
    @DisplayName("CloudFront → ALB (2 hop): lấy người xem thật, bỏ qua mục kẻ tấn công thêm ở bên trái")
    void twoTrustedHopsIgnoresSpoofedLeftEntries() {
        ClientAddress behindCloudFront = new ClientAddress(2);
        // [giả mạo..., người xem thật (do CloudFront nối), IP biên CloudFront (do ALB nối)]
        assertThat(behindCloudFront.of(request("10.0.0.5", "1.1.1.1, 2.2.2.2, 203.0.113.7, 130.176.0.9"))).isEqualTo("203.0.113.7");
        assertThat(behindCloudFront.of(request("10.0.0.5", "203.0.113.7, 130.176.0.9"))).isEqualTo("203.0.113.7");
    }

    @Test
    @DisplayName("nhiều dòng header X-Forwarded-For được ghép theo thứ tự")
    void multipleHeaderLines() {
        assertThat(new ClientAddress(2).of(request("10.0.0.5", "1.1.1.1, 203.0.113.7", "130.176.0.9"))).isEqualTo("203.0.113.7");
    }

    @Test
    @DisplayName("danh sách ngắn hơn số proxy tin cậy (lách chuỗi, gọi thẳng ALB): dùng địa chỉ kết nối trực tiếp")
    void shortChainFallsBackToDirect() {
        assertThat(new ClientAddress(2).of(request("10.0.0.5", "203.0.113.7"))).isEqualTo("10.0.0.5");
        assertThat(new ClientAddress(2).of(request("10.0.0.5"))).isEqualTo("10.0.0.5");
    }

    @Test
    @DisplayName("mục không giống địa chỉ IP bị bỏ qua (không dùng chuỗi tùy ý làm khóa bộ đếm); IPv6 được chấp nhận")
    void rejectsNonAddressEntries() {
        ClientAddress one = new ClientAddress(1);
        assertThat(one.of(request("10.0.0.5", "1.1.1.1, <script>"))).isEqualTo("10.0.0.5");
        assertThat(one.of(request("10.0.0.5", "unknown"))).isEqualTo("10.0.0.5");
        assertThat(one.of(request("10.0.0.5", "deadbeef"))).isEqualTo("10.0.0.5");
        assertThat(one.of(request("10.0.0.5", "999.1.1.1"))).isEqualTo("10.0.0.5");
        assertThat(one.of(request("10.0.0.5", "203.0.113.7:443"))).isEqualTo("10.0.0.5");
        assertThat(one.of(request("10.0.0.5", "[2001:db8::1]"))).isEqualTo("10.0.0.5");
        assertThat(one.of(request("10.0.0.5", "1.1.1.1, 2001:db8::1"))).as("IPv6 hợp lệ được chấp nhận, gộp về /64").isEqualTo("20010db800000000/64");
    }

    @Test
    @DisplayName("số proxy tin cậy âm bị từ chối")
    void rejectsNegativeHops() {
        assertThatThrownBy(() -> new ClientAddress(-1)).isInstanceOf(IllegalArgumentException.class);
    }
}
