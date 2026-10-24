package com.wander.planning.domain;

/** Hiển thị VND đầy đủ (D17): 1500 nghìn → "1.500.000 ₫" (dấu chấm ngăn nghìn như vi-VN). */
public final class Vnd {

    private Vnd() {
    }

    public static String fromThousands(long k) {
        String digits = Long.toString(Math.abs(k * 1000));
        StringBuilder sb = new StringBuilder();
        int lead = digits.length() % 3;
        if (lead > 0) sb.append(digits, 0, lead);
        for (int i = lead; i < digits.length(); i += 3) {
            if (!sb.isEmpty()) sb.append('.');
            sb.append(digits, i, i + 3);
        }
        return (k < 0 ? "-" : "") + sb + " ₫";
    }

    public static String fromThousandsOrNull(Long k) {
        return k == null ? null : fromThousands(k);
    }
}
