package com.wander.planning.application.query;

import com.wander.planning.application.view.PlanningViews.Budget;
import com.wander.planning.application.view.PlanningViews.Choice;
import com.wander.planning.application.view.PlanningViews.CoverView;
import com.wander.planning.application.view.PlanningViews.DayTotal;
import com.wander.planning.application.view.PlanningViews.DayView;
import com.wander.planning.application.view.PlanningViews.DeletedTrip;
import com.wander.planning.application.view.PlanningViews.ItemView;
import com.wander.planning.application.view.PlanningViews.PendingTask;
import com.wander.planning.application.view.PlanningViews.Totals;
import com.wander.planning.application.view.PlanningViews.TripDetail;
import com.wander.planning.application.view.PlanningViews.TripView;
import com.wander.planning.application.view.PlanningViews.TypeTotal;
import com.wander.planning.domain.constant.CoverConstants;
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

/** The read side of Planning: builds the read model from flat data rows, reusing the domain's rule for totals. */
@Service
@Transactional(readOnly = true)
public class PlanningQueries {

    private static final DateTimeFormatter TIME_OF_DAY = DateTimeFormatter.ofPattern(PlanningConstants.TIME_OF_DAY_PATTERN);

    private final TripReadModel read;

    /** Takes the port that reads flat data. */
    public PlanningQueries(TripReadModel read) {
        this.read = read;
    }

    /** The owner's trips, newest first. */
    public List<TripView> listTrips(UUID ownerId) {
        return read.listTrips(ownerId).stream().map(PlanningQueries::toView).toList();
    }

    /** The owner's soft-deleted trips, most recently deleted first. */
    public List<DeletedTrip> deletedTrips(UUID ownerId) {
        return read.listDeletedTrips(ownerId).stream().map(row -> new DeletedTrip(toView(row), row.deletedAt().toString())).toList();
    }

    /** Preferences by identity (BE-10): code + label in a fixed order; empty if not set. */
    public List<Choice> interestPreferences(UUID ownerId) {
        return interestChoices(read.interestPreferences(ownerId));
    }

    /** One trip of the owner; someone else's trip counts as absent (404). */
    public TripView trip(UUID ownerId, UUID tripId) {
        return toView(requireTrip(ownerId, tripId));
    }

    /** One item of the trip, with the owner's completion status. */
    public ItemView item(UUID ownerId, UUID tripId, UUID itemId) {
        requireTrip(ownerId, tripId);
        ItemRow row = rankedItems(tripId).stream().filter(found -> found.id().equals(itemId)).findFirst()
                .orElseThrow(WanderException::notFound);
        return toView(row, read.doneItemIds(tripId, ownerId).contains(itemId), doneBy(tripId).getOrDefault(itemId, List.of()));
    }

    /** The visible (not soft-deleted) items of a day, in manual order. */
    public List<ItemView> dayItems(UUID ownerId, UUID tripId, LocalDate day) {
        requireTrip(ownerId, tripId);
        Set<UUID> done = read.doneItemIds(tripId, ownerId);
        Map<UUID, List<String>> doneBy = doneBy(tripId);
        return rankedItems(tripId).stream()
                .filter(row -> row.deletedAt() == null && day.equals(row.day()))
                .map(row -> toView(row, done.contains(row.id()), doneBy.getOrDefault(row.id(), List.of())))
                .toList();
    }

    /** The items in 'Recently deleted', most recently deleted first. */
    public List<ItemView> trash(UUID ownerId, UUID tripId) {
        requireTrip(ownerId, tripId);
        Set<UUID> done = read.doneItemIds(tripId, ownerId);
        Map<UUID, List<String>> doneBy = doneBy(tripId);
        return read.trash(tripId).stream().map(row -> toView(row, done.contains(row.id()), doneBy.getOrDefault(row.id(), List.of()))).toList();
    }

    /** A-11 view the schedule, A-13 totals by day/type, A-16 unfinished to-dos. */
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

    /** Q11: compared only against the R2 total; items with an unknown price are counted separately and never treated as 0 (D18). Budget not set => null. */
    static Budget budget(Long budgetK, long extraK, int unknownCount) {
        if (budgetK == null) return null;
        boolean over = extraK > budgetK;
        long gap = Math.abs(budgetK - extraK);
        return new Budget(budgetK, Vnd.fromThousands(budgetK), extraK, Vnd.fromThousands(extraK), unknownCount, over, gap,
                Vnd.fromThousands(gap));
    }

    /** The display form of a trip: the trip kind and pace with labels; an unknown code in the data is shown as the raw code. */
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
                Timestamps.format(trip.createdAt()), Timestamps.format(trip.updatedAt()), trip.role(), (int) trip.memberCount(),
                trip.selfMemberId() == null ? null : trip.selfMemberId().toString(), coverView(trip.cover()));
    }

    /** Decodes the cover column into a flat read model, without loading the aggregate. */
    private static CoverView coverView(String stored) {
        if (stored == null) return null;
        String[] parts = stored.split(CoverConstants.SEPARATOR, 2);
        return new CoverView(parts[0], parts[1]);
    }

    /** Interests with labels from a comma-separated string of codes; an unknown code in the data is shown as the raw code. */
    private static List<Choice> interestChoices(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(PlanningConstants.STYLE_CODE_SEPARATOR))
                .map(code -> TripInterest.fromCode(code).map(found -> new Choice(found.code(), found.label())).orElse(new Choice(code, code)))
                .toList();
    }

    /**
     * Who finished each item, by MEMBER ID (the identity id is not exposed), in the order they joined the trip. A person who left the trip is no longer in the list.
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

    /** The display form of an item: type and booking labels, time as HH:mm, the full amount of money, the completion status. */
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

    /** Every item of the trip, the visible ones carrying a gapless rank within the day (see {@link #withDenseLivePositions}). */
    private List<ItemRow> rankedItems(UUID tripId) {
        return withDenseLivePositions(read.items(tripId));
    }

    /**
     * API contract: the {@code position} of a visible item is a gapless rank 0..n-1 within the day (or within the 'no date yet' area),
     * even if the stored key has gaps held by deleted items (slice 4). So a value read from the view can be reused as {@code position}
     * when adding, moving or undoing. A deleted item keeps its stored position. The input must already be sorted by day then stored position.
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

    /** A trip of exactly this owner; otherwise 404. */
    private TripRow requireTrip(UUID ownerId, UUID tripId) {
        return read.findTrip(tripId, ownerId).orElseThrow(WanderException::notFound);
    }

    /** Every day of the trip with its visible items (an empty day has an empty list). */
    private static List<DayView> dayViews(DateRange range, TripTally tally) {
        return range.days().stream()
                .map(day -> new DayView(day.date().toString(), day.index(), day.weekday(), day.weekdayLabel(),
                        tally.liveByDay().getOrDefault(day.date(), List.of())))
                .toList();
    }

    /** The extra amount to pay for each day of the trip (R2). */
    private static List<DayTotal> dayTotals(DateRange range, TripTally tally) {
        return range.days().stream()
                .map(day -> {
                    long thousands = tally.perDay().getOrDefault(day.date(), 0L);
                    return new DayTotal(day.date().toString(), thousands, Vnd.fromThousands(thousands));
                })
                .toList();
    }

    /** The extra amount to pay by type, only for types that have visible items, in the declaration order of {@link ItemType}. */
    private static List<TypeTotal> typeTotals(TripTally tally) {
        List<TypeTotal> totals = new ArrayList<>();
        for (ItemType type : ItemType.values()) {
            if (!tally.liveTypes().contains(type.code())) continue;
            long thousands = tally.perType().getOrDefault(type.code(), 0L);
            totals.add(new TypeTotal(type.code(), type.label(), thousands, Vnd.fromThousands(thousands)));
        }
        return totals;
    }

    /** The unfinished 'To-dos', ordered by day then position; to-dos with no date go last with a null day (A-16). */
    private static List<PendingTask> pendingTasks(List<DayView> days, List<ItemView> unscheduled) {
        List<PendingTask> pending = new ArrayList<>();
        for (DayView day : days) addPendingTasks(pending, day.date(), day.items());
        addPendingTasks(pending, null, unscheduled);
        return pending;
    }

    /** Adds the unfinished to-dos in {@code items} to the list, attached to the day {@code date} (null = no date yet). */
    private static void addPendingTasks(List<PendingTask> pending, String date, List<ItemView> items) {
        for (ItemView item : items) {
            if (ItemType.TASK.code().equals(item.type()) && !item.done()) {
                pending.add(new PendingTask(item.id(), date, item.title(), item.timeOfDay()));
            }
        }
    }
}
