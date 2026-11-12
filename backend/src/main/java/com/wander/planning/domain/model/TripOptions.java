package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.rule.Interests;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.planning.domain.vocabulary.TripKind;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.ImmutableLists;
import java.util.Comparator;
import java.util.List;

/**
 * Trip options (Q11, DR-002, package C). All of them are optional:
 * <ul>
 *   <li>{@code budgetK}: planned budget, thousand VND, a non-negative integer like D17. {@code null} = not set;
 *       {@code 0} = set to zero (D18). The only field with behavior: compared with 'extra to pay' (R2) on the read side.</li>
 *   <li>{@code styles}: trip kinds, at most {@value PlanningConstants#MAX_STYLES}, no duplicates, stored in the declaration order of
 *       {@link TripStyle}. Only a label.</li>
 *   <li>{@code pace}: trip pace. Only a label.</li>
 *   <li>{@code datesTentative}: the departure/return dates are tentative (DR-018 A3). Only a label; the dates are still required and still validated.</li>
 *   <li>{@code kind}: 'who is going' (choose one) and {@code interests}: interests (at most {@value PlanningConstants#MAX_INTERESTS}, no
 *       duplicates, in declaration order) (DR-018 F2, ADR-014). Only labels.</li>
 * </ul>
 */
public record TripOptions(Long budgetK, List<TripStyle> styles, TripPace pace, boolean datesTentative, TripKind kind,
                          List<TripInterest> interests) {

    /** No option is set. */
    public static final TripOptions NONE = new TripOptions(null, List.of(), null, false, null, List.of());

    /** Options with the dates confirmed, 'who is going' and interests not set. */
    public TripOptions(Long budgetK, List<TripStyle> styles, TripPace pace) {
        this(budgetK, styles, pace, false, null, List.of());
    }

    /** Options with 'who is going' and interests not set. */
    public TripOptions(Long budgetK, List<TripStyle> styles, TripPace pace, boolean datesTentative) {
        this(budgetK, styles, pace, datesTentative, null, List.of());
    }

    public TripOptions {
        requireValidBudget(budgetK);
        List<TripStyle> distinct = ImmutableLists.copyOrEmpty(styles).stream()
                .distinct().sorted(Comparator.comparingInt(Enum::ordinal)).toList();
        if (distinct.size() > PlanningConstants.MAX_STYLES) throw WanderException.invalidValue(ErrorCodes.TOO_MANY, PlanningFields.STYLES);
        styles = distinct;
        interests = Interests.normalize(interests);
    }

    /** The budget (if any) must be non-negative and not above the maximum, like a cost. */
    private static void requireValidBudget(Long budgetK) {
        if (budgetK == null) return;
        if (budgetK < 0) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, PlanningFields.BUDGET);
        if (budgetK > PlanningConstants.MAX_COST_K) throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, PlanningFields.BUDGET);
    }
}
