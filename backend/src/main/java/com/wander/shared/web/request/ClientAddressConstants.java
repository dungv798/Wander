package com.wander.shared.web.request;

/** Hằng số riêng của chức năng lấy địa chỉ người gọi ({@link ClientAddress}). */
final class ClientAddressConstants {

    /** IPv4 dạng bốn nhóm số thập phân, mỗi nhóm 1–3 chữ số. */
    static final String IPV4_REGEX = "^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$";

    /** IPv6 dạng chữ: ít nhất hai dấu hai chấm, chỉ hex, ':' và '.' (IPv4 nhúng); không nhận cổng hay ngoặc. */
    static final String IPV6_REGEX = "^(?=(?:[^:]*:){2})[0-9a-fA-F:.]{3,45}$";

    /** Số nhóm của một địa chỉ IPv4. */
    static final int IPV4_GROUP_COUNT = 4;

    /** Giá trị lớn nhất của một nhóm IPv4. */
    static final int IPV4_GROUP_MAX = 255;

    /** Lỗi lập trình: số proxy tin cậy âm. */
    static final String TRUSTED_HOPS_NEGATIVE_MESSAGE = "trustedHops phải >= 0";

    private ClientAddressConstants() {
    }
}
