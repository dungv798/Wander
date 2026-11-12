package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * The booking status of an item (A-14, DR-003, Q14). Two states taken from a real trip (plan section 2): 'Awaiting confirmation'
 * (the default for a new item) and 'Booked'. Only item types that have booking have this status ({@link ItemType#supportsBooking()}).
 */
public enum BookingStatus implements CodedValue {
    PENDING("pending", "Chờ xác nhận"),
    BOOKED("booked", "Đã đặt");

    private final String code;
    private final String label;

    BookingStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    @Override
    public String code() {
        return code;
    }

    /** The Vietnamese label shown to the user. */
    public String label() {
        return label;
    }

    /** The status by code in data and API; an unknown code returns empty. */
    public static Optional<BookingStatus> fromCode(String code) {
        return CodedValue.find(BookingStatus.class, code);
    }
}
