package com.wander.planning.application.command;

import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.DeletionRequest;
import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.port.TripRepository;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Xử lý lệnh đề nghị xóa. Mỗi phương thức một giao dịch; đồng ý thì xóa mềm mục trong CÙNG giao dịch (cùng aggregate). */
@Service
@Transactional
public class RequestCommandHandler {

    private final TripRepository trips;
    private final Clock clock;

    /** Nhận cổng lưu chuyến và đồng hồ. */
    public RequestCommandHandler(TripRepository trips, Clock clock) {
        this.trips = trips;
        this.clock = clock;
    }

    /** Thành viên gửi đề nghị xóa mục của người khác; trả đề nghị. */
    public DeletionRequest submit(RequestCommands.Submit command) {
        Trip trip = load(command.actor(), command.tripId());
        UUID itemId = Ids.parse(command.input().get(PlanningFields.REQUEST_ITEM_ID) instanceof String raw ? raw : "")
                .orElseThrow(() -> WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.ITEM_REQUIRED, PlanningFields.REQUEST_ITEM_ID));
        Item item = trip.item(itemId);
        Object reason = command.input().get(PlanningFields.REASON);
        DeletionRequest request = trip.circle().submitDeletion(command.actor(), item, reason instanceof String text ? text : null, Timestamps.now(clock));
        trips.save(trip);
        return request;
    }

    /** Người đề nghị hủy đề nghị còn chờ. */
    public void cancel(RequestCommands.Cancel command) {
        Trip trip = load(command.actor(), command.tripId());
        trip.circle().cancelDeletion(command.actor(), command.requestId());
        trips.save(trip);
    }

    /** Organizer đồng ý (xóa mềm mục nếu còn hiện) hoặc từ chối; trả đề nghị đã quyết định. */
    public DeletionRequest decide(RequestCommands.Decide command) {
        Trip trip = load(command.actor(), command.tripId());
        var now = Timestamps.now(clock);
        DeletionRequest decided = trip.circle().decideDeletion(command.actor(), command.requestId(), command.approve(), now);
        if (command.approve() && !trip.item(decided.itemId()).isDeleted()) trip.softDelete(decided.itemId(), now);
        trips.save(trip);
        return decided;
    }

    /** Nạp chuyến mà người gọi là thành viên; người ngoài ⇒ 404. */
    private Trip load(UUID actor, UUID tripId) {
        return trips.findAccessible(tripId, actor).orElseThrow(WanderException::notFound);
    }
}
