package com.wander.shared.kernel;

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

    @SuppressWarnings("unchecked")
    public static <T> Patch<T> absent() {
        return (Patch<T>) ABSENT;
    }

    public static <T> Patch<T> of(T value) {
        return new Patch<>(true, value);
    }

    public boolean isPresent() {
        return present;
    }

    /** Giá trị đã gửi (có thể null). Chỉ gọi khi {@link #isPresent()}. */
    public T value() {
        if (!present) throw new IllegalStateException("Patch is absent");
        return value;
    }

    public T orElse(T current) {
        return present ? value : current;
    }

    public <R> Patch<R> map(Function<T, R> f) {
        return present ? Patch.of(f.apply(value)) : absent();
    }
}
