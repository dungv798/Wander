package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
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

    public DateRange {
        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException(PlanningMessages.DATE_RANGE_FACTORY_REQUIRED);
        }
    }

    /** Kiểm tra theo thứ tự của hợp đồng API: END_BEFORE_START rồi TOO_LONG. */
    public static DateRange of(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            throw WanderException.invalid(PlanningErrorCodes.END_BEFORE_START, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        if (ChronoUnit.DAYS.between(start, end) + 1 > PlanningConstants.MAX_DAYS) {
            throw WanderException.invalid(ErrorCodes.TOO_LONG, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        return new DateRange(start, end);
    }

    /** Số ngày của chuyến, tính cả hai đầu. */
    public int dayCount() {
        return (int) ChronoUnit.DAYS.between(start, end) + 1;
    }

    /** Ngày có nằm trong khoảng (gồm cả hai đầu) hay không. */
    public boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    /** Danh sách các ngày của chuyến, kèm số thứ tự (từ 1) và thứ trong tuần (0 = Chủ nhật … 6 = Thứ bảy). */
    public List<TripDay> days() {
        List<TripDay> days = new ArrayList<>(dayCount());
        LocalDate date = start;
        for (int index = 1; !date.isAfter(end); index++, date = date.plusDays(1)) {
            int weekday = date.getDayOfWeek().getValue() % PlanningConstants.DAYS_PER_WEEK;
            days.add(new TripDay(date, index, weekday, PlanningConstants.WEEKDAY_LABELS.get(weekday)));
        }
        return days;
    }

    /** Các ngày nằm ngoài khoảng (R12), đã sắp xếp, không trùng. */
    public List<LocalDate> outside(Collection<LocalDate> dates) {
        TreeSet<LocalDate> outside = new TreeSet<>();
        for (LocalDate date : dates) if (!contains(date)) outside.add(date);
        return List.copyOf(outside);
    }

    /** Một ngày của chuyến: ngày lịch, số thứ tự trong chuyến, thứ trong tuần và nhãn thứ. */
    public record TripDay(LocalDate date, int index, int weekday, String weekdayLabel) {
    }
}
