package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Trạng thái đặt chỗ của một mục (A-14, DR-003, Q14). Hai trạng thái lấy từ chuyến thật (plan §2): "Chờ xác nhận"
 * (mặc định cho mục mới) và "Đã đặt". Chỉ các loại mục có đặt chỗ mới có trạng thái này ({@link ItemType#supportsBooking()}).
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

    /** Nhãn tiếng Việt hiển thị cho người dùng. */
    public String label() {
        return label;
    }

    /** Trạng thái theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<BookingStatus> fromCode(String code) {
        return CodedValue.find(BookingStatus.class, code);
    }
}
