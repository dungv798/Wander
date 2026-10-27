package com.wander.shared.kernel.util;

import java.util.Arrays;
import java.util.Optional;

/**
 * Giá trị liệt kê có mã ngắn ổn định (dùng trong dữ liệu và API). Enum nào cài giao diện này dùng chung
 * {@link #find(Class, String)} thay vì tự viết lại vòng tìm theo mã.
 */
public interface CodedValue {

    /** Mã ngắn ổn định của giá trị. */
    String code();

    /** Tìm giá trị liệt kê theo mã; mã không có thì trả rỗng. */
    static <E extends Enum<E> & CodedValue> Optional<E> find(Class<E> type, String code) {
        return Arrays.stream(type.getEnumConstants()).filter(value -> value.code().equals(code)).findFirst();
    }
}
