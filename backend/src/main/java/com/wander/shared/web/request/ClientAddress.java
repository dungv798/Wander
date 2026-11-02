package com.wander.shared.web.request;

import com.wander.shared.kernel.constant.CommonConstants;
import com.wander.shared.web.constant.HttpConstants;
import jakarta.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Địa chỉ của người gọi để giới hạn tần suất (AD-6, ADR-006). Sau CloudFront → ALB, địa chỉ kết nối trực tiếp là của
 * ALB nên mọi người chung một bộ đếm; còn tin {@code X-Forwarded-For} thô thì kẻ tấn công tự đặt được địa chỉ.
 * <p>
 * Cách làm: chỉ tin các mục do hạ tầng của mình thêm vào bên PHẢI của {@code X-Forwarded-For}. Mỗi proxy tin cậy
 * (CloudFront, ALB) nối địa chỉ nó thấy vào cuối danh sách, nên với {@code trustedHops = N} người gọi thật là mục thứ N
 * tính từ bên phải; mọi mục bên trái do người gọi tự gửi và bị bỏ qua.
 * <ul>
 *   <li>{@code trustedHops = 0} (mặc định, chạy trực tiếp không proxy): bỏ qua hoàn toàn {@code X-Forwarded-For}.</li>
 *   <li>Danh sách ngắn hơn {@code trustedHops} (yêu cầu không đi qua đủ chuỗi proxy, ví dụ gọi thẳng vào ALB): không tin,
 *       dùng địa chỉ kết nối trực tiếp, nên mọi yêu cầu lách chuỗi dồn vào một bộ đếm chung (đóng theo mặc định).</li>
 *   <li>Mục không giống địa chỉ IP: không tin, dùng địa chỉ kết nối trực tiếp (tránh khóa bộ đếm bằng chuỗi tùy ý).</li>
 * </ul>
 * Phải kết hợp với việc chỉ cho phép ALB nhận lưu lượng từ CloudFront (hạ tầng); xem ADR-006.
 */
public final class ClientAddress {

    private static final Pattern IPV4 = Pattern.compile(ClientAddressConstants.IPV4_REGEX);
    private static final Pattern IPV6 = Pattern.compile(ClientAddressConstants.IPV6_REGEX);

    private final int trustedHops;

    /** Tạo bộ lấy địa chỉ với số proxy tin cậy (không âm). */
    public ClientAddress(int trustedHops) {
        if (trustedHops < 0) throw new IllegalArgumentException(ClientAddressConstants.TRUSTED_HOPS_NEGATIVE_MESSAGE);
        this.trustedHops = trustedHops;
    }

    /** Địa chỉ người gọi đáng tin nhất của yêu cầu; không tin được thì dùng địa chỉ kết nối trực tiếp. */
    public String of(HttpServletRequest request) {
        return groupIpv6Prefix(trustedAddress(request));
    }

    /** Địa chỉ đáng tin nhất trước khi gộp tiền tố IPv6. */
    private String trustedAddress(HttpServletRequest request) {
        String direct = request.getRemoteAddr();
        if (trustedHops == 0) return direct;
        List<String> chain = forwardedChain(request);
        if (chain.size() < trustedHops) return direct;
        String candidate = chain.get(chain.size() - trustedHops);
        return isAddress(candidate) ? candidate : direct;
    }

    /**
     * Gộp địa chỉ IPv6 về tiền tố /64 (một thuê bao thường được cấp cả dải /64 nên không thể coi từng địa chỉ là một người);
     * IPv4, IPv4 nhúng trong IPv6 và chuỗi không phân tích được giữ nguyên.
     */
    static String groupIpv6Prefix(String address) {
        if (!address.contains(ClientAddressConstants.IPV6_SEPARATOR) || !IPV6.matcher(address).matches()) return address;
        try {
            // Chuỗi đã khớp mẫu chỉ gồm hex, ':' và '.', nên getByName không tra DNS.
            byte[] bytes = InetAddress.getByName(address).getAddress();
            if (bytes.length != ClientAddressConstants.IPV6_BYTE_COUNT) return address;
            return HexFormat.of().formatHex(bytes, 0, ClientAddressConstants.IPV6_PREFIX_BYTES) + ClientAddressConstants.IPV6_PREFIX_SUFFIX;
        } catch (UnknownHostException e) {
            return address;
        }
    }

    /** Chuỗi có đúng dạng địa chỉ IPv4 (mỗi nhóm không quá 255) hoặc IPv6 dạng chữ hay không. */
    private static boolean isAddress(String text) {
        Matcher v4 = IPV4.matcher(text);
        if (v4.matches()) return hasValidIpv4Groups(v4);
        return IPV6.matcher(text).matches();
    }

    /** Mọi nhóm của một địa chỉ IPv4 đã khớp mẫu đều không vượt giá trị lớn nhất. */
    private static boolean hasValidIpv4Groups(Matcher ipv4) {
        for (int group = 1; group <= ClientAddressConstants.IPV4_GROUP_COUNT; group++) {
            if (Integer.parseInt(ipv4.group(group)) > ClientAddressConstants.IPV4_GROUP_MAX) return false;
        }
        return true;
    }

    /** Các mục của X-Forwarded-For (qua mọi header cùng tên) theo thứ tự từ trái sang phải, đã bỏ mục rỗng. */
    private static List<String> forwardedChain(HttpServletRequest request) {
        List<String> chain = new ArrayList<>();
        Enumeration<String> headers = request.getHeaders(HttpConstants.HEADER_X_FORWARDED_FOR);
        while (headers != null && headers.hasMoreElements()) {
            addNonEmptyEntries(chain, headers.nextElement());
        }
        return chain;
    }

    /** Tách một giá trị header theo dấu phẩy và thêm các mục không rỗng vào danh sách. */
    private static void addNonEmptyEntries(List<String> chain, String headerValue) {
        for (String part : headerValue.split(CommonConstants.COMMA)) {
            String entry = part.trim();
            if (!entry.isEmpty()) chain.add(entry);
        }
    }
}
