package com.wander.shared.kernel.util;

import java.util.List;

/** Sao chép danh sách thành bản bất biến; dùng trong hàm dựng của value object và aggregate. */
public final class ImmutableLists {

    private ImmutableLists() {
    }

    /** Bản sao bất biến của danh sách; null thành danh sách rỗng. */
    public static <T> List<T> copyOrEmpty(List<T> source) {
        return List.copyOf(source == null ? List.of() : source);
    }
}
