package com.wander.planning.domain.rule;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.ImmutableLists;
import java.util.Comparator;
import java.util.List;

/**
 * Quy tắc chuẩn hóa tập sở thích (ADR-014, BE-10), dùng chung cho sở thích của chuyến và sở thích theo danh tính:
 * bỏ trùng, sắp theo thứ tự khai báo của {@link TripInterest}, tối đa {@value PlanningConstants#MAX_INTERESTS}.
 */
public final class Interests {

    private Interests() {
    }

    /** Danh sách đã bỏ trùng và sắp theo thứ tự khai báo; null coi như rỗng; quá số tối đa thì TOO_MANY. */
    public static List<TripInterest> normalize(List<TripInterest> interests) {
        List<TripInterest> distinct = ImmutableLists.copyOrEmpty(interests).stream()
                .distinct().sorted(Comparator.comparingInt(Enum::ordinal)).toList();
        if (distinct.size() > PlanningConstants.MAX_INTERESTS) {
            throw WanderException.invalidValue(ErrorCodes.TOO_MANY, PlanningFields.INTERESTS);
        }
        return distinct;
    }
}
