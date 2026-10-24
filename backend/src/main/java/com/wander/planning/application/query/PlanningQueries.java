package com.wander.planning.application.query;

import com.wander.planning.application.query.PlanningViews.DayTotal;
import com.wander.planning.application.query.PlanningViews.DayView;
import com.wander.planning.application.query.PlanningViews.ItemView;
import com.wander.planning.application.query.PlanningViews.PendingTask;
import com.wander.planning.application.query.PlanningViews.Totals;
import com.wander.planning.application.query.PlanningViews.TripDetail;
import com.wander.planning.application.query.PlanningViews.TripView;
import com.wander.planning.application.query.PlanningViews.TypeTotal;
import com.wander.planning.domain.CostInfo;
import com.wander.planning.domain.DateRange;
import com.wander.planning.domain.ItemType;
import com.wander.planning.domain.Vnd;
import com.wander.shared.kernel.Timestamps;
import com.wander.shared.kernel.WanderException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
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

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final TripReadModel read;

    public PlanningQueries(TripReadModel read) {
        this.read = read;
    }

    public List<TripView> listTrips(UUID ownerId) {
        return read.listTrips(ownerId).stream().map(PlanningQueries::toView).toList();
    }

    public TripView trip(UUID ownerId, UUID tripId) {
        return toView(requireTrip(ownerId, tripId));
    }

    public ItemView item(UUID ownerId, UUID tripId, UUID itemId) {
        requireTrip(ownerId, tripId);
        ItemRow row = read.item(tripId, itemId).orElseThrow(WanderException::notFound);
        return toView(row, read.doneItemIds(tripId, ownerId).contains(itemId));
    }

    public List<ItemView> dayItems(UUID ownerId, UUID tripId, LocalDate day) {
        requireTrip(ownerId, tripId);
        Set<UUID> done = read.doneItemIds(tripId, ownerId);
        return read.items(tripId).stream()
                .filter(r -> r.deletedAt() == null && r.day().equals(day))
                .map(r -> toView(r, done.contains(r.id())))
                .toList();
    }

    public List<ItemView> trash(UUID ownerId, UUID tripId) {
        requireTrip(ownerId, tripId);
        Set<UUID> done = read.doneItemIds(tripId, ownerId);
        return read.trash(tripId).stream().map(r -> toView(r, done.contains(r.id()))).toList();
    }

    /** A-11 xem lịch, A-13 tổng theo ngày/loại, A-16 việc cần làm chưa xong. */
    public TripDetail detail(UUID ownerId, UUID tripId) {
        TripRow trip = requireTrip(ownerId, tripId);
        List<ItemRow> rows = read.items(tripId);
        Set<UUID> done = read.doneItemIds(tripId, ownerId);

        Map<LocalDate, List<ItemView>> liveByDay = new HashMap<>();
        Map<LocalDate, Long> perDay = new HashMap<>();
        Map<String, Long> perType = new HashMap<>();
        Set<String> liveTypes = new HashSet<>();
        long extraK = 0;
        int trashCount = 0;
        for (ItemRow r : rows) {
            if (r.deletedAt() != null) {
                trashCount++;
                continue;
            }
            liveByDay.computeIfAbsent(r.day(), d -> new ArrayList<>()).add(toView(r, done.contains(r.id())));
            long counted = new CostInfo(r.costK(), r.included(), r.referenceK()).countedK();
            extraK += counted;
            perDay.merge(r.day(), counted, Long::sum);
            perType.merge(r.type(), counted, Long::sum);
            liveTypes.add(r.type());
        }

        DateRange range = new DateRange(trip.startDate(), trip.endDate());
        List<DayView> days = range.days().stream()
                .map(d -> new DayView(d.date().toString(), d.index(), d.weekday(), d.weekdayLabel(),
                        liveByDay.getOrDefault(d.date(), List.of())))
                .toList();
        List<DayTotal> byDay = range.days().stream()
                .map(d -> {
                    long k = perDay.getOrDefault(d.date(), 0L);
                    return new DayTotal(d.date().toString(), k, Vnd.fromThousands(k));
                })
                .toList();
        List<TypeTotal> byType = new ArrayList<>();
        for (ItemType t : ItemType.values()) {
            if (!liveTypes.contains(t.code())) continue;
            long k = perType.getOrDefault(t.code(), 0L);
            byType.add(new TypeTotal(t.code(), t.label(), k, Vnd.fromThousands(k)));
        }
        List<PendingTask> pending = new ArrayList<>();
        for (DayView d : days) {
            for (ItemView i : d.items()) {
                if (ItemType.TASK.code().equals(i.type()) && !i.done()) {
                    pending.add(new PendingTask(i.id(), d.date(), i.title(), i.timeOfDay()));
                }
            }
        }
        return new TripDetail(toView(trip), days.size(), days,
                new Totals(extraK, Vnd.fromThousands(extraK), byDay, byType), pending, trashCount);
    }

    private TripRow requireTrip(UUID ownerId, UUID tripId) {
        return read.findTrip(tripId, ownerId).orElseThrow(WanderException::notFound);
    }

    static TripView toView(TripRow t) {
        return new TripView(t.id().toString(), t.name(), t.destination(), t.startDate().toString(), t.endDate().toString(),
                Timestamps.format(t.createdAt()), Timestamps.format(t.updatedAt()));
    }

    static ItemView toView(ItemRow r, boolean done) {
        String typeLabel = ItemType.fromCode(r.type()).map(ItemType::label).orElse(r.type());
        return new ItemView(r.id().toString(), r.tripId().toString(), r.day().toString(), r.position(), r.type(), typeLabel,
                r.title(), r.timeOfDay() == null ? null : HH_MM.format(r.timeOfDay()), r.durationMin(), r.note(),
                r.costK(), Vnd.fromThousandsOrNull(r.costK()), r.included(), r.referenceK(),
                Vnd.fromThousandsOrNull(r.referenceK()), done, Timestamps.format(r.deletedAt()));
    }
}
