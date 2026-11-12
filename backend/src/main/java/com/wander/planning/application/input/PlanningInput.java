package com.wander.planning.application.input;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.Cover;
import com.wander.planning.domain.model.DayAssignment;
import com.wander.planning.domain.rule.ItemText;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.planning.domain.vocabulary.TripKind;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.kernel.util.Ids;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validates and converts the typed request values of the planning API (the JSON layer has already enforced the JSON types).
 * These are the product's input rules (D17: "1.5" or "150k" is a malformed amount, never guessed), so they live in the application
 * layer; every rule keeps its error code and field, and callers apply them in the order the API contract documents.
 */
public final class PlanningInput {

    /** Optional cover: null is automatic; a wrong type shares INVALID_COVER with the domain. */
    public static Cover cover(CoverInput raw) {
        if (raw == null) return null;
        return new Cover(raw.kind(), raw.ref());
    }

    private static final Pattern ISO_DATE = Pattern.compile(PlanningConstants.ISO_DATE_REGEX);
    private static final Pattern TIME = Pattern.compile(PlanningConstants.TIME_OF_DAY_REGEX);
    private static final Pattern DIGITS = Pattern.compile(PlanningConstants.DIGITS_REGEX);
    private static final Pattern NEGATIVE_DIGITS = Pattern.compile(PlanningConstants.NEGATIVE_DIGITS_REGEX);

    private PlanningInput() {
    }

    /** A value that is absent in the API's sense: null or an empty string. */
    public static boolean isMissing(String value) {
        return value == null || value.isEmpty();
    }

    /** A date as YYYY-MM-DD that must be a real calendar date; otherwise returns null. */
    public static LocalDate isoDateOrNull(String text) {
        if (text == null || !ISO_DATE.matcher(text).matches()) return null;
        try {
            return LocalDate.parse(text);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * The list of bulk date assignments: an array of objects {@code {itemId, day?, position?}}. If it is not an array or an element is not
     * an object => MALFORMED; more than {@value PlanningConstants#MAX_ASSIGNMENTS} elements => TOO_MANY; an item id that is not a UUID
     * counts as a non-existent item (404).
     */
    public static List<DayAssignment> assignments(List<AssignmentInput> raw) {
        if (raw == null) throw invalidAssignments();
        if (raw.size() > PlanningConstants.MAX_ASSIGNMENTS) {
            throw WanderException.invalidValue(ErrorCodes.TOO_MANY, PlanningFields.ASSIGNMENTS);
        }
        List<DayAssignment> assignments = new ArrayList<>();
        for (AssignmentInput element : raw) assignments.add(assignment(element));
        return assignments;
    }

    /** Optional date of an item: null = 'no date yet' (DR-011 A1); a value must be exactly as in {@link #day(Object)}. */
    public static LocalDate dayOrNull(String value) {
        return value == null ? null : day(value);
    }

    /** The place id in the catalog: null or blank = not linked; not a string => MALFORMED, a wrong shape is reported as in {@link ItemText#placeId}. */
    public static String placeId(String value) {
        if (value == null) return null;
        return ItemText.placeId(value);
    }

    /** The date of an item; a wrong one reports INVALID_DATE on the {@code day} field. */
    public static LocalDate day(String value) {
        LocalDate date = isoDateOrNull(value);
        if (date == null) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_DATE, PlanningMessages.DAY_INVALID, PlanningFields.DAY);
        }
        return date;
    }

    /** The item type by code; a wrong one reports INVALID_TYPE. */
    public static ItemType type(String code) {
        if (code != null) {
            Optional<ItemType> type = ItemType.fromCode(code);
            if (type.isPresent()) return type.get();
        }
        throw WanderException.invalid(PlanningErrorCodes.INVALID_TYPE, PlanningMessages.TYPE_INVALID, PlanningFields.TYPE);
    }

    /**
     * Booking status (A-14): the string must be 'pending' or 'booked'. An explicit {@code null} means
     * 'Awaiting confirmation' (the default for the item type); to keep it unchanged on edit, do NOT send the {@code booking} key.
     */
    public static BookingStatus booking(String code) {
        if (code == null) return null;
        Optional<BookingStatus> status = BookingStatus.fromCode(code);
        if (status.isPresent()) return status.get();
        throw WanderException.invalid(PlanningErrorCodes.INVALID_BOOKING, PlanningMessages.BOOKING_INVALID, PlanningFields.BOOKING);
    }

    /** Planned budget (Q11): like the D17 cost (thousand VND, a non-negative integer); null or an empty string = not set. */
    public static Long budget(FlexibleNumber value) {
        return amountK(value, PlanningFields.BUDGET);
    }

    /** The tentative-dates flag: null => false (not set); only a real boolean is accepted, the string 'true' or the number 1 is MALFORMED. */
    public static boolean datesTentative(Boolean flag) {
        return flag != null && flag;
    }

    /** Trip kind (Q11): a list of codes; null or an empty string = no kind (like budget and pace). */
    public static List<TripStyle> styles(List<String> raw) {
        if (raw == null) return List.of();
        List<TripStyle> styles = new ArrayList<>();
        for (String code : raw) {
            if (code == null) throw invalidStyle();
            styles.add(TripStyle.fromCode(code).orElseThrow(PlanningInput::invalidStyle));
        }
        return styles;
    }

    /** 'Who is going' (ADR-014): a code or null/empty string = not set; a Vietnamese label or a wrong type is INVALID_KIND. */
    public static TripKind kind(String code) {
        if (isMissing(code)) return null;
        Optional<TripKind> kind = TripKind.fromCode(code);
        if (kind.isPresent()) return kind.get();
        throw WanderException.invalid(PlanningErrorCodes.INVALID_KIND, PlanningMessages.KIND_INVALID, PlanningFields.KIND);
    }

    /** Interests (ADR-014): a list of codes; null or an empty string = none; not a list or an unknown code is INVALID_INTEREST. */
    public static List<TripInterest> interests(List<String> raw) {
        if (raw == null) return List.of();
        List<TripInterest> interests = new ArrayList<>();
        for (String code : raw) {
            if (code == null) throw invalidInterest();
            interests.add(TripInterest.fromCode(code).orElseThrow(PlanningInput::invalidInterest));
        }
        return interests;
    }

    /** Error: invalid interest. */
    private static WanderException invalidInterest() {
        return WanderException.invalid(PlanningErrorCodes.INVALID_INTEREST, PlanningMessages.INTEREST_INVALID, PlanningFields.INTERESTS);
    }

    /** Trip pace (Q11): a code or null/empty string = not set. */
    public static TripPace pace(String code) {
        if (isMissing(code)) return null;
        Optional<TripPace> pace = TripPace.fromCode(code);
        if (pace.isPresent()) return pace.get();
        throw WanderException.invalid(PlanningErrorCodes.INVALID_PACE, PlanningMessages.PACE_INVALID, PlanningFields.PACE);
    }

    /** Item title: required, must be a string; missing is REQUIRED, a wrong type is MALFORMED. */
    public static String title(String text) {
        if (text == null) {
            throw WanderException.invalidValue(ErrorCodes.REQUIRED, PlanningFields.TITLE);
        }
        return ItemText.title(text);
    }

    /** Item note: null stays null; must be a string. */
    public static String note(String text) {
        if (text == null) return null;
        return ItemText.note(text);
    }

    /** Required text of a trip (name, destination). */
    public static String requiredText(String text, int max, String field) {
        if (text == null || text.strip().isEmpty()) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, field);
        }
        return ItemText.required(text, max, field);
    }

    /** Optional time 'HH:MM' in 24 hours; blank => null. */
    public static LocalTime timeOfDay(String raw) {
        if (raw == null) return null;
        String text = raw.strip();
        if (text.isEmpty()) return null;
        Matcher matcher = TIME.matcher(text);
        if (!matcher.matches()) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.TIME_OF_DAY);
        int hour = Integer.parseInt(matcher.group(1));
        int minute = Integer.parseInt(matcher.group(2));
        if (hour > PlanningConstants.MAX_HOUR || minute > PlanningConstants.MAX_MINUTE) {
            throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, PlanningFields.TIME_OF_DAY);
        }
        return LocalTime.of(hour, minute);
    }

    /** Optional duration: an integer number of minutes in [0, 7 days]. A time + duration that passes midnight is still valid (Q18b). */
    public static Integer durationMin(FlexibleNumber value) {
        if (value == null || value.isBlankText()) return null;
        BigDecimal minutes = wholeNumberOrMalformed(value, PlanningFields.DURATION_MIN);
        if (minutes.signum() < 0 || minutes.compareTo(BigDecimal.valueOf(PlanningConstants.MAX_DURATION_MIN)) > 0) {
            throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, PlanningFields.DURATION_MIN);
        }
        return minutes.intValueExact();
    }

    /**
     * Cost (thousand VND) per D17: blank => unknown (null); a non-negative integer; decimals, separators,
     * and currency symbols are all a wrong format.
     */
    public static Long amountK(FlexibleNumber value, String field) {
        if (value == null) return null;
        if (value.number() != null) return amountFromNumber(value.number(), field);
        return amountFromText(value.text().strip(), field);
    }

    /** A required true/false value; a wrong type is MALFORMED. */
    public static boolean bool(Boolean flag, String field) {
        if (flag != null) return flag;
        throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
    }

    /** The requested position: only a number is accepted (the decimal part is cut), otherwise it is ignored. */
    public static Integer position(FlexibleNumber value) {
        if (value == null || value.number() == null) return null;
        BigDecimal decimal = toDecimal(value.number());
        if (decimal == null) return null;
        BigInteger whole = decimal.toBigInteger();
        if (whole.compareTo(BigInteger.valueOf(Integer.MAX_VALUE)) > 0) return Integer.MAX_VALUE;
        if (whole.compareTo(BigInteger.valueOf(Integer.MIN_VALUE)) < 0) return 0;
        return whole.intValue();
    }

    /** One date-assignment element: an object with a valid {@code itemId}, an optional {@code day} and an optional {@code position}. */
    private static DayAssignment assignment(AssignmentInput element) {
        if (element == null) throw invalidAssignments();
        if (element.itemId() == null) throw WanderException.notFound();
        UUID itemId = Ids.parse(element.itemId()).orElseThrow(WanderException::notFound);
        return new DayAssignment(itemId, dayOrNull(element.day()), position(element.position()));
    }

    /** Error: the date-assignment list has the wrong shape. */
    private static WanderException invalidAssignments() {
        return WanderException.invalid(ErrorCodes.MALFORMED, PlanningMessages.ASSIGNMENTS_MALFORMED, PlanningFields.ASSIGNMENTS);
    }

    /** Error: invalid trip kind. */
    private static WanderException invalidStyle() {
        return WanderException.invalid(PlanningErrorCodes.INVALID_STYLE, PlanningMessages.STYLE_INVALID, PlanningFields.STYLES);
    }

    /** An integer (no decimal part) from a JSON number or a string of digits only; any other form reports MALFORMED. */
    private static BigDecimal wholeNumberOrMalformed(FlexibleNumber value, String field) {
        BigDecimal decimal;
        if (value.number() != null) {
            decimal = toDecimal(value.number());
            if (decimal == null) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        } else if (DIGITS.matcher(value.text().strip()).matches()) {
            decimal = new BigDecimal(value.text().strip());
        } else {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        }
        if (decimal.stripTrailingZeros().scale() > 0) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        return decimal;
    }

    /** A cost from a JSON number: must be a finite integer, not negative, not too large. */
    private static Long amountFromNumber(Number number, String field) {
        BigDecimal decimal = toDecimal(number);
        if (decimal == null || decimal.stripTrailingZeros().scale() > 0) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        return checkedAmount(decimal, field);
    }

    /** A cost from a trimmed string: empty => null; only digits are accepted; a negative number and a too-large number have their own error codes. */
    private static Long amountFromText(String text, String field) {
        if (text.isEmpty()) return null;
        if (NEGATIVE_DIGITS.matcher(text).matches()) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, field);
        if (!DIGITS.matcher(text).matches()) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        if (text.replaceFirst(PlanningConstants.LEADING_ZEROS_REGEX, "").length() > PlanningConstants.MAX_AMOUNT_DIGITS) {
            throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, field);
        }
        return checkedAmount(new BigDecimal(text), field);
    }

    /** The number is already an integer: not negative and not above the maximum. */
    private static Long checkedAmount(BigDecimal amount, String field) {
        if (amount.signum() < 0) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, field);
        if (amount.compareTo(BigDecimal.valueOf(PlanningConstants.MAX_COST_K)) > 0) {
            throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, field);
        }
        return amount.longValueExact();
    }

    /** A JSON number -> BigDecimal; NaN/infinity => null. */
    private static BigDecimal toDecimal(Number number) {
        if (number instanceof BigDecimal decimal) return decimal;
        if (number instanceof BigInteger integer) return new BigDecimal(integer);
        if (number instanceof Double || number instanceof Float) {
            double value = number.doubleValue();
            if (Double.isNaN(value) || Double.isInfinite(value)) return null;
            return BigDecimal.valueOf(value);
        }
        return BigDecimal.valueOf(number.longValue());
    }
}
