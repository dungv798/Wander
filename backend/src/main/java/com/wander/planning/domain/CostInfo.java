package com.wander.planning.domain;

import com.wander.shared.kernel.WanderException;

/**
 * Chi phí của một mục (D17, D18; R2–R4). Đơn vị: nghìn đồng, số nguyên không âm.
 * <ul>
 *   <li>{@code costK == null}: chưa biết; {@code 0}: đã biết bằng 0.</li>
 *   <li>{@code included}: đã bao gồm (ví dụ trong tour), có giá tham khảo tùy chọn và KHÔNG cộng vào "tổng phải trả thêm".</li>
 * </ul>
 */
public record CostInfo(Long costK, boolean included, Long referenceK) {

    /** Giá trị tối đa (nghìn đồng). Mặc định cho Q18(d); đổi được. */
    public static final long MAX_K = 1_000_000_000L;

    public static final CostInfo UNKNOWN = new CostInfo(null, false, null);

    public CostInfo {
        checkAmount(costK, "cost");
        checkAmount(referenceK, "referenceCost");
        // Mặc định Q18(f): giá tham khảo chỉ có nghĩa khi đã tick "đã bao gồm".
        if (!included && referenceK != null) {
            throw WanderException.invalidValue("REFERENCE_REQUIRES_INCLUDED", "referenceCost");
        }
    }

    private static void checkAmount(Long k, String field) {
        if (k == null) return;
        if (k < 0) throw WanderException.invalidValue("NEGATIVE", field);
        if (k > MAX_K) throw WanderException.invalidValue("TOO_LARGE", field);
    }

    /**
     * Áp dụng thay đổi theo R4: bỏ tick "đã bao gồm" mà không gửi giá tham khảo mới thì giá tham khảo bị xóa.
     *
     * @param newCost      chi phí mới, hoặc {@code current.costK} nếu không đổi
     * @param newIncluded  trạng thái "đã bao gồm" mới
     * @param referenceSent người dùng có gửi giá tham khảo không
     * @param newReference giá tham khảo đã gửi (chỉ dùng khi {@code referenceSent})
     */
    public CostInfo change(Long newCost, boolean newIncluded, boolean referenceSent, Long newReference) {
        Long ref = referenceSent ? newReference : (newIncluded ? referenceK : null);
        return new CostInfo(newCost, newIncluded, ref);
    }

    /** Phần được cộng vào tổng phải trả thêm (R2): 0 nếu đã bao gồm hoặc chưa biết. */
    public long countedK() {
        return included || costK == null ? 0 : costK;
    }
}
