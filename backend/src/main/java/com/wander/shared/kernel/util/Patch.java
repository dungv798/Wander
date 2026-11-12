package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.ErrorMessages;
import java.util.function.Function;

/**
 * A value in a partial-update command (PATCH): distinguishes 'not sent' from 'sent as null'.
 * Example: if {@code note} is not sent it stays unchanged, if {@code note: null} is sent the note is cleared.
 */
public final class Patch<T> {

    private static final Patch<?> ABSENT = new Patch<>(false, null);

    private final boolean present;
    private final T value;

    private Patch(boolean present, T value) {
        this.present = present;
        this.value = value;
    }

    /** The 'not sent' value: the update command must leave this field unchanged. */
    @SuppressWarnings("unchecked")
    public static <T> Patch<T> absent() {
        return (Patch<T>) ABSENT;
    }

    /** The 'sent' value (even null): the update command must set the field to this value. */
    public static <T> Patch<T> of(T value) {
        return new Patch<>(true, value);
    }

    /** Says whether the field was sent. */
    public boolean isPresent() {
        return present;
    }

    /** The value that was sent (may be null). Call only when {@link #isPresent()}. */
    public T value() {
        if (!present) throw new IllegalStateException(ErrorMessages.PATCH_VALUE_ABSENT);
        return value;
    }

    /** The value that was sent if there is one, otherwise the current value is kept. */
    public T orElse(T current) {
        return present ? value : current;
    }

    /** Transforms the value that was sent; 'not sent' stays 'not sent'. */
    public <R> Patch<R> map(Function<T, R> mapper) {
        return present ? Patch.of(mapper.apply(value)) : absent();
    }
}
