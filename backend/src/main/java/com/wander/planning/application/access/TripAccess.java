package com.wander.planning.application.access;

import com.wander.planning.application.query.TripReadModel;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.shared.kernel.error.WanderException;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Cổng quyền truy cập MỘT CHỖ cho các tính năng nhẹ gắn với chuyến nhưng không nạp aggregate (checklist…). Vai luôn được tra CSDL mỗi yêu cầu
 * (không cache): người bị gỡ mất quyền ngay. Người ngoài và chuyến đã xóa ⇒ 404 (INV-6); thành viên thường làm việc của Organizer ⇒ 403.
 */
@Component
public class TripAccess {

    private final TripReadModel read;

    /** Nhận cổng đọc. */
    public TripAccess(TripReadModel read) {
        this.read = read;
    }

    /** Vai của người gọi; người ngoài ⇒ 404. */
    public MemberRole requireMember(UUID tripId, UUID identityId) {
        return read.roleIn(tripId, identityId).flatMap(MemberRole::fromCode).orElseThrow(WanderException::notFound);
    }

    /** Chỉ Organizer: người ngoài ⇒ 404, thành viên thường ⇒ 403 NOT_ORGANIZER. */
    public void requireOrganizer(UUID tripId, UUID identityId) {
        if (requireMember(tripId, identityId) != MemberRole.ORGANIZER) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_ORGANIZER, PlanningMessages.NOT_ORGANIZER);
        }
    }
}
