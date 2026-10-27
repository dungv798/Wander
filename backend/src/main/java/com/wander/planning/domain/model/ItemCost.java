package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;

/**
 * Chi phí của một mục (D17, D18; R2–R4). Đơn vị: nghìn đồng, số nguyên không âm.
 * <ul>
 *   <li>{@code costK == null}: chưa biết; {@code 0}: đã biết bằng 0.</li>
 *   <li>{@code included}: đã bao gồm (ví dụ trong tour), có giá tham khảo tùy chọn và KHÔNG cộng vào "tổng phải trả thêm".</li>
 * </ul>
 */
public record ItemCost(Long costK, boolean included, Long referenceK) {

    /** Chi phí chưa biết, chưa bao gồm, không có giá tham khảo. */
    public static final ItemCost UNKNOWN = new ItemCost(null, false, null);

    public ItemCost {
        requireValidAmount(costK, PlanningFields.COST);
        requireValidAmount(referenceK, PlanningFields.REFERENCE_COST);
        // Mặc định Q18(f): giá tham khảo chỉ có nghĩa khi đã tick "đã bao gồm".
        if (!included && referenceK != null) {
            throw WanderException.invalidValue(PlanningErrorCodes.REFERENCE_REQUIRES_INCLUDED, PlanningFields.REFERENCE_COST);
        }
    }

    /**
     * Áp dụng thay đổi theo R4: bỏ tick "đã bao gồm" mà không gửi giá tham khảo mới thì giá tham khảo bị xóa.
     *
     * @param newCost       chi phí mới, hoặc {@code current.costK} nếu không đổi
     * @param newIncluded   trạng thái "đã bao gồm" mới
     * @param referenceSent người dùng có gửi giá tham khảo không
     * @param newReference  giá tham khảo đã gửi (chỉ dùng khi {@code referenceSent})
     */
    public ItemCost change(Long newCost, boolean newIncluded, boolean referenceSent, Long newReference) {
        Long reference = referenceSent ? newReference : (newIncluded ? referenceK : null);
        return new ItemCost(newCost, newIncluded, reference);
    }

    /** Phần được cộng vào tổng phải trả thêm (R2): 0 nếu đã bao gồm hoặc chưa biết. */
    public long countedK() {
        return included || costK == null ? 0 : costK;
    }

    /** Một khoản tiền (nếu có) phải không âm và không vượt mức tối đa; sai thì báo lỗi ở trường {@code field}. */
    private static void requireValidAmount(Long amountK, String field) {
        if (amountK == null) return;
        if (amountK < 0) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, field);
        if (amountK > PlanningConstants.MAX_COST_K) throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, field);
    }
}
