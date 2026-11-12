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
 * The rule that normalizes a set of interests (ADR-014, BE-10), shared by trip interests and interests by identity:
 * drop duplicates, sort by the declaration order of {@link TripInterest}, at most {@value PlanningConstants#MAX_INTERESTS}.
 */
public final class Interests {

    private Interests() {
    }

    /** The list with duplicates dropped and sorted by declaration order; null counts as empty; over the maximum is TOO_MANY. */
    public static List<TripInterest> normalize(List<TripInterest> interests) {
        List<TripInterest> distinct = ImmutableLists.copyOrEmpty(interests).stream()
                .distinct().sorted(Comparator.comparingInt(Enum::ordinal)).toList();
        if (distinct.size() > PlanningConstants.MAX_INTERESTS) {
            throw WanderException.invalidValue(ErrorCodes.TOO_MANY, PlanningFields.INTERESTS);
        }
        return distinct;
    }
}
