package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** The state of a deletion request (H2): pending, approved, rejected (Q9: the requester sees 'Rejected', with no reason). Changing a code must come with a migration. */
public enum RequestStatus implements CodedValue {
    PENDING("pending"),
    APPROVED("approved"),
    REJECTED("rejected");

    private final String code;

    RequestStatus(String code) {
        this.code = code;
    }

    @Override
    public String code() {
        return code;
    }

    /** The state by stored code; an unknown code is empty. */
    public static Optional<RequestStatus> fromCode(String code) {
        return CodedValue.find(RequestStatus.class, code);
    }
}
