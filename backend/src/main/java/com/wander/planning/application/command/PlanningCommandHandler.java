package com.wander.planning.application.command;

import com.wander.planning.application.input.RawInput;
import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.DateRange;
import com.wander.planning.domain.model.DayAssignment;
import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.ItemCost;
import com.wander.planning.domain.model.ItemDetails;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.model.TripOptions;
import com.wander.planning.domain.port.PreferencesStore;
import com.wander.planning.domain.port.TripRepository;
import com.wander.planning.domain.rule.Interests;
import com.wander.planning.domain.rule.TripNaming;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Patch;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
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
    private final PreferencesStore preferences;
    private final Clock clock;

    /** Nhận cổng lưu chuyến, cổng lưu sở thích theo danh tính và đồng hồ (test thay bằng đồng hồ giả). */
    public PlanningCommandHandler(TripRepository trips, PreferencesStore preferences, Clock clock) {
        this.trips = trips;
        this.preferences = preferences;
        this.clock = clock;
    }

    /**
     * Thay toàn bộ sở thích theo danh tính (BE-10). Phải nêu khóa {@code interests} (thiếu ⇒ REQUIRED); null hoặc rỗng = xóa;
     * mã lạ hoặc sai kiểu ⇒ INVALID_INTEREST và không đổi gì.
     */
    public void setInterestPreferences(PlanningCommands.SetInterestPreferences command) {
        Map<String, Object> input = command.input();
        if (!input.containsKey(PlanningFields.INTERESTS)) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, PlanningFields.INTERESTS);
        }
        List<TripInterest> interests = Interests.normalize(RawInput.interests(input.get(PlanningFields.INTERESTS)));
        preferences.saveInterests(command.ownerId(), interests, Timestamps.now(clock));
    }

    /** Tạo chuyến mới của chủ; trả mã chuyến. */
    public UUID createTrip(PlanningCommands.CreateTrip command) {
        Map<String, Object> input = command.input();
        String requestedName = RawInput.requiredText(input.get(PlanningFields.NAME), PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME);
        String destination = RawInput.requiredText(input.get(PlanningFields.DESTINATION), PlanningConstants.MAX_DESTINATION,
                PlanningFields.DESTINATION);
        String name = uniqueTripName(command.ownerId(), null, requestedName);
        DateRange range = range(input.get(PlanningFields.START_DATE), input.get(PlanningFields.END_DATE));
        TripOptions options = new TripOptions(RawInput.budget(input.get(PlanningFields.BUDGET)),
                RawInput.styles(input.get(PlanningFields.STYLES)), RawInput.pace(input.get(PlanningFields.PACE)),
                RawInput.datesTentative(input.get(PlanningFields.DATES_TENTATIVE)), RawInput.kind(input.get(PlanningFields.KIND)),
                RawInput.interests(input.get(PlanningFields.INTERESTS)));
        Trip trip = Trip.plan(command.ownerId(), name, destination, range, options, Timestamps.now(clock));
        trips.save(trip);
        return trip.id();
    }

    /** Sửa tên, điểm đến, khoảng ngày và tùy chọn của chuyến; trường không nêu thì giữ nguyên. */
    public void updateTrip(PlanningCommands.UpdateTrip command) {
        Trip trip = load(command.ownerId(), command.tripId());
        Map<String, Object> input = command.input();
        String name = valueOrCurrent(input, PlanningFields.NAME,
                value -> uniqueTripName(command.ownerId(), trip.id(),
                        RawInput.requiredText(value, PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME)), trip.name());
        String destination = valueOrCurrent(input, PlanningFields.DESTINATION,
                value -> RawInput.requiredText(value, PlanningConstants.MAX_DESTINATION, PlanningFields.DESTINATION), trip.destination());
        DateRange range = rangeFromInput(input, trip);
        // Tùy chọn chuyến (Q11): không nêu ⇒ giữ nguyên; nêu null hoặc "" ⇒ xóa (chưa đặt).
        TripOptions current = trip.options();
        TripOptions options = new TripOptions(
                valueOrCurrent(input, PlanningFields.BUDGET, RawInput::budget, current.budgetK()),
                valueOrCurrent(input, PlanningFields.STYLES, RawInput::styles, current.styles()),
                valueOrCurrent(input, PlanningFields.PACE, RawInput::pace, current.pace()),
                valueOrCurrent(input, PlanningFields.DATES_TENTATIVE, RawInput::datesTentative, current.datesTentative()),
                valueOrCurrent(input, PlanningFields.KIND, RawInput::kind, current.kind()),
                valueOrCurrent(input, PlanningFields.INTERESTS, RawInput::interests, current.interests()));
        Instant now = Timestamps.now(clock);
        trip.changeDetails(name, destination, range, now);
        trip.changeOptions(options, now);
        trips.save(trip);
    }

    /**
     * Lệnh "lịch": tùy chọn đổi khoảng ngày (chỉ nêu một đầu thì đầu kia giữ nguyên) rồi gán ngày hàng loạt, tất cả trong một
     * giao dịch và một lần tăng phiên bản; lỗi ở bất kỳ bước nào thì không đổi gì. Gửi lại khoảng ngày và ngày cũ của từng mục
     * là cách Hoàn tác một lần đổi ngày chuyến hay một lần xếp lịch.
     */
    public void applySchedule(PlanningCommands.ApplySchedule command) {
        Trip trip = load(command.ownerId(), command.tripId());
        Map<String, Object> input = command.input();
        boolean changesRange = input.containsKey(PlanningFields.START_DATE) || input.containsKey(PlanningFields.END_DATE);
        boolean hasAssignments = input.containsKey(PlanningFields.ASSIGNMENTS);
        if (!changesRange && !hasAssignments) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, PlanningFields.ASSIGNMENTS);
        }
        List<DayAssignment> assignments = hasAssignments ? RawInput.assignments(input.get(PlanningFields.ASSIGNMENTS)) : List.of();
        Instant now = Timestamps.now(clock);
        if (changesRange) trip.changeDetails(trip.name(), trip.destination(), rangeFromInput(input, trip), now);
        trip.assignDays(assignments, now);
        trips.save(trip);
    }

    /**
     * Thêm mục vào một ngày của chuyến (mặc định cuối ngày); không nêu ngày hoặc ngày null ⇒ "Chưa có ngày" (DR-011 A1).
     * Trả mã mục.
     */
    public UUID addItem(PlanningCommands.AddItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        Map<String, Object> input = command.input();
        LocalDate day = RawInput.dayOrNull(input.get(PlanningFields.DAY));
        if (day != null) trip.requireDayInRange(day);
        ItemDetails details = new ItemDetails(RawInput.type(input.get(PlanningFields.TYPE)), RawInput.title(input.get(PlanningFields.TITLE)),
                RawInput.timeOfDay(input.get(PlanningFields.TIME_OF_DAY)), RawInput.durationMin(input.get(PlanningFields.DURATION_MIN)),
                RawInput.note(input.get(PlanningFields.NOTE)), cost(input, ItemCost.UNKNOWN),
                RawInput.booking(input.get(PlanningFields.BOOKING)), RawInput.placeId(input.get(PlanningFields.PLACE_ID)));
        Item item = trip.addItem(day, details, RawInput.position(input.get(PlanningFields.POSITION)), Timestamps.now(clock));
        trips.save(trip);
        return item.id();
    }

    /** Sửa một mục chưa bị xóa; trường không nêu thì giữ nguyên, có thể đổi ngày và vị trí. */
    public void editItem(PlanningCommands.EditItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        ItemDetails current = trip.editableItem(command.itemId()).details();
        Map<String, Object> input = command.input();
        // Thứ tự kiểm tra cố định theo hợp đồng API: loại, tiêu đề, giờ, thời lượng, ghi chú, chi phí, đặt chỗ, ngày.
        ItemType type = valueOrCurrent(input, PlanningFields.TYPE, RawInput::type, current.type());
        String title = valueOrCurrent(input, PlanningFields.TITLE, RawInput::title, current.title());
        LocalTime timeOfDay = valueOrCurrent(input, PlanningFields.TIME_OF_DAY, RawInput::timeOfDay, current.timeOfDay());
        Integer durationMin = valueOrCurrent(input, PlanningFields.DURATION_MIN, RawInput::durationMin, current.durationMin());
        String note = valueOrCurrent(input, PlanningFields.NOTE, RawInput::note, current.note());
        ItemCost cost = cost(input, current.cost());
        // Không nêu trạng thái đặt chỗ ⇒ giữ nguyên; đổi sang loại không có đặt chỗ (Nghỉ, Việc cần làm) ⇒ tự bỏ trạng thái.
        BookingStatus booking = input.containsKey(PlanningFields.BOOKING) ? RawInput.booking(input.get(PlanningFields.BOOKING))
                : (type.supportsBooking() ? current.booking() : null);
        String placeId = valueOrCurrent(input, PlanningFields.PLACE_ID, RawInput::placeId, current.placeId());
        ItemDetails details = new ItemDetails(type, title, timeOfDay, durationMin, note, cost, booking, placeId);
        // Ngày: không nêu ⇒ giữ nguyên; nêu null ⇒ về "Chưa có ngày"; nêu ngày ⇒ chuyển sang ngày đó.
        Patch<LocalDate> newDay = input.containsKey(PlanningFields.DAY) ? Patch.of(RawInput.dayOrNull(input.get(PlanningFields.DAY))) : Patch.absent();
        trip.editItem(command.itemId(), details, newDay, RawInput.position(input.get(PlanningFields.POSITION)), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Sắp xếp lại các mục đang hiện trong một ngày theo thứ tự mới; trả ngày đã sắp xếp. */
    public LocalDate reorderDay(PlanningCommands.ReorderDay command) {
        Trip trip = load(command.ownerId(), command.tripId());
        LocalDate day = RawInput.day(command.day());
        trip.requireDayInRange(day);
        trip.reorderDay(day, parseOrderedIds(command.orderedIds()));
        trips.save(trip);
        return day;
    }

    /** Xóa mềm một mục (vào "Đã xóa gần đây"). */
    public void softDeleteItem(PlanningCommands.SoftDeleteItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.softDelete(command.itemId(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Khôi phục một mục đã xóa mềm về đúng ngày và vị trí cũ. */
    public void restoreItem(PlanningCommands.RestoreItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.restore(command.itemId(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Xóa vĩnh viễn một mục đã nằm trong "Đã xóa gần đây". */
    public void purgeItem(PlanningCommands.PurgeItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.purge(command.itemId());
        trips.save(trip);
    }

    /** Đánh dấu hoặc bỏ đánh dấu hoàn thành một "Việc cần làm" cho chủ chuyến. */
    public void setTaskDone(PlanningCommands.SetTaskDone command) {
        Trip trip = load(command.ownerId(), command.tripId());
        Boolean done = command.done() instanceof Boolean flag ? flag : null;
        trip.setTaskDone(command.itemId(), command.ownerId(), done, Timestamps.now(clock));
        trips.save(trip);
    }

    // ---- hỗ trợ ----

    /** Nạp chuyến của đúng chủ; chuyến của người khác coi như không có (404). */
    private Trip load(UUID ownerId, UUID tripId) {
        return trips.findOwned(tripId, ownerId).orElseThrow(WanderException::notFound);
    }

    /**
     * Tên không trùng với tên chuyến khác của cùng chủ (DR-006): trùng thì thêm hậu tố " - 2", " - 3"… Chuyến {@code exceptTripId}
     * (chính chuyến đang đổi tên, null khi tạo mới) không tính là trùng.
     */
    private String uniqueTripName(UUID ownerId, UUID exceptTripId, String requestedName) {
        Map<UUID, String> names = new HashMap<>(trips.tripNamesOf(ownerId));
        names.remove(exceptTripId);
        return TripNaming.uniqueName(new HashSet<>(names.values()), requestedName);
    }

    /** Khoảng ngày từ đầu vào: đầu nào không nêu thì lấy của chuyến hiện tại. */
    private static DateRange rangeFromInput(Map<String, Object> input, Trip trip) {
        Object start = input.containsKey(PlanningFields.START_DATE) ? input.get(PlanningFields.START_DATE) : trip.range().start().toString();
        Object end = input.containsKey(PlanningFields.END_DATE) ? input.get(PlanningFields.END_DATE) : trip.range().end().toString();
        return range(start, end);
    }

    /** Giá trị đã kiểm tra của trường nếu được nêu trong đầu vào, nếu không thì giữ giá trị hiện tại. */
    private static <T> T valueOrCurrent(Map<String, Object> input, String field, Function<Object, T> parse, T current) {
        return input.containsKey(field) ? parse.apply(input.get(field)) : current;
    }

    /** Danh sách mã mục theo thứ tự mới từ đầu vào thô; không phải danh sách chuỗi mã hợp lệ thì báo lỗi thứ tự. */
    private static List<UUID> parseOrderedIds(Object raw) {
        if (!(raw instanceof List<?> list) || !list.stream().allMatch(String.class::isInstance)) {
            throw WanderException.invalid(ErrorCodes.MALFORMED, PlanningMessages.ORDER_MALFORMED, PlanningFields.ORDERED_IDS);
        }
        List<UUID> ids = new ArrayList<>();
        for (Object element : list) {
            ids.add(Ids.parse((String) element).orElseThrow(() -> WanderException.invalid(
                    PlanningErrorCodes.INVALID_ORDER, PlanningMessages.ORDER_MISMATCH, PlanningFields.ORDERED_IDS)));
        }
        return ids;
    }

    /** Khoảng ngày theo thứ tự lỗi của hợp đồng API: START_REQUIRED, END_REQUIRED, INVALID_DATE, END_BEFORE_START, TOO_LONG. */
    static DateRange range(Object start, Object end) {
        if (RawInput.isMissing(start)) {
            throw WanderException.invalid(PlanningErrorCodes.START_REQUIRED, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.START_DATE);
        }
        if (RawInput.isMissing(end)) {
            throw WanderException.invalid(PlanningErrorCodes.END_REQUIRED, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        LocalDate startDate = RawInput.isoDateOrNull(start);
        LocalDate endDate = RawInput.isoDateOrNull(end);
        if (startDate == null || endDate == null) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_DATE, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        return DateRange.of(startDate, endDate);
    }

    /**
     * Ba trường chi phí theo thứ tự kiểm tra: "đã bao gồm" (kiểu boolean), chi phí, giá tham khảo,
     * rồi quy tắc giá tham khảo chỉ hợp lệ khi đã tick (trong {@link ItemCost}).
     */
    static ItemCost cost(Map<String, Object> input, ItemCost current) {
        boolean included = input.containsKey(PlanningFields.INCLUDED)
                ? RawInput.bool(input.get(PlanningFields.INCLUDED), PlanningFields.INCLUDED) : current.included();
        Long costK = input.containsKey(PlanningFields.COST)
                ? RawInput.amountK(input.get(PlanningFields.COST), PlanningFields.COST) : current.costK();
        boolean referenceSent = input.containsKey(PlanningFields.REFERENCE_COST);
        Long reference = referenceSent ? RawInput.amountK(input.get(PlanningFields.REFERENCE_COST), PlanningFields.REFERENCE_COST) : null;
        return current.change(costK, included, referenceSent, reference);
    }
}
