package com.wander.planning.application.command;

import com.wander.planning.application.input.RawInput;
import com.wander.planning.domain.CostInfo;
import com.wander.planning.domain.DateRange;
import com.wander.planning.domain.Item;
import com.wander.planning.domain.ItemDetails;
import com.wander.planning.domain.ItemText;
import com.wander.planning.domain.ItemType;
import com.wander.planning.domain.Trip;
import com.wander.planning.domain.TripRepository;
import com.wander.shared.kernel.Ids;
import com.wander.shared.kernel.Timestamps;
import com.wander.shared.kernel.WanderException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Xử lý lệnh của bounded context Planning. Mỗi phương thức = một giao dịch:
 * nạp aggregate → gọi hành vi domain → lưu. Không chứa quy tắc nghiệp vụ; quy tắc nằm trong {@link Trip}.
 */
@Service
@Transactional
public class PlanningCommandHandler {

    private final TripRepository trips;
    private final Clock clock;

    public PlanningCommandHandler(TripRepository trips, Clock clock) {
        this.trips = trips;
        this.clock = clock;
    }

    public UUID handle(PlanningCommands.CreateTrip c) {
        Map<String, Object> in = c.input();
        String name = RawInput.requiredText(in.get("name"), ItemText.MAX_TRIP_NAME, "name");
        String destination = RawInput.requiredText(in.get("destination"), ItemText.MAX_DESTINATION, "destination");
        DateRange range = range(in.get("startDate"), in.get("endDate"));
        Trip trip = Trip.plan(c.ownerId(), name, destination, range, now());
        trips.save(trip);
        return trip.id();
    }

    public void handle(PlanningCommands.UpdateTrip c) {
        Trip trip = load(c.ownerId(), c.tripId());
        Map<String, Object> in = c.input();
        String name = in.containsKey("name") ? RawInput.requiredText(in.get("name"), ItemText.MAX_TRIP_NAME, "name") : trip.name();
        String destination = in.containsKey("destination")
                ? RawInput.requiredText(in.get("destination"), ItemText.MAX_DESTINATION, "destination") : trip.destination();
        Object start = in.containsKey("startDate") ? in.get("startDate") : trip.range().start().toString();
        Object end = in.containsKey("endDate") ? in.get("endDate") : trip.range().end().toString();
        trip.changeDetails(name, destination, range(start, end), now());
        trips.save(trip);
    }

    public UUID handle(PlanningCommands.AddItem c) {
        Trip trip = load(c.ownerId(), c.tripId());
        Map<String, Object> in = c.input();
        LocalDate day = RawInput.day(in.get("day"));
        trip.requireDayInRange(day);
        ItemType type = RawInput.type(in.get("type"));
        String title = RawInput.title(in.get("title"));
        LocalTime time = RawInput.timeOfDay(in.get("timeOfDay"));
        Integer duration = RawInput.durationMin(in.get("durationMin"));
        String note = RawInput.note(in.get("note"));
        CostInfo cost = cost(in, CostInfo.UNKNOWN);
        Item item = trip.addItem(day, new ItemDetails(type, title, time, duration, note, cost), RawInput.position(in.get("position")), now());
        trips.save(trip);
        return item.id();
    }

    public void handle(PlanningCommands.EditItem c) {
        Trip trip = load(c.ownerId(), c.tripId());
        ItemDetails cur = trip.editableItem(c.itemId()).details();
        Map<String, Object> in = c.input();
        ItemType type = in.containsKey("type") ? RawInput.type(in.get("type")) : cur.type();
        String title = in.containsKey("title") ? RawInput.title(in.get("title")) : cur.title();
        LocalTime time = in.containsKey("timeOfDay") ? RawInput.timeOfDay(in.get("timeOfDay")) : cur.timeOfDay();
        Integer duration = in.containsKey("durationMin") ? RawInput.durationMin(in.get("durationMin")) : cur.durationMin();
        String note = in.containsKey("note") ? RawInput.note(in.get("note")) : cur.note();
        CostInfo cost = cost(in, cur.cost());
        LocalDate day = in.containsKey("day") ? RawInput.day(in.get("day")) : null;
        trip.editItem(c.itemId(), new ItemDetails(type, title, time, duration, note, cost), day, RawInput.position(in.get("position")), now());
        trips.save(trip);
    }

    public LocalDate handle(PlanningCommands.ReorderDay c) {
        Trip trip = load(c.ownerId(), c.tripId());
        LocalDate day = RawInput.day(c.day());
        trip.requireDayInRange(day);
        if (!(c.orderedIds() instanceof List<?> raw) || !raw.stream().allMatch(String.class::isInstance)) {
            throw WanderException.invalid("MALFORMED", "Thứ tự không hợp lệ.", "orderedIds");
        }
        List<UUID> ids = new ArrayList<>();
        for (Object o : raw) {
            ids.add(Ids.parse((String) o).orElseThrow(() ->
                    WanderException.invalid("INVALID_ORDER", "Thứ tự phải gồm đúng các mục đang hiện trong ngày.", "orderedIds")));
        }
        trip.reorderDay(day, ids);
        trips.save(trip);
        return day;
    }

    public void handle(PlanningCommands.SoftDeleteItem c) {
        Trip trip = load(c.ownerId(), c.tripId());
        trip.softDelete(c.itemId(), now());
        trips.save(trip);
    }

    public void handle(PlanningCommands.RestoreItem c) {
        Trip trip = load(c.ownerId(), c.tripId());
        trip.restore(c.itemId(), now());
        trips.save(trip);
    }

    public void handle(PlanningCommands.PurgeItem c) {
        Trip trip = load(c.ownerId(), c.tripId());
        trip.purge(c.itemId());
        trips.save(trip);
    }

    public void handle(PlanningCommands.SetTaskDone c) {
        Trip trip = load(c.ownerId(), c.tripId());
        Boolean done = c.done() instanceof Boolean b ? b : null;
        trip.setTaskDone(c.itemId(), c.ownerId(), done, now());
        trips.save(trip);
    }

    // ---- hỗ trợ ----

    private Trip load(UUID ownerId, UUID tripId) {
        return trips.findOwned(tripId, ownerId).orElseThrow(WanderException::notFound);
    }

    private Instant now() {
        return Timestamps.truncate(clock.instant());
    }

    /** Khoảng ngày theo thứ tự lỗi của hợp đồng API: START_REQUIRED, END_REQUIRED, INVALID_DATE, END_BEFORE_START, TOO_LONG. */
    static DateRange range(Object start, Object end) {
        if (start == null || "".equals(start)) {
            throw WanderException.invalid("START_REQUIRED", "Khoảng ngày của chuyến không hợp lệ.", "startDate");
        }
        if (end == null || "".equals(end)) {
            throw WanderException.invalid("END_REQUIRED", "Khoảng ngày của chuyến không hợp lệ.", "endDate");
        }
        LocalDate s = RawInput.isoDateOrNull(start);
        LocalDate e = RawInput.isoDateOrNull(end);
        if (s == null || e == null) {
            throw WanderException.invalid("INVALID_DATE", "Khoảng ngày của chuyến không hợp lệ.", "endDate");
        }
        return DateRange.of(s, e);
    }

    /**
     * Ba trường chi phí theo thứ tự kiểm tra: "đã bao gồm" (kiểu boolean), chi phí, giá tham khảo,
     * rồi quy tắc giá tham khảo chỉ hợp lệ khi đã tick (trong {@link CostInfo}).
     */
    static CostInfo cost(Map<String, Object> in, CostInfo current) {
        boolean included = in.containsKey("included") ? RawInput.bool(in.get("included"), "included") : current.included();
        Long costK = in.containsKey("cost") ? RawInput.amountK(in.get("cost"), "cost") : current.costK();
        boolean refSent = in.containsKey("referenceCost");
        Long ref = refSent ? RawInput.amountK(in.get("referenceCost"), "referenceCost") : null;
        return current.change(costK, included, refSent, ref);
    }
}
