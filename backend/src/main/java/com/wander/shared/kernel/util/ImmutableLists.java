package com.wander.shared.kernel.util;

import java.util.List;

/** Copies a list into an immutable one; used in the constructors of value objects and aggregates. */
public final class ImmutableLists {

    private ImmutableLists() {
    }

    /** An immutable copy of the list; null becomes an empty list. */
    public static <T> List<T> copyOrEmpty(List<T> source) {
        return List.copyOf(source == null ? List.of() : source);
    }
}
