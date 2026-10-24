package com.wander.planning.domain;

import com.wander.shared.kernel.WanderException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.TreeSet;

/**
 * Khoảng ngày của chuyến (R1, R5): gồm cả hai đầu, mỗi ngày lịch là một ngày của chuyến.
 * Value object bất biến; tạo qua {@link #of} nên không bao giờ ở trạng thái sai.
 */
public record DateRange(LocalDate start, LocalDate end) {

    /** Giới hạn độ dài chuyến (mặc định của implementation, docs/implementation/decisions.md). */
    public static final int MAX_DAYS = 366;

    private static final String[] WEEKDAY_LABELS = {"CN", "T2", "T3", "T4", "T5", "T6", "T7"};

    public DateRange {
        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException("DateRange must be created through DateRange.of");
        }
    }

    /** Kiểm tra theo thứ tự của hợp đồng API: END_BEFORE_START rồi TOO_LONG. */
    public static DateRange of(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            throw WanderException.invalid("END_BEFORE_START", "Khoảng ngày của chuyến không hợp lệ.", "endDate");
        }
        if (ChronoUnit.DAYS.between(start, end) + 1 > MAX_DAYS) {
            throw WanderException.invalid("TOO_LONG", "Khoảng ngày của chuyến không hợp lệ.", "endDate");
        }
        return new DateRange(start, end);
    }

    public int dayCount() {
        return (int) ChronoUnit.DAYS.between(start, end) + 1;
    }

    public boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    public List<TripDay> days() {
        List<TripDay> out = new ArrayList<>(dayCount());
        LocalDate d = start;
        for (int i = 1; !d.isAfter(end); i++, d = d.plusDays(1)) {
            int weekday = d.getDayOfWeek().getValue() % 7; // 0 = Chủ nhật … 6 = Thứ bảy
            out.add(new TripDay(d, i, weekday, WEEKDAY_LABELS[weekday]));
        }
        return out;
    }

    /** Các ngày nằm ngoài khoảng (R12), đã sắp xếp, không trùng. */
    public List<LocalDate> outside(Collection<LocalDate> dates) {
        TreeSet<LocalDate> out = new TreeSet<>();
        for (LocalDate d : dates) if (!contains(d)) out.add(d);
        return List.copyOf(out);
    }

    public record TripDay(LocalDate date, int index, int weekday, String weekdayLabel) {
    }
}
