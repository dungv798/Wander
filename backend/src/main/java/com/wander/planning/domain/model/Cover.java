package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.CoverConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.error.WanderException;

/**
 * Bìa chuyến bất biến, chỉ giữ loại và mã (DR-031); null ở chuyến là bìa tự động.
 * Planning chỉ kiểm dạng slug ảnh, không tra catalog để giữ ranh giới module.
 * Giới hạn: FE chịu trách nhiệm chỉ gửi mã ảnh có thật trong catalog của điểm đến chuyến.
 */
public record Cover(String kind, String ref) {
    /** Kiểm bìa ngay khi dựng: gradient thuộc tập cố định, ảnh chỉ nhận slug có giới hạn. */
    public Cover {
        boolean validRef = ref != null && ref.length() <= CoverConstants.MAX_REF_LENGTH;
        boolean photo = CoverConstants.PHOTO.equals(kind) && validRef && ref.matches(CoverConstants.PHOTO_REF_PATTERN);
        boolean gradient = CoverConstants.GRADIENT.equals(kind) && validRef && CoverConstants.GRADIENT_REFS.contains(ref);
        if (!photo && !gradient) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_COVER, PlanningMessages.INVALID_COVER, PlanningFields.COVER);
        }
    }
}
