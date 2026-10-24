package com.wander.shared.web;

import java.util.Collections;
import java.util.Map;

/**
 * Thân JSON dạng đối tượng, đọc "thô" để giữ đúng quy tắc nhập liệu của API:
 * phân biệt khóa vắng mặt với giá trị null và tự kiểm tra kiểu (MALFORMED) thay vì để Jackson ép kiểu.
 */
public final class JsonBody {

    private final Map<String, Object> values;

    public JsonBody(Map<String, Object> values) {
        this.values = values == null ? Map.of() : Collections.unmodifiableMap(values);
    }

    public static JsonBody empty() {
        return new JsonBody(Map.of());
    }

    public boolean has(String key) {
        return values.containsKey(key);
    }

    public Object get(String key) {
        return values.get(key);
    }

    public Map<String, Object> asMap() {
        return values;
    }
}
