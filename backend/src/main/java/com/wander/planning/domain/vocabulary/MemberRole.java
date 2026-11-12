package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * The role of a person in a trip (Q6, DR-021): two roles, no 'view only'. Each trip has exactly one Organizer (the trip owner); changing a code must
 * come with a migration for the column {@code trip_members.role}.
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

    /** The role by stored code; an unknown code is empty. */
    public static Optional<MemberRole> fromCode(String code) {
        return CodedValue.find(MemberRole.class, code);
    }
}
