package com.wander.shared.kernel.util;

import java.util.Arrays;
import java.util.Optional;

/**
 * An enumeration value with a short stable code (used in data and the API). Every enum that implements this interface uses the shared
 * {@link #find(Class, String)} instead of rewriting a lookup loop by code.
 */
public interface CodedValue {

    /** The short stable code of the value. */
    String code();

    /** Finds an enumeration value by code; returns empty if there is no such code. */
    static <E extends Enum<E> & CodedValue> Optional<E> find(Class<E> type, String code) {
        return Arrays.stream(type.getEnumConstants()).filter(value -> value.code().equals(code)).findFirst();
    }
}
