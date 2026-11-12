package com.wander.planning.application.command;

import com.wander.planning.application.access.TripAccess;
import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.ChecklistItem;
import com.wander.planning.domain.port.ChecklistRepository;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Xử lý lệnh checklist chuẩn bị (Q12). Mỗi phương thức một giao dịch; quyền kiểm qua {@link TripAccess} TRƯỚC khi đụng dữ liệu. */
@Service
@Transactional
public class ChecklistCommandHandler {

    private final ChecklistRepository checklist;
    private final TripAccess access;
    private final Clock clock;

    /** Nhận cổng lưu, cổng quyền và đồng hồ. */
    public ChecklistCommandHandler(ChecklistRepository checklist, TripAccess access, Clock clock) {
        this.checklist = checklist;
        this.access = access;
        this.clock = clock;
    }

    /** Organizer thêm hạng mục ({@code group} tùy chọn, {@code title} bắt buộc) ở cuối; trả mã hạng mục. */
    public UUID add(UUID actor, UUID tripId, String group, String title) {
        access.requireOrganizer(tripId, actor);
        if (checklist.countOf(tripId) >= PlanningConstants.MAX_CHECKLIST_ITEMS) {
            throw WanderException.conflict(PlanningErrorCodes.CHECKLIST_FULL, PlanningMessages.CHECKLIST_FULL);
        }
        ChecklistItem item = ChecklistItem.create(tripId, group, title, checklist.nextPosition(tripId),
                Timestamps.now(clock));
        checklist.save(item);
        return item.id();
    }

    /** Organizer sửa tên/nhóm (trường không nêu thì giữ nguyên). */
    public void edit(UUID actor, UUID tripId, UUID itemId, String group, String title) {
        access.requireOrganizer(tripId, actor);
        ChecklistItem item = checklist.find(tripId, itemId).orElseThrow(WanderException::notFound);
        item.edit(group, title);
        checklist.save(item);
    }

    /** Organizer xóa hẳn một hạng mục. */
    public void remove(UUID actor, UUID tripId, UUID itemId) {
        access.requireOrganizer(tripId, actor);
        if (!checklist.delete(tripId, itemId)) throw WanderException.notFound();
    }

    /** Mọi thành viên đặt/bỏ dấu hoàn thành CỦA CHÍNH MÌNH (người = người gọi, không bao giờ lấy từ thân yêu cầu). */
    public void setDone(UUID actor, UUID tripId, UUID itemId, Boolean done) {
        access.requireMember(tripId, actor);
        ChecklistItem item = checklist.find(tripId, itemId).orElseThrow(WanderException::notFound);
        if (done == null) throw WanderException.invalidValue(com.wander.shared.kernel.constant.ErrorCodes.MALFORMED, PlanningFields.DONE);
        item.setDone(actor, done, Timestamps.now(clock));
        checklist.save(item);
    }

}
