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
 * Kết quả gom một lượt các dòng mục của một chuyến để dựng màn xem lịch: mục đang hiện theo ngày và mục "Chưa có ngày",
 * tổng phải trả thêm (R2) theo ngày, theo loại và riêng cho mục chưa có ngày (DR-006: vẫn tính vào tổng cả chuyến),
 * số mục trong "Đã xóa gần đây" và số mục chưa rõ giá (D18).
 */
record TripTally(Map<LocalDate, List<ItemView>> liveByDay, List<ItemView> unscheduled, Map<LocalDate, Long> perDay,
                 Map<String, Long> perType, Set<String> liveTypes, long extraK, long unscheduledK, int trashCount,
                 int unknownCount) {

    /** Duyệt các dòng mục một lần: mục đã xóa mềm chỉ được đếm vào thùng rác, mục còn hiện được gom vào các tổng. */
    static TripTally of(List<ItemRow> rows, Set<UUID> done) {
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
            ItemView view = PlanningQueries.toView(row, done.contains(row.id()));
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

    /** Mục thuộc loại có giá, chưa nhập chi phí và chưa tick "đã bao gồm": chưa rõ giá, không bao giờ coi là 0 (D18). */
    private static boolean hasUnknownPrice(ItemRow row) {
        boolean priced = ItemType.fromCode(row.type()).map(ItemType::isPriced).orElse(true);
        return priced && row.costK() == null && !row.included();
    }
}
