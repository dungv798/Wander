package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;

/**
 * The cost of an item (D17, D18; R2-R4). Unit: thousand VND, a non-negative integer.
 * <ul>
 *   <li>{@code costK == null}: unknown; {@code 0}: known to be zero.</li>
 *   <li>{@code included}: included (for example in a tour), with an optional reference price, and NOT added to 'extra to pay'.</li>
 * </ul>
 */
public record ItemCost(Long costK, boolean included, Long referenceK) {

    /** Unknown cost, not included, no reference price. */
    public static final ItemCost UNKNOWN = new ItemCost(null, false, null);

    public ItemCost {
        requireValidAmount(costK, PlanningFields.COST);
        requireValidAmount(referenceK, PlanningFields.REFERENCE_COST);
        // Default of Q18(f): a reference price only has meaning when 'included' is ticked.
        if (!included && referenceK != null) {
            throw WanderException.invalidValue(PlanningErrorCodes.REFERENCE_REQUIRES_INCLUDED, PlanningFields.REFERENCE_COST);
        }
    }

    /**
     * Applies a change per R4: unticking 'included' without sending a new reference price clears the reference price.
     *
     * @param newCost       the new cost, or {@code current.costK} if unchanged
     * @param newIncluded   the new 'included' state
     * @param referenceSent whether the user sent a reference price
     * @param newReference  the reference price that was sent (used only when {@code referenceSent})
     */
    public ItemCost change(Long newCost, boolean newIncluded, boolean referenceSent, Long newReference) {
        Long reference = referenceSent ? newReference : (newIncluded ? referenceK : null);
        return new ItemCost(newCost, newIncluded, reference);
    }

    /** The part added to the extra amount to pay (R2): 0 if included or unknown. */
    public long countedK() {
        return included || costK == null ? 0 : costK;
    }

    /** An amount of money (if any) must be non-negative and not above the maximum; otherwise an error is reported on the field {@code field}. */
    private static void requireValidAmount(Long amountK, String field) {
        if (amountK == null) return;
        if (amountK < 0) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, field);
        if (amountK > PlanningConstants.MAX_COST_K) throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, field);
    }
}
