package com.wander.planning.application.query;

import com.wander.planning.application.view.PlanningViews.Budget;
import com.wander.planning.application.view.PlanningViews.Choice;
import com.wander.planning.application.view.PlanningViews.DayTotal;
import com.wander.planning.application.view.PlanningViews.DayView;
import com.wander.planning.application.view.PlanningViews.DeletedTrip;
import com.wander.planning.application.view.PlanningViews.ItemView;
import com.wander.planning.application.view.PlanningViews.PendingTask;
import com.wander.planning.application.view.PlanningViews.Totals;
import com.wander.planning.application.view.PlanningViews.TripDetail;
import com.wander.planning.application.view.PlanningViews.TripView;
import com.wander.planning.application.view.PlanningViews.TypeTotal;
import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.model.DateRange;
import com.wander.planning.domain.rule.Vnd;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.planning.domain.vocabulary.TripKind;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Timestamps;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Phía đọc của Planning: dựng read model từ dòng dữ liệu phẳng, dùng lại quy tắc tính tổng của domain. */
@Service
@Transactional(readOnly = true)
public class PlanningQueries {

    private static final DateTimeFormatter TIME_OF_DAY = DateTimeFormatter.ofPattern(PlanningConstants.TIME_OF_DAY_PATTERN);

    private final TripReadModel read;

    /** Nhận cổng đọc dữ liệu phẳng. */
    public PlanningQueries(TripReadModel read) {
        this.read = read;
    }

    /** Các chuyến của chủ, mới nhất trước. */
    public List<TripView> listTrips(UUID ownerId) {
        return read.listTrips(ownerId).stream().map(PlanningQueries::toView).toList();
    }

    /** Chuyến đã xóa mềm của chủ, xóa gần nhất trước. */
    public List<DeletedTrip> deletedTrips(UUID ownerId) {
        return read.listDeletedTrips(ownerId).stream().map(row -> new DeletedTrip(toView(row), row.deletedAt().toString())).toList();
    }

    /** Sở thích theo danh tính (BE-10): mã + nhãn theo thứ tự cố định; chưa đặt thì rỗng. */
    public List<Choice> interestPreferences(UUID ownerId) {
        return interestChoices(read.interestPreferences(ownerId));
    }

    /** Một chuyến của chủ; chuyến của người khác coi như không có (404). */
    public TripView trip(UUID ownerId, UUID tripId) {
        return toView(requireTrip(ownerId, tripId));
    }

    /** Một mục của chuyến, kèm trạng thái hoàn thành của chủ. */
    public ItemView item(UUID ownerId, UUID tripId, UUID itemId) {
        requireTrip(ownerId, tripId);
        ItemRow row = rankedItems(tripId).stream().filter(found -> found.id().equals(itemId)).findFirst()
                .orElseThrow(WanderException::notFound);
        return toView(row, read.doneItemIds(tripId, ownerId).contains(itemId), doneBy(tripId).getOrDefault(itemId, List.of()));
    }

    /** Các mục đang hiện (chưa xóa mềm) của một ngày, theo thứ tự thủ công. */
    public List<ItemView> dayItems(UUID ownerId, UUID tripId, LocalDate day) {
        requireTrip(ownerId, tripId);
        Set<UUID> done = read.doneItemIds(tripId, ownerId);
        Map<UUID, List<String>> doneBy = doneBy(tripId);
        return rankedItems(tripId).stream()
                .filter(row -> row.deletedAt() == null && day.equals(row.day()))
                .map(row -> toView(row, done.contains(row.id()), doneBy.getOrDefault(row.id(), List.of())))
                .toList();
    }

    /** Các mục trong "Đã xóa gần đây", xóa gần nhất trước. */
    public List<ItemView> trash(UUID ownerId, UUID tripId) {
        requireTrip(ownerId, tripId);
        Set<UUID> done = read.doneItemIds(tripId, ownerId);
        Map<UUID, List<String>> doneBy = doneBy(tripId);
        return read.trash(tripId).stream().map(row -> toView(row, done.contains(row.id()), doneBy.getOrDefault(row.id(), List.of()))).toList();
    }

    /** A-11 xem lịch, A-13 tổng theo ngày/loại, A-16 việc cần làm chưa xong. */
    public TripDetail detail(UUID ownerId, UUID tripId) {
        TripRow trip = requireTrip(ownerId, tripId);
        TripTally tally = TripTally.of(rankedItems(tripId), read.doneItemIds(tripId, ownerId), doneBy(tripId));
        DateRange range = new DateRange(trip.startDate(), trip.endDate());
        List<DayView> days = dayViews(range, tally);
        Totals totals = new Totals(tally.extraK(), Vnd.fromThousands(tally.extraK()),
                tally.unscheduledK(), Vnd.fromThousands(tally.unscheduledK()), dayTotals(range, tally), typeTotals(tally));
        return new TripDetail(toView(trip), days.size(), days, tally.unscheduled(), totals, pendingTasks(days, tally.unscheduled()),
                tally.trashCount(), budget(trip.budgetK(), tally.extraK(), tally.unknownCount()));
    }

    /** Q11: chỉ so sánh trên tổng R2; mục chưa rõ giá được đếm riêng và không bao giờ coi là 0 (D18). Ngân sách chưa đặt ⇒ null. */
    static Budget budget(Long budgetK, long extraK, int unknownCount) {
        if (budgetK == null) return null;
        boolean over = extraK > budgetK;
        long gap = Math.abs(budgetK - extraK);
        return new Budget(budgetK, Vnd.fromThousands(budgetK), extraK, Vnd.fromThousands(extraK), unknownCount, over, gap,
                Vnd.fromThousands(gap));
    }

    /** Dạng hiển thị của chuyến: kiểu chuyến và nhịp có nhãn, mã lạ trong dữ liệu hiện nguyên mã. */
    static TripView toView(TripRow trip) {
        List<Choice> styles = trip.styles() == null || trip.styles().isBlank() ? List.of()
                : Arrays.stream(trip.styles().split(PlanningConstants.STYLE_CODE_SEPARATOR))
                        .map(code -> TripStyle.fromCode(code).map(style -> new Choice(style.code(), style.label())).orElse(new Choice(code, code)))
                        .toList();
        Choice pace = trip.pace() == null ? null
                : TripPace.fromCode(trip.pace()).map(found -> new Choice(found.code(), found.label())).orElse(new Choice(trip.pace(), trip.pace()));
        Choice kind = trip.kind() == null ? null
                : TripKind.fromCode(trip.kind()).map(found -> new Choice(found.code(), found.label())).orElse(new Choice(trip.kind(), trip.kind()));
        return new TripView(trip.id().toString(), trip.name(), trip.destination(), trip.startDate().toString(), trip.endDate().toString(),
                trip.budgetK(), Vnd.fromThousandsOrNull(trip.budgetK()), styles, pace, trip.datesTentative(), kind, interestChoices(trip.interests()),
                Timestamps.format(trip.createdAt()), Timestamps.format(trip.updatedAt()), trip.role(), (int) trip.memberCount());
    }

    /** Sở thích có nhãn từ chuỗi mã cách nhau bằng dấu phẩy; mã lạ trong dữ liệu hiện nguyên mã. */
    private static List<Choice> interestChoices(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(PlanningConstants.STYLE_CODE_SEPARATOR))
                .map(code -> TripInterest.fromCode(code).map(found -> new Choice(found.code(), found.label())).orElse(new Choice(code, code)))
                .toList();
    }

    /**
     * Ai đã xong từng mục, tính bằng MÃ THÀNH VIÊN (không lộ mã danh tính), theo thứ tự vào chuyến. Người đã rời chuyến không còn trong danh sách.
     */
    private Map<UUID, List<String>> doneBy(UUID tripId) {
        Map<UUID, Integer> order = new HashMap<>();
        Map<UUID, String> memberOfIdentity = new HashMap<>();
        for (MemberRow member : read.members(tripId)) {
            order.put(member.identityId(), order.size());
            memberOfIdentity.put(member.identityId(), member.id().toString());
        }
        Map<UUID, List<String>> result = new HashMap<>();
        read.completions(tripId).forEach((item, persons) -> result.put(item, persons.stream().filter(order::containsKey)
                .sorted(java.util.Comparator.comparing(order::get)).map(memberOfIdentity::get).toList()));
        return result;
    }

    /** Dạng hiển thị của mục: nhãn loại và đặt chỗ, giờ dạng HH:mm, tiền đầy đủ, trạng thái hoàn thành. */
    static ItemView toView(ItemRow row, boolean done, List<String> doneBy) {
        String typeLabel = ItemType.fromCode(row.type()).map(ItemType::label).orElse(row.type());
        String bookingLabel = row.bookingStatus() == null ? null
                : BookingStatus.fromCode(row.bookingStatus()).map(BookingStatus::label).orElse(row.bookingStatus());
        String day = row.day() == null ? null : row.day().toString();
        return new ItemView(row.id().toString(), row.tripId().toString(), row.placeId(), day, row.position(), row.type(), typeLabel,
                row.title(), row.timeOfDay() == null ? null : TIME_OF_DAY.format(row.timeOfDay()), row.durationMin(), row.note(),
                row.costK(), Vnd.fromThousandsOrNull(row.costK()), row.included(), row.referenceK(),
                Vnd.fromThousandsOrNull(row.referenceK()), row.bookingStatus(), bookingLabel, done, Timestamps.format(row.deletedAt()),
                row.addedByMemberId() == null ? null : row.addedByMemberId().toString(), doneBy);
    }

    /** Mọi mục của chuyến, mục còn hiện mang thứ hạng liền mạch trong ngày (xem {@link #withDenseLivePositions}). */
    private List<ItemRow> rankedItems(UUID tripId) {
        return withDenseLivePositions(read.items(tripId));
    }

    /**
     * Hợp đồng API: {@code position} của mục còn hiện là thứ hạng liền mạch 0..n-1 trong ngày (hoặc trong vùng "Chưa có ngày"),
     * dù khóa lưu có khoảng trống do mục đã xóa giữ chỗ (lát 4). Nhờ vậy giá trị đọc từ view dùng lại được làm {@code position}
     * khi thêm, chuyển hoặc Hoàn tác. Mục đã xóa giữ nguyên vị trí lưu. Đầu vào phải đã sắp theo ngày rồi vị trí lưu.
     */
    static List<ItemRow> withDenseLivePositions(List<ItemRow> rows) {
        Map<String, Integer> nextRankByDay = new HashMap<>();
        List<ItemRow> ranked = new ArrayList<>(rows.size());
        for (ItemRow row : rows) {
            if (row.deletedAt() != null) {
                ranked.add(row);
                continue;
            }
            int rank = nextRankByDay.merge(String.valueOf(row.day()), 1, Integer::sum) - 1;
            ranked.add(row.withPosition(rank));
        }
        return ranked;
    }

    /** Chuyến của đúng chủ; không có thì 404. */
    private TripRow requireTrip(UUID ownerId, UUID tripId) {
        return read.findTrip(tripId, ownerId).orElseThrow(WanderException::notFound);
    }

    /** Mọi ngày của chuyến kèm các mục đang hiện (ngày trống có danh sách rỗng). */
    private static List<DayView> dayViews(DateRange range, TripTally tally) {
        return range.days().stream()
                .map(day -> new DayView(day.date().toString(), day.index(), day.weekday(), day.weekdayLabel(),
                        tally.liveByDay().getOrDefault(day.date(), List.of())))
                .toList();
    }

    /** Tổng phải trả thêm của từng ngày trong chuyến (R2). */
    private static List<DayTotal> dayTotals(DateRange range, TripTally tally) {
        return range.days().stream()
                .map(day -> {
                    long thousands = tally.perDay().getOrDefault(day.date(), 0L);
                    return new DayTotal(day.date().toString(), thousands, Vnd.fromThousands(thousands));
                })
                .toList();
    }

    /** Tổng phải trả thêm theo loại, chỉ gồm loại đang có mục hiện, theo thứ tự khai báo của {@link ItemType}. */
    private static List<TypeTotal> typeTotals(TripTally tally) {
        List<TypeTotal> totals = new ArrayList<>();
        for (ItemType type : ItemType.values()) {
            if (!tally.liveTypes().contains(type.code())) continue;
            long thousands = tally.perType().getOrDefault(type.code(), 0L);
            totals.add(new TypeTotal(type.code(), type.label(), thousands, Vnd.fromThousands(thousands)));
        }
        return totals;
    }

    /** Các "Việc cần làm" chưa xong, theo thứ tự ngày rồi vị trí, các việc chưa có ngày đứng cuối với ngày null (A-16). */
    private static List<PendingTask> pendingTasks(List<DayView> days, List<ItemView> unscheduled) {
        List<PendingTask> pending = new ArrayList<>();
        for (DayView day : days) addPendingTasks(pending, day.date(), day.items());
        addPendingTasks(pending, null, unscheduled);
        return pending;
    }

    /** Thêm các việc cần làm chưa xong trong {@code items} vào danh sách, gắn với ngày {@code date} (null = chưa có ngày). */
    private static void addPendingTasks(List<PendingTask> pending, String date, List<ItemView> items) {
        for (ItemView item : items) {
            if (ItemType.TASK.code().equals(item.type()) && !item.done()) {
                pending.add(new PendingTask(item.id(), date, item.title(), item.timeOfDay()));
            }
        }
    }
}
