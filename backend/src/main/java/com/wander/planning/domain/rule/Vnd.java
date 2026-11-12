package com.wander.planning.domain.rule;

import com.wander.planning.domain.constant.PlanningConstants;
/** Full VND display (D17): 1500 thousand -> "1.500.000 ₫" (a dot separates the thousands as in vi-VN). */
public final class Vnd {

    private Vnd() {
    }

    /** An amount (in thousand VND) as a full VND string with group separators and the suffix ₫. */
    public static String fromThousands(long thousands) {
        String digits = Long.toString(Math.abs(thousands * PlanningConstants.VND_PER_THOUSAND));
        StringBuilder grouped = new StringBuilder();
        int group = PlanningConstants.VND_GROUP_SIZE;
        int lead = digits.length() % group;
        if (lead > 0) grouped.append(digits, 0, lead);
        for (int start = lead; start < digits.length(); start += group) {
            if (!grouped.isEmpty()) grouped.append(PlanningConstants.VND_GROUP_SEPARATOR);
            grouped.append(digits, start, start + group);
        }
        String sign = thousands < 0 ? PlanningConstants.VND_MINUS : "";
        return sign + grouped + PlanningConstants.VND_SUFFIX;
    }

    /** Like {@link #fromThousands(long)} but null (unknown) stays null. */
    public static String fromThousandsOrNull(Long thousands) {
        return thousands == null ? null : fromThousands(thousands);
    }
}
