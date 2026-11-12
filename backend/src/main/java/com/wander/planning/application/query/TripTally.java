package com.wander.planning.application.query;

import com.wander.planning.application.view.PlanningViews.ItemView;
import com.wander.planning.domain.model.ItemCost;
import com.wander.planning.domain.vocabulary.ItemType;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * The result of gathering the item rows of a trip in one pass to build the schedule view: visible items by day and the 'no date yet' items,
 * the extra amount to pay (R2) by day, by type and separately for undated items (DR-006: still counted in the trip total),
 * the number of items in 'Recently deleted' and the number of items with an unknown price (D18).
 */
record TripTally(Map<LocalDate, List<ItemView>> liveByDay, List<ItemView> unscheduled, Map<LocalDate, Long> perDay,
                 Map<String, Long> perType, Set<String> liveTypes, long extraK, long unscheduledK, int trashCount,
                 int unknownCount) {

    /** Walks the item rows once: a soft-deleted item is counted only into the trash, a visible item is gathered into the totals. */
    static TripTally of(List<ItemRow> rows, Set<UUID> done, java.util.Map<UUID, List<String>> doneBy) {
        Map<LocalDate, List<ItemView>> liveByDay = new HashMap<>();
        List<ItemView> unscheduled = new ArrayList<>();
        Map<LocalDate, Long> perDay = new HashMap<>();
        Map<String, Long> perType = new HashMap<>();
        Set<String> liveTypes = new HashSet<>();
        long extraK = 0;
        long unscheduledK = 0;
        int trashCount = 0;
        int unknownCount = 0;
        for (ItemRow row : rows) {
            if (row.deletedAt() != null) {
                trashCount++;
                continue;
            }
            if (hasUnknownPrice(row)) unknownCount++;
            ItemView view = PlanningQueries.toView(row, done.contains(row.id()), doneBy.getOrDefault(row.id(), List.of()));
            long counted = new ItemCost(row.costK(), row.included(), row.referenceK()).countedK();
            if (row.day() == null) {
                unscheduled.add(view);
                unscheduledK += counted;
            } else {
                liveByDay.computeIfAbsent(row.day(), day -> new ArrayList<>()).add(view);
                perDay.merge(row.day(), counted, Long::sum);
            }
            extraK += counted;
            perType.merge(row.type(), counted, Long::sum);
            liveTypes.add(row.type());
        }
        return new TripTally(liveByDay, unscheduled, perDay, perType, liveTypes, extraK, unscheduledK, trashCount, unknownCount);
    }

    /** An item of a type that has a price, with no cost entered and 'included' not ticked: unknown price, never treated as 0 (D18). */
    private static boolean hasUnknownPrice(ItemRow row) {
        boolean priced = ItemType.fromCode(row.type()).map(ItemType::isPriced).orElse(true);
        return priced && row.costK() == null && !row.included();
    }
}
