package com.wander.planning.application.command;

import com.wander.planning.application.input.PlanningInput;
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
        if (!command.interests().isPresent()) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, PlanningFields.INTERESTS);
        }
        List<TripInterest> interests = Interests.normalize(PlanningInput.interests(command.interests().value()));
        preferences.saveInterests(command.ownerId(), interests, Timestamps.now(clock));
    }

    /** Tạo chuyến mới của chủ; trả mã chuyến. */
    public UUID createTrip(PlanningCommands.CreateTrip command) {
        String requestedName = PlanningInput.requiredText(command.name(), PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME);
        String destination = PlanningInput.requiredText(command.destination(), PlanningConstants.MAX_DESTINATION,
                PlanningFields.DESTINATION);
        String name = uniqueTripName(command.ownerId(), null, requestedName);
        DateRange range = range(command.startDate(), command.endDate());
        TripOptions options = new TripOptions(PlanningInput.budget(command.budget()),
                PlanningInput.styles(command.styles()), PlanningInput.pace(command.pace()),
                PlanningInput.datesTentative(command.datesTentative()), PlanningInput.kind(command.kind()),
                PlanningInput.interests(command.interests()));
        Trip trip = Trip.plan(command.ownerId(), name, destination, range, options, Timestamps.now(clock));
        trips.save(trip);
        return trip.id();
    }

    /** Sửa tên, điểm đến, khoảng ngày và tùy chọn của chuyến; trường không nêu thì giữ nguyên. */
    public void updateTrip(PlanningCommands.UpdateTrip command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        String name = valueOrCurrent(command.name(),
                value -> uniqueTripName(command.ownerId(), trip.id(),
                        PlanningInput.requiredText(value, PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME)), trip.name());
        String destination = valueOrCurrent(command.destination(),
                value -> PlanningInput.requiredText(value, PlanningConstants.MAX_DESTINATION, PlanningFields.DESTINATION), trip.destination());
        DateRange range = rangeFromInput(command.startDate(), command.endDate(), trip);
        // Tùy chọn chuyến (Q11): không nêu ⇒ giữ nguyên; nêu null hoặc "" ⇒ xóa (chưa đặt).
        TripOptions current = trip.options();
        TripOptions options = new TripOptions(
                valueOrCurrent(command.budget(), PlanningInput::budget, current.budgetK()),
                valueOrCurrent(command.styles(), PlanningInput::styles, current.styles()),
                valueOrCurrent(command.pace(), PlanningInput::pace, current.pace()),
                valueOrCurrent(command.datesTentative(), PlanningInput::datesTentative, current.datesTentative()),
                valueOrCurrent(command.kind(), PlanningInput::kind, current.kind()),
                valueOrCurrent(command.interests(), PlanningInput::interests, current.interests()));
        Instant now = Timestamps.now(clock);
        trip.changeDetails(name, destination, range, now);
        trip.changeOptions(options, now);
        if (command.cover().isPresent()) trip.changeCover(PlanningInput.cover(command.cover().value()), now);
        trips.save(trip);
    }

    /**
     * Lệnh "lịch": tùy chọn đổi khoảng ngày (chỉ nêu một đầu thì đầu kia giữ nguyên) rồi gán ngày hàng loạt, tất cả trong một
     * giao dịch và một lần tăng phiên bản; lỗi ở bất kỳ bước nào thì không đổi gì. Gửi lại khoảng ngày và ngày cũ của từng mục
     * là cách Hoàn tác một lần đổi ngày chuyến hay một lần xếp lịch.
     */
    public void applySchedule(PlanningCommands.ApplySchedule command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        boolean changesRange = command.startDate().isPresent() || command.endDate().isPresent();
        boolean hasAssignments = command.assignments().isPresent();
        if (!changesRange && !hasAssignments) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, PlanningFields.ASSIGNMENTS);
        }
        List<DayAssignment> assignments = hasAssignments ? PlanningInput.assignments(command.assignments().value()) : List.of();
        Instant now = Timestamps.now(clock);
        if (changesRange) trip.changeDetails(trip.name(), trip.destination(), rangeFromInput(command.startDate(), command.endDate(), trip), now);
        trip.assignDays(assignments, now);
        trips.save(trip);
    }

    /**
     * Thêm mục vào một ngày của chuyến (mặc định cuối ngày); không nêu ngày hoặc ngày null ⇒ "Chưa có ngày" (DR-011 A1).
     * Trả mã mục.
     */
    public UUID addItem(PlanningCommands.AddItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        UUID addedBy = trip.requireMember(command.ownerId()).id();
        PlanningCommands.ItemFields fields = command.fields();
        LocalDate day = PlanningInput.dayOrNull(fields.day().orElse(null));
        if (day != null) trip.requireDayInRange(day);
        ItemDetails details = new ItemDetails(PlanningInput.type(fields.type().orElse(null)), PlanningInput.title(fields.title().orElse(null)),
                PlanningInput.timeOfDay(fields.timeOfDay().orElse(null)), PlanningInput.durationMin(fields.durationMin().orElse(null)),
                PlanningInput.note(fields.note().orElse(null)), cost(fields, ItemCost.UNKNOWN),
                PlanningInput.booking(fields.booking().orElse(null)), PlanningInput.placeId(fields.placeId().orElse(null)));
        Item item = trip.addItem(day, details, PlanningInput.position(fields.position().orElse(null)), addedBy, Timestamps.now(clock));
        trips.save(trip);
        return item.id();
    }

    /** Sửa một mục chưa bị xóa; trường không nêu thì giữ nguyên, có thể đổi ngày và vị trí. */
    public void editItem(PlanningCommands.EditItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMayChange(command.ownerId(), trip.item(command.itemId()));
        ItemDetails current = trip.editableItem(command.itemId()).details();
        PlanningCommands.ItemFields fields = command.fields();
        // The order of the checks is fixed by the API contract: type, title, time, duration, note, cost, booking, day.
        ItemType type = valueOrCurrent(fields.type(), PlanningInput::type, current.type());
        String title = valueOrCurrent(fields.title(), PlanningInput::title, current.title());
        LocalTime timeOfDay = valueOrCurrent(fields.timeOfDay(), PlanningInput::timeOfDay, current.timeOfDay());
        Integer durationMin = valueOrCurrent(fields.durationMin(), PlanningInput::durationMin, current.durationMin());
        String note = valueOrCurrent(fields.note(), PlanningInput::note, current.note());
        ItemCost cost = cost(fields, current.cost());
        // Không nêu trạng thái đặt chỗ ⇒ giữ nguyên; đổi sang loại không có đặt chỗ (Nghỉ, Việc cần làm) ⇒ tự bỏ trạng thái.
        BookingStatus booking = fields.booking().isPresent() ? PlanningInput.booking(fields.booking().value())
                : (type.supportsBooking() ? current.booking() : null);
        String placeId = valueOrCurrent(fields.placeId(), PlanningInput::placeId, current.placeId());
        ItemDetails details = new ItemDetails(type, title, timeOfDay, durationMin, note, cost, booking, placeId);
        // Ngày: không nêu ⇒ giữ nguyên; nêu null ⇒ về "Chưa có ngày"; nêu ngày ⇒ chuyển sang ngày đó.
        Patch<LocalDate> newDay = fields.day().map(PlanningInput::dayOrNull);
        trip.editItem(command.itemId(), details, newDay, PlanningInput.position(fields.position().orElse(null)), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Sắp xếp lại các mục đang hiện trong một ngày theo thứ tự mới; trả ngày đã sắp xếp. */
    public LocalDate reorderDay(PlanningCommands.ReorderDay command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        LocalDate day = PlanningInput.day(command.day());
        trip.requireDayInRange(day);
        trip.reorderDay(day, parseOrderedIds(command.orderedIds()));
        trips.save(trip);
        return day;
    }

    /** Xóa mềm một mục (vào "Đã xóa gần đây"). */
    public void softDeleteItem(PlanningCommands.SoftDeleteItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMayChange(command.ownerId(), trip.item(command.itemId()));
        trip.softDelete(command.itemId(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Khôi phục một mục đã xóa mềm về đúng ngày và vị trí cũ. */
    public void restoreItem(PlanningCommands.RestoreItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMayChange(command.ownerId(), trip.item(command.itemId()));
        trip.restore(command.itemId(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Xóa vĩnh viễn một mục đã nằm trong "Đã xóa gần đây". */
    public void purgeItem(PlanningCommands.PurgeItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        trip.purge(command.itemId());
        trips.save(trip);
    }

    /** Tích/bỏ tích việc cần làm hoặc Đã ghé địa điểm cho chính thành viên đang gọi, không phụ thuộc người thêm mục. */
    public void setTaskDone(PlanningCommands.SetTaskDone command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMember(command.ownerId());
        trip.setTaskDone(command.itemId(), command.ownerId(), command.done(), Timestamps.now(clock));
        trips.save(trip);
    }

    // ---- hỗ trợ ----

    /** Xóa mềm cả chuyến (PO 28/10/2026): chuyến rời danh sách, mục giữ nguyên để khôi phục. */
    public void deleteTrip(PlanningCommands.DeleteTrip command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        trip.moveToTrash(Timestamps.now(clock));
        trips.save(trip);
    }

    /** Khôi phục chuyến từ "Chuyến đã xóa gần đây". */
    public void restoreTrip(PlanningCommands.RestoreTrip command) {
        Trip trip = trips.findOwnedDeleted(command.tripId(), command.ownerId()).orElseThrow(WanderException::notFound);
        trip.recoverFromTrash(Timestamps.now(clock));
        trips.save(trip);
    }

    /** Nạp chuyến mà người gọi là thành viên (mọi vai); người ngoài và chuyến đã xóa coi như không có (404). Quyền theo vai kiểm ở từng lệnh. */
    private Trip load(UUID actorId, UUID tripId) {
        return trips.findAccessible(tripId, actorId).orElseThrow(WanderException::notFound);
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
    private static DateRange rangeFromInput(Patch<String> startDate, Patch<String> endDate, Trip trip) {
        return range(startDate.orElse(trip.range().start().toString()), endDate.orElse(trip.range().end().toString()));
    }

    /** Giá trị đã kiểm tra của trường nếu được nêu trong đầu vào, nếu không thì giữ giá trị hiện tại. */
    private static <A, T> T valueOrCurrent(Patch<A> sent, Function<A, T> parse, T current) {
        return sent.isPresent() ? parse.apply(sent.value()) : current;
    }

    /** Danh sách mã mục theo thứ tự mới từ đầu vào thô; không phải danh sách chuỗi mã hợp lệ thì báo lỗi thứ tự. */
    private static List<UUID> parseOrderedIds(List<String> list) {
        if (list == null || list.stream().anyMatch(java.util.Objects::isNull)) {
            throw WanderException.invalid(ErrorCodes.MALFORMED, PlanningMessages.ORDER_MALFORMED, PlanningFields.ORDERED_IDS);
        }
        List<UUID> ids = new ArrayList<>();
        for (String element : list) {
            ids.add(Ids.parse(element).orElseThrow(() -> WanderException.invalid(
                    PlanningErrorCodes.INVALID_ORDER, PlanningMessages.ORDER_MISMATCH, PlanningFields.ORDERED_IDS)));
        }
        return ids;
    }

    /** Khoảng ngày theo thứ tự lỗi của hợp đồng API: START_REQUIRED, END_REQUIRED, INVALID_DATE, END_BEFORE_START, TOO_LONG. */
    static DateRange range(String start, String end) {
        if (PlanningInput.isMissing(start)) {
            throw WanderException.invalid(PlanningErrorCodes.START_REQUIRED, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.START_DATE);
        }
        if (PlanningInput.isMissing(end)) {
            throw WanderException.invalid(PlanningErrorCodes.END_REQUIRED, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        LocalDate startDate = PlanningInput.isoDateOrNull(start);
        LocalDate endDate = PlanningInput.isoDateOrNull(end);
        if (startDate == null || endDate == null) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_DATE, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        return DateRange.of(startDate, endDate);
    }

    /**
     * Ba trường chi phí theo thứ tự kiểm tra: "đã bao gồm" (kiểu boolean), chi phí, giá tham khảo,
     * rồi quy tắc giá tham khảo chỉ hợp lệ khi đã tick (trong {@link ItemCost}).
     */
    static ItemCost cost(PlanningCommands.ItemFields fields, ItemCost current) {
        boolean included = fields.included().isPresent()
                ? PlanningInput.bool(fields.included().value(), PlanningFields.INCLUDED) : current.included();
        Long costK = fields.cost().isPresent()
                ? PlanningInput.amountK(fields.cost().value(), PlanningFields.COST) : current.costK();
        boolean referenceSent = fields.referenceCost().isPresent();
        Long reference = referenceSent ? PlanningInput.amountK(fields.referenceCost().value(), PlanningFields.REFERENCE_COST) : null;
        return current.change(costK, included, referenceSent, reference);
    }
}
