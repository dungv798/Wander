package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.ErrorMessages;
import java.util.function.Function;

/**
 * Giá trị trong lệnh sửa một phần (PATCH): phân biệt "không gửi" với "gửi null".
 * Ví dụ: không gửi {@code note} thì giữ nguyên, gửi {@code note: null} thì xóa ghi chú.
 */
public final class Patch<T> {

    private static final Patch<?> ABSENT = new Patch<>(false, null);

    private final boolean present;
    private final T value;

    private Patch(boolean present, T value) {
        this.present = present;
        this.value = value;
    }

    /** Giá trị "không gửi": lệnh sửa phải giữ nguyên trường này. */
    @SuppressWarnings("unchecked")
    public static <T> Patch<T> absent() {
        return (Patch<T>) ABSENT;
    }

    /** Giá trị "có gửi" (kể cả null): lệnh sửa phải đặt trường theo giá trị này. */
    public static <T> Patch<T> of(T value) {
        return new Patch<>(true, value);
    }

    /** Cho biết trường có được gửi lên hay không. */
    public boolean isPresent() {
        return present;
    }

    /** Giá trị đã gửi (có thể null). Chỉ gọi khi {@link #isPresent()}. */
    public T value() {
        if (!present) throw new IllegalStateException(ErrorMessages.PATCH_VALUE_ABSENT);
        return value;
    }

    /** Giá trị đã gửi nếu có, nếu không thì giữ giá trị hiện tại. */
    public T orElse(T current) {
        return present ? value : current;
    }

    /** Biến đổi giá trị đã gửi; "không gửi" vẫn là "không gửi". */
    public <R> Patch<R> map(Function<T, R> mapper) {
        return present ? Patch.of(mapper.apply(value)) : absent();
    }
}
