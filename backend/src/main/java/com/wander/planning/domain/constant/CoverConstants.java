package com.wander.planning.domain.constant;

import java.util.Set;

/** Hằng số bìa chuyến ở tầng chức năng, độc lập catalog (DR-031). */
public final class CoverConstants {
    /** Loại bìa ảnh tuyển từ catalog. */
    public static final String PHOTO = "photo";
    /** Loại bìa gradient có sẵn. */
    public static final String GRADIENT = "gradient";
    /** Sáu mã gradient cố định, trùng token --cover-1..6 của giao diện. */
    public static final Set<String> GRADIENT_REFS = Set.of("cover-1", "cover-2", "cover-3", "cover-4", "cover-5", "cover-6");
    /** Slug ảnh ASCII chữ thường, số và dấu nối đơn; không nhận URL/đường dẫn. */
    public static final String PHOTO_REF_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";
    /** Độ dài tối đa mã ảnh, tính bằng ký tự. */
    public static final int MAX_REF_LENGTH = 120;
    /** Độ dài cột gồm loại, dấu phân cách và mã. */
    public static final int COLUMN_LENGTH = 130;
    /** Dấu ngăn loại và mã trong cột lưu trữ. */
    public static final String SEPARATOR = ":";

    private CoverConstants() {
    }
}
