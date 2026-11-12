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
 * The date range of a trip (R1, R5): both ends included, each calendar day is a day of the trip.
 * An immutable value object; created through {@link #of} so it is never in a wrong state.
 */
public record DateRange(LocalDate start, LocalDate end) {

    public DateRange {
        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException(PlanningMessages.DATE_RANGE_FACTORY_REQUIRED);
        }
    }

    /** Validates in the order of the API contract: END_BEFORE_START, then TOO_LONG. */
    public static DateRange of(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            throw WanderException.invalid(PlanningErrorCodes.END_BEFORE_START, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        if (ChronoUnit.DAYS.between(start, end) + 1 > PlanningConstants.MAX_DAYS) {
            throw WanderException.invalid(ErrorCodes.TOO_LONG, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        return new DateRange(start, end);
    }

    /** The number of days of the trip, both ends counted. */
    public int dayCount() {
        return (int) ChronoUnit.DAYS.between(start, end) + 1;
    }

    /** Whether a date is within the range (both ends included). */
    public boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    /** The list of the trip's days, with the ordinal number (from 1) and the weekday (0 = Sunday ... 6 = Saturday). */
    public List<TripDay> days() {
        List<TripDay> days = new ArrayList<>(dayCount());
        LocalDate date = start;
        for (int index = 1; !date.isAfter(end); index++, date = date.plusDays(1)) {
            int weekday = date.getDayOfWeek().getValue() % PlanningConstants.DAYS_PER_WEEK;
            days.add(new TripDay(date, index, weekday, PlanningConstants.WEEKDAY_LABELS.get(weekday)));
        }
        return days;
    }

    /** The days outside the range (R12), sorted, without duplicates. */
    public List<LocalDate> outside(Collection<LocalDate> dates) {
        TreeSet<LocalDate> outside = new TreeSet<>();
        for (LocalDate date : dates) if (!contains(date)) outside.add(date);
        return List.copyOf(outside);
    }

    /** One day of the trip: the calendar date, the ordinal number in the trip, the weekday and the weekday label. */
    public record TripDay(LocalDate date, int index, int weekday, String weekdayLabel) {
    }
}
