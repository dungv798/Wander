package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Vai của một người trong chuyến (Q6, DR-021): hai vai, không có "chỉ xem". Mỗi chuyến đúng một Organizer (chủ chuyến); đổi mã phải
 * kèm migration cho cột {@code trip_members.role}.
 */
public enum MemberRole implements CodedValue {
    ORGANIZER("organizer"),
    MEMBER("member");

    private final String code;

    MemberRole(String code) {
        this.code = code;
    }

    @Override
    public String code() {
        return code;
    }

    /** Vai theo mã đã lưu; mã lạ thì trống. */
    public static Optional<MemberRole> fromCode(String code) {
        return CodedValue.find(MemberRole.class, code);
    }
}
