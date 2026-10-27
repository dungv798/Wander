package com.wander.planning.domain.rule;

import com.wander.planning.domain.constant.PlanningConstants;
/** Hiển thị VND đầy đủ (D17): 1500 nghìn → "1.500.000 ₫" (dấu chấm ngăn nghìn như vi-VN). */
public final class Vnd {

    private Vnd() {
    }

    /** Số tiền (đơn vị nghìn đồng) thành chuỗi VND đầy đủ có dấu ngăn nhóm và hậu tố ₫. */
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

    /** Như {@link #fromThousands(long)} nhưng null (chưa biết) giữ nguyên null. */
    public static String fromThousandsOrNull(Long thousands) {
        return thousands == null ? null : fromThousands(thousands);
    }
}
