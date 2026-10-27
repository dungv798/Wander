package com.wander.shared.web.request;

import java.util.Collections;
import java.util.Map;

/**
 * Thân JSON dạng đối tượng, đọc "thô" để giữ đúng quy tắc nhập liệu của API:
 * phân biệt khóa vắng mặt với giá trị null và tự kiểm tra kiểu (MALFORMED) thay vì để Jackson ép kiểu.
 */
public final class JsonBody {

    private final Map<String, Object> values;

    /** Bọc các cặp khóa-giá trị đã đọc; null coi như đối tượng rỗng. Kết quả không sửa được. */
    public JsonBody(Map<String, Object> values) {
        this.values = values == null ? Map.of() : Collections.unmodifiableMap(values);
    }

    /** Thân rỗng (không có khóa nào). */
    public static JsonBody empty() {
        return new JsonBody(Map.of());
    }

    /** Khóa có xuất hiện trong thân hay không (kể cả khi giá trị là null). */
    public boolean has(String key) {
        return values.containsKey(key);
    }

    /** Giá trị của khóa, hoặc null nếu vắng mặt hay giá trị null (dùng {@link #has(String)} để phân biệt). */
    public Object get(String key) {
        return values.get(key);
    }

    /** Toàn bộ cặp khóa-giá trị, không sửa được. */
    public Map<String, Object> asMap() {
        return values;
    }
}
