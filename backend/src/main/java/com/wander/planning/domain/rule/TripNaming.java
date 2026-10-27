package com.wander.planning.domain.rule;

import com.wander.planning.domain.constant.PlanningConstants;
import java.util.Set;
import java.util.UUID;

/**
 * Quy tắc đặt tên chuyến không trùng (DR-006): khi tên đã có chuyến khác của cùng chủ dùng thì thêm hậu tố " - 2", " - 3"…
 * với số nhỏ nhất chưa dùng. Phần đầu của tên bị cắt khi cần để cả tên vẫn không quá {@value PlanningConstants#MAX_TRIP_NAME}
 * ký tự. Hết hậu tố số thì dùng mã ngắn ngẫu nhiên.
 */
public final class TripNaming {

    private TripNaming() {
    }

    /** Tên không trùng với bất kỳ tên nào trong {@code takenNames}, bắt đầu từ {@code base}. */
    public static String uniqueName(Set<String> takenNames, String base) {
        if (!takenNames.contains(base)) return base;
        for (int n = PlanningConstants.FIRST_NAME_SUFFIX; n < PlanningConstants.MAX_NAME_SUFFIX; n++) {
            String candidate = withSuffix(base, PlanningConstants.NAME_SUFFIX_SEPARATOR + n);
            if (!takenNames.contains(candidate)) return candidate;
        }
        String shortCode = UUID.randomUUID().toString().substring(0, PlanningConstants.NAME_SHORT_CODE_LENGTH);
        return withSuffix(base, PlanningConstants.NAME_SUFFIX_SEPARATOR + shortCode);
    }

    /** Ghép hậu tố vào cuối tên, cắt phần đầu của tên cho vừa giới hạn độ dài. */
    private static String withSuffix(String base, String suffix) {
        int keep = Math.min(base.length(), PlanningConstants.MAX_TRIP_NAME - suffix.length());
        return base.substring(0, keep) + suffix;
    }
}
