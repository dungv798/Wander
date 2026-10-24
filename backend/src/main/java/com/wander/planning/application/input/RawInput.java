package com.wander.planning.application.input;

import com.wander.planning.domain.CostInfo;
import com.wander.planning.domain.Item;
import com.wander.planning.domain.ItemText;
import com.wander.planning.domain.ItemType;
import com.wander.shared.kernel.WanderException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Chuyển giá trị JSON "thô" (String, Number, Boolean, null) thành giá trị đã kiểm tra.
 * Đây là quy tắc nhập liệu của sản phẩm (D17: "1.5" hay "150k" là định dạng sai, không tự đoán),
 * nên nằm ở tầng application chứ không giao cho Jackson ép kiểu.
 */
public final class RawInput {

    private static final Pattern ISO_DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern TIME = Pattern.compile("^(\\d{2}):(\\d{2})$");
    private static final Pattern DIGITS = Pattern.compile("^\\d+$");
    private static final Pattern NEGATIVE_DIGITS = Pattern.compile("^-\\d+$");

    private RawInput() {
    }

    /** Ngày dạng YYYY-MM-DD, phải là ngày lịch có thật. */
    public static LocalDate isoDateOrNull(Object v) {
        if (!(v instanceof String s) || !ISO_DATE.matcher(s).matches()) return null;
        try {
            return LocalDate.parse(s);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    public static LocalDate day(Object v) {
        LocalDate d = isoDateOrNull(v);
        if (d == null) throw WanderException.invalid("INVALID_DATE", "Ngày không hợp lệ.", "day");
        return d;
    }

    public static ItemType type(Object v) {
        if (v instanceof String s) {
            var t = ItemType.fromCode(s);
            if (t.isPresent()) return t.get();
        }
        throw WanderException.invalid("INVALID_TYPE", "Loại mục không hợp lệ.", "type");
    }

    public static String title(Object v) {
        if (!(v instanceof String s)) throw WanderException.invalidValue(v == null ? "REQUIRED" : "MALFORMED", "title");
        return ItemText.title(s);
    }

    public static String note(Object v) {
        if (v == null) return null;
        if (!(v instanceof String s)) throw WanderException.invalidValue("MALFORMED", "note");
        return ItemText.note(s);
    }

    /** Văn bản bắt buộc của chuyến (tên, điểm đến). */
    public static String requiredText(Object v, int max, String field) {
        if (!(v instanceof String s) || s.strip().isEmpty()) {
            throw WanderException.invalid("REQUIRED", "Trường này là bắt buộc.", field);
        }
        return ItemText.required(s, max, field);
    }

    /** Giờ tùy chọn "HH:MM" 24 giờ; trống ⇒ null. */
    public static LocalTime timeOfDay(Object v) {
        if (v == null) return null;
        if (!(v instanceof String raw)) throw WanderException.invalidValue("MALFORMED", "timeOfDay");
        String s = raw.strip();
        if (s.isEmpty()) return null;
        Matcher m = TIME.matcher(s);
        if (!m.matches()) throw WanderException.invalidValue("MALFORMED", "timeOfDay");
        int h = Integer.parseInt(m.group(1));
        int min = Integer.parseInt(m.group(2));
        if (h > 23 || min > 59) throw WanderException.invalidValue("OUT_OF_RANGE", "timeOfDay");
        return LocalTime.of(h, min);
    }

    /** Thời lượng tùy chọn: số nguyên phút trong [0, 7 ngày]. Giờ + thời lượng qua nửa đêm vẫn hợp lệ (Q18b). */
    public static Integer durationMin(Object v) {
        if (v == null || "".equals(v)) return null;
        BigDecimal n;
        if (v instanceof Number num) {
            n = toDecimal(num);
            if (n == null) throw WanderException.invalidValue("MALFORMED", "durationMin");
        } else if (v instanceof String s && DIGITS.matcher(s.strip()).matches()) {
            n = new BigDecimal(s.strip());
        } else {
            throw WanderException.invalidValue("MALFORMED", "durationMin");
        }
        if (n.stripTrailingZeros().scale() > 0) throw WanderException.invalidValue("MALFORMED", "durationMin");
        if (n.signum() < 0 || n.compareTo(BigDecimal.valueOf(Item.MAX_DURATION_MIN)) > 0) {
            throw WanderException.invalidValue("OUT_OF_RANGE", "durationMin");
        }
        return n.intValueExact();
    }

    /**
     * Chi phí (nghìn đồng) theo D17: trống ⇒ chưa biết (null); số nguyên không âm; số thập phân, dấu phân cách,
     * ký hiệu tiền tệ đều là định dạng sai.
     */
    public static Long amountK(Object v, String field) {
        if (v == null) return null;
        if (v instanceof Number num) {
            BigDecimal n = toDecimal(num);
            if (n == null || n.stripTrailingZeros().scale() > 0) throw WanderException.invalidValue("MALFORMED", field);
            return checkedAmount(n, field);
        }
        if (v instanceof String raw) {
            String s = raw.strip();
            if (s.isEmpty()) return null;
            if (NEGATIVE_DIGITS.matcher(s).matches()) throw WanderException.invalidValue("NEGATIVE", field);
            if (!DIGITS.matcher(s).matches()) throw WanderException.invalidValue("MALFORMED", field);
            if (s.replaceFirst("^0+(?=\\d)", "").length() > 10) throw WanderException.invalidValue("TOO_LARGE", field);
            return checkedAmount(new BigDecimal(s), field);
        }
        throw WanderException.invalidValue("MALFORMED", field);
    }

    private static Long checkedAmount(BigDecimal n, String field) {
        if (n.signum() < 0) throw WanderException.invalidValue("NEGATIVE", field);
        if (n.compareTo(BigDecimal.valueOf(CostInfo.MAX_K)) > 0) throw WanderException.invalidValue("TOO_LARGE", field);
        return n.longValueExact();
    }

    public static boolean bool(Object v, String field) {
        if (v instanceof Boolean b) return b;
        throw WanderException.invalidValue("MALFORMED", field);
    }

    /** Vị trí yêu cầu: chỉ nhận số (cắt phần thập phân), ngược lại bỏ qua. */
    public static Integer position(Object v) {
        if (!(v instanceof Number num)) return null;
        BigDecimal n = toDecimal(num);
        if (n == null) return null;
        BigInteger i = n.toBigInteger();
        if (i.compareTo(BigInteger.valueOf(Integer.MAX_VALUE)) > 0) return Integer.MAX_VALUE;
        if (i.compareTo(BigInteger.valueOf(Integer.MIN_VALUE)) < 0) return 0;
        return i.intValue();
    }

    /** Số JSON → BigDecimal; NaN/vô cực ⇒ null. */
    private static BigDecimal toDecimal(Number num) {
        if (num instanceof BigDecimal d) return d;
        if (num instanceof BigInteger i) return new BigDecimal(i);
        if (num instanceof Double || num instanceof Float) {
            double d = num.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d)) return null;
            return BigDecimal.valueOf(d);
        }
        return BigDecimal.valueOf(num.longValue());
    }
}
