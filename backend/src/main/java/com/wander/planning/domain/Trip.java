package com.wander.planning.domain;

import com.wander.shared.kernel.WanderException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Aggregate root "Chuyến đi". Mọi thay đổi mục đi qua đây để giữ các bất biến:
 * <ul>
 *   <li>Mục còn hiện trong một ngày có vị trí liền mạch 0..n-1, thứ tự thủ công (D16).</li>
 *   <li>Mục luôn thuộc một ngày nằm trong khoảng ngày của chuyến (R6, R12), kể cả mục đã xóa mềm.</li>
 *   <li>Xóa mềm giữ nguyên ngày và vị trí cũ để khôi phục về đúng chỗ (D19, R7).</li>
 * </ul>
 * Không phụ thuộc Spring/JPA: tầng infrastructure ánh xạ sang bảng.
 */
public final class Trip {

    private static final Comparator<Item> DAY_ORDER = Comparator.comparingInt(Item::position)
            .thenComparing(Item::createdAt)
            .thenComparing(i -> i.id().toString());

    private final UUID id;
    private final UUID ownerId;
    private String name;
    private String destination;
    private DateRange range;
    private final Instant createdAt;
    private Instant updatedAt;
    private final long version;
    private final List<Item> items;

    public Trip(UUID id, UUID ownerId, String name, String destination, DateRange range, Instant createdAt,
                Instant updatedAt, long version, List<Item> items) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.destination = destination;
        this.range = range;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.version = version;
        this.items = new ArrayList<>(items);
    }

    /** A-1: tạo chuyến với tên, điểm đến và khoảng ngày hợp lệ. */
    public static Trip plan(UUID ownerId, String name, String destination, DateRange range, Instant now) {
        return new Trip(UUID.randomUUID(), ownerId,
                ItemText.required(name, ItemText.MAX_TRIP_NAME, "name"),
                ItemText.required(destination, ItemText.MAX_DESTINATION, "destination"),
                range, now, now, 0, List.of());
    }

    /** A-1 sửa chuyến. R12: không cho đổi khoảng ngày nếu còn mục (kể cả đã xóa mềm) nằm ngoài khoảng mới. */
    public void changeDetails(String newName, String newDestination, DateRange newRange, Instant now) {
        String n = ItemText.required(newName, ItemText.MAX_TRIP_NAME, "name");
        String d = ItemText.required(newDestination, ItemText.MAX_DESTINATION, "destination");
        if (!newRange.equals(range)) {
            List<LocalDate> outside = newRange.outside(items.stream().map(Item::day).toList());
            if (!outside.isEmpty()) {
                throw WanderException.conflict("DATES_ORPHAN_ITEMS",
                        "Có mục nằm ngoài khoảng ngày mới. Hãy chuyển hoặc xóa vĩnh viễn các mục đó trước.",
                        Map.of("dates", outside.stream().map(LocalDate::toString).toList()));
            }
        }
        this.name = n;
        this.destination = d;
        this.range = newRange;
        this.updatedAt = now;
    }

    public void requireDayInRange(LocalDate day) {
        if (!range.contains(day)) {
            throw WanderException.invalid("DAY_OUT_OF_RANGE", "Ngày nằm ngoài khoảng ngày của chuyến.", "day");
        }
    }

    /** A-3: thêm mục vào ngày đã chọn, mặc định cuối ngày hoặc tại vị trí yêu cầu. */
    public Item addItem(LocalDate day, ItemDetails details, Integer requestedPosition, Instant now) {
        requireDayInRange(day);
        Item item = Item.create(day, details, now);
        List<Item> live = liveItems(day);
        items.add(item);
        renumber(insertAt(live, item, requestedPosition == null ? live.size() : requestedPosition));
        return item;
    }

    /** Mục tồn tại và chưa bị xóa (để sửa). */
    public Item editableItem(UUID itemId) {
        Item item = item(itemId);
        if (item.isDeleted()) throw WanderException.conflict("ITEM_DELETED", "Mục đã bị xóa. Hãy khôi phục trước khi sửa.");
        return item;
    }

    /** A-7: sửa mục; nếu đổi ngày thì bỏ khỏi ngày cũ và chèn vào ngày mới (mặc định cuối ngày). */
    public Item editItem(UUID itemId, ItemDetails details, LocalDate newDay, Integer requestedPosition, Instant now) {
        Item item = editableItem(itemId);
        if (newDay != null) requireDayInRange(newDay);
        item.apply(details, now);
        if (newDay != null && !newDay.equals(item.day())) {
            LocalDate oldDay = item.day();
            List<Item> target = liveItems(newDay);
            item.moveTo(newDay);
            renumber(liveItems(oldDay));
            renumber(insertAt(target, item, requestedPosition == null ? target.size() : requestedPosition));
        }
        return item;
    }

    /** A-5: thứ tự mới phải là hoán vị đúng các mục đang hiện trong ngày. Đổi giờ không tự sắp xếp lại. */
    public List<Item> reorderDay(LocalDate day, List<UUID> orderedIds) {
        requireDayInRange(day);
        List<Item> current = liveItems(day);
        Set<UUID> currentIds = new HashSet<>(current.stream().map(Item::id).toList());
        Set<UUID> requested = new HashSet<>(orderedIds);
        if (orderedIds.size() != current.size() || requested.size() != orderedIds.size() || !currentIds.equals(requested)) {
            throw WanderException.invalid("INVALID_ORDER", "Thứ tự phải gồm đúng các mục đang hiện trong ngày.", "orderedIds");
        }
        List<Item> reordered = orderedIds.stream().map(this::item).toList();
        renumber(reordered);
        return reordered;
    }

    /** D19/R7: xóa mềm. Mục rời khỏi lịch và tổng, giữ ngày và vị trí cũ. */
    public Item softDelete(UUID itemId, Instant now) {
        Item item = item(itemId);
        if (item.isDeleted()) throw WanderException.conflict("ALREADY_DELETED", "Mục đã bị xóa.");
        item.markDeleted(now);
        renumber(liveItems(item.day()));
        return item;
    }

    /** Hoàn tác và "khôi phục từ Đã xóa gần đây" là cùng một thao tác: về đúng ngày và vị trí cũ. */
    public Item restore(UUID itemId, Instant now) {
        Item item = item(itemId);
        if (!item.isDeleted()) throw WanderException.conflict("NOT_DELETED", "Mục này chưa bị xóa.");
        if (!range.contains(item.day())) {
            throw WanderException.conflict("DAY_OUT_OF_RANGE", "Ngày của mục nằm ngoài khoảng ngày của chuyến.");
        }
        List<Item> live = liveItems(item.day());
        item.markRestored(now);
        renumber(insertAt(live, item, item.position()));
        return item;
    }

    /** Xóa vĩnh viễn chỉ áp dụng cho mục đã nằm trong "Đã xóa gần đây" (mặc định cho Q17c). */
    public void purge(UUID itemId) {
        Item item = item(itemId);
        if (!item.isDeleted()) {
            throw WanderException.conflict("NOT_IN_TRASH", "Chỉ xóa vĩnh viễn được mục đã nằm trong \"Đã xóa gần đây\".");
        }
        items.remove(item);
    }

    /** A-10: chỉ "Việc cần làm" có ô tích; hoàn thành ghi theo người (P5). */
    public Item setTaskDone(UUID itemId, UUID personId, Boolean done, Instant now) {
        Item item = item(itemId);
        if (item.isDeleted()) throw WanderException.conflict("ITEM_DELETED", "Mục đã bị xóa.");
        if (item.type() != ItemType.TASK) {
            throw WanderException.invalid("NOT_A_TASK", "Chỉ mục loại \"Việc cần làm\" mới có ô tích.", "type");
        }
        if (done == null) throw WanderException.invalidValue("MALFORMED", "done");
        item.setDone(personId, done, now);
        return item;
    }

    public Item item(UUID itemId) {
        return items.stream().filter(i -> i.id().equals(itemId)).findFirst().orElseThrow(WanderException::notFound);
    }

    /** Mục còn hiện trong ngày, theo thứ tự thủ công. */
    public List<Item> liveItems(LocalDate day) {
        return items.stream().filter(i -> !i.isDeleted() && i.day().equals(day)).sorted(DAY_ORDER).toList();
    }

    private static List<Item> insertAt(List<Item> live, Item item, int index) {
        List<Item> out = new ArrayList<>(live);
        out.remove(item);
        int i = Math.max(0, Math.min(index, out.size()));
        out.add(i, item);
        return out;
    }

    private static void renumber(List<Item> ordered) {
        for (int i = 0; i < ordered.size(); i++) ordered.get(i).setPosition(i);
    }

    public UUID id() { return id; }
    public UUID ownerId() { return ownerId; }
    public String name() { return name; }
    public String destination() { return destination; }
    public DateRange range() { return range; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
    public long version() { return version; }
    public List<Item> items() { return Collections.unmodifiableList(items); }
}
