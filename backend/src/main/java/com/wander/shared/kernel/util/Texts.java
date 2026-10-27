package com.wander.shared.kernel.util;

/** Phép xử lý chuỗi nhỏ mà nhiều module cùng cần (một nơi duy nhất để khỏi viết lại). */
public final class Texts {

    private Texts() {
    }

    /** Chuỗi là null, rỗng hoặc chỉ gồm khoảng trắng. */
    public static boolean isNullOrBlank(String text) {
        return text == null || text.isBlank();
    }

    /** Cắt khoảng trắng hai đầu; null thành chuỗi rỗng. */
    public static String trimToEmpty(String text) {
        return text == null ? "" : text.trim();
    }

    /** Cắt khoảng trắng hai đầu; null hoặc chỉ khoảng trắng thành null. */
    public static String trimToNull(String text) {
        return isNullOrBlank(text) ? null : text.trim();
    }
}
