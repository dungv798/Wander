package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.ImmutableLists;
import java.util.Comparator;
import java.util.List;

/**
 * Tùy chọn chuyến đi (Q11, DR-002, gói C). Tất cả đều tùy chọn:
 * <ul>
 *   <li>{@code budgetK}: ngân sách dự kiến, nghìn đồng, số nguyên không âm như D17. {@code null} = chưa đặt;
 *       {@code 0} = đã đặt bằng 0 (D18). Là trường duy nhất có hành vi: so với "tổng phải trả thêm" (R2) ở phía đọc.</li>
 *   <li>{@code styles}: kiểu chuyến, tối đa {@value PlanningConstants#MAX_STYLES}, không trùng, lưu theo thứ tự khai báo của
 *       {@link TripStyle}. Chỉ là nhãn.</li>
 *   <li>{@code pace}: nhịp chuyến. Chỉ là nhãn.</li>
 * </ul>
 */
public record TripOptions(Long budgetK, List<TripStyle> styles, TripPace pace) {

    /** Không có tùy chọn nào được đặt. */
    public static final TripOptions NONE = new TripOptions(null, List.of(), null);

    public TripOptions {
        requireValidBudget(budgetK);
        List<TripStyle> distinct = ImmutableLists.copyOrEmpty(styles).stream()
                .distinct().sorted(Comparator.comparingInt(Enum::ordinal)).toList();
        if (distinct.size() > PlanningConstants.MAX_STYLES) throw WanderException.invalidValue(ErrorCodes.TOO_MANY, PlanningFields.STYLES);
        styles = distinct;
    }

    /** Ngân sách (nếu có) phải không âm và không vượt mức tối đa như chi phí. */
    private static void requireValidBudget(Long budgetK) {
        if (budgetK == null) return;
        if (budgetK < 0) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, PlanningFields.BUDGET);
        if (budgetK > PlanningConstants.MAX_COST_K) throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, PlanningFields.BUDGET);
    }
}
