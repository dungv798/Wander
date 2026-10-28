package com.wander.shared.kernel.constant;

/**
 * Hằng số tầng NỀN (common base): giá trị chung không mang nghĩa nghiệp vụ, mọi module được dùng.
 * Quy ước: docs/architecture/backend-conventions.md (CON-1). Giá trị mang nghĩa hệ thống nằm ở {@link SystemConstants},
 * giá trị riêng của một chức năng nằm ở tệp {@code *Constants} cạnh chức năng đó.
 */
public final class CommonConstants {

    /** Số byte trong một kilobyte. */
    public static final int BYTES_PER_KILOBYTE = 1024;

    /** Dấu phẩy dùng để tách danh sách chuỗi. */
    public static final String COMMA = ",";

    /** Dấu gạch chéo dùng để nối đường dẫn. */
    public static final String SLASH = "/";

    /** Chuỗi UUID dạng chữ: tám-bốn-bốn-bốn-mười hai ký tự hex. */
    public static final String UUID_TEXT_REGEX =
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    /** Mẫu ISO-8601 UTC luôn có mili-giây, ví dụ 2026-10-24T01:02:03.000Z. */
    public static final String ISO_INSTANT_MILLIS_PATTERN = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    /** Mọi chuỗi khoảng trắng (kể cả khoảng trắng Unicode) trong nhãn tự khai. */
    public static final String LABEL_WHITESPACE_REGEX = "[\\p{Zs}\\s]+";

    /** Một dấu cách. */
    public static final String SINGLE_SPACE = " ";

    private CommonConstants() {
    }
}
