package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.rule.ItemText;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Patch;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Aggregate root "Chuyến đi". Mọi thay đổi mục đi qua đây để giữ các bất biến:
 * <ul>
 *   <li>Mục còn hiện trong một ngày có thứ tự thủ công theo vị trí lưu, tăng dần (D16). Vị trí được đánh số lại liền mạch
 *       0..n-1 khi thêm, sắp xếp lại hoặc chèn vào ngày; xóa mềm và chuyển mục ra khỏi ngày KHÔNG đánh số lại nên có thể
 *       có khoảng trống (giữ chỗ cho mục trong thùng rác). API luôn trả thứ hạng liền mạch, xem {@code PlanningQueries}.</li>
 *   <li>Mục hoặc thuộc một ngày nằm trong khoảng ngày của chuyến, hoặc "Chưa có ngày" (ngày null, vẫn có thứ tự riêng).
 *       R12 mới (DR-011 A1): đổi khoảng ngày luôn được; mục (kể cả đã xóa mềm) nằm ngoài khoảng mới tự về "Chưa có ngày".</li>
 *   <li>Xóa mềm giữ nguyên ngày và vị trí cũ để khôi phục về đúng chỗ (D19, R7).</li>
 * </ul>
 * Không phụ thuộc Spring/JPA: tầng infrastructure ánh xạ sang bảng.
 */
public final class Trip {

    private static final Comparator<Item> DAY_ORDER = Comparator.comparingInt(Item::position)
            .thenComparing(Item::createdAt)
            .thenComparing(item -> item.id().toString());

    private final UUID id;
    private final UUID ownerId;
    private String name;
    private String destination;
    private DateRange range;
    /** Tùy chọn chuyến đi (Q11, DR-002): ngân sách, kiểu chuyến, nhịp. */
    private TripOptions options;
    private final Instant createdAt;
    private Instant updatedAt;
    /** Thời điểm xóa mềm chuyến (PO 28/10/2026); null = chuyến còn hiện. Chuyến đã xóa vẫn giữ nguyên mục để khôi phục. */
    private Instant deletedAt;
    private final long version;
    private final List<Item> items;
    /** Vòng người: thành viên (đúng một Organizer, tối đa MAX_MEMBERS, tên không trùng) và liên kết mời (tối đa một chưa thu hồi). */
    private final TripCircle circle;

    /** Dựng lại chuyến từ dữ liệu đã lưu (không chuẩn hóa lại). */
    public Trip(UUID id, UUID ownerId, String name, String destination, DateRange range, TripOptions options,
                Instant createdAt, Instant updatedAt, Instant deletedAt, long version, List<Item> items,
                List<TripMember> members, List<TripInvite> invites, List<DeletionRequest> requests) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.destination = destination;
        this.range = range;
        this.options = options;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.version = version;
        this.items = new ArrayList<>(items);
        this.circle = new TripCircle(members, invites, requests);
    }

    /** A-1: tạo chuyến với tên, điểm đến và khoảng ngày hợp lệ. */
    public static Trip plan(UUID ownerId, String name, String destination, DateRange range, Instant now) {
        return plan(ownerId, name, destination, range, TripOptions.NONE, now);
    }

    /** A-1 kèm tùy chọn chuyến đi (Q11). */
    public static Trip plan(UUID ownerId, String name, String destination, DateRange range, TripOptions options, Instant now) {
        UUID tripOwner = ownerId;
        TripMember organizer = new TripMember(UUID.randomUUID(), tripOwner, MemberRole.ORGANIZER, PlanningConstants.ORGANIZER_DISPLAY_NAME, now);
        return new Trip(UUID.randomUUID(), ownerId,
                ItemText.required(name, PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME),
                ItemText.required(destination, PlanningConstants.MAX_DESTINATION, PlanningFields.DESTINATION),
                range, options, now, now, null, 0, List.of(), List.of(organizer), List.of(), List.of());
    }

    /** Chuyến đã bị xóa mềm (nằm trong "Chuyến đã xóa gần đây")? */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** Thời điểm xóa mềm; null nếu chuyến còn hiện. */
    public Instant deletedAt() {
        return deletedAt;
    }

    /** Xóa mềm cả chuyến (D19): chuyến rời danh sách, mục giữ nguyên để khôi phục. Xóa hai lần là xung đột. */
    public void moveToTrash(Instant now) {
        if (isDeleted()) throw WanderException.conflict(PlanningErrorCodes.ALREADY_DELETED, PlanningMessages.TRIP_DELETED);
        this.deletedAt = now;
        this.updatedAt = now;
    }

    /** Khôi phục chuyến từ "Chuyến đã xóa gần đây" về đúng như cũ; chuyến chưa xóa thì xung đột. */
    public void recoverFromTrash(Instant now) {
        if (!isDeleted()) throw WanderException.conflict(PlanningErrorCodes.NOT_DELETED, PlanningMessages.TRIP_NOT_DELETED);
        this.deletedAt = null;
        this.updatedAt = now;
    }

    // ---- thành viên và liên kết mời (Lát 1b, DR-021): quy tắc ở {@link TripCircle} ----

    /** Vòng người của chuyến: thành viên và liên kết mời cùng các quy tắc (tạo/thu hồi liên kết, vào, gỡ, rời, đổi tên). */
    public TripCircle circle() {
        return circle;
    }

    /** Vai của một danh tính trong chuyến; người ngoài thì trống. */
    public Optional<MemberRole> roleOf(UUID identityId) {
        return circle.roleOf(identityId);
    }

    /** Thành viên của danh tính này; người ngoài ⇒ 404 (không lộ chuyến tồn tại, INV-6). */
    public TripMember requireMember(UUID identityId) {
        return circle.requireMember(identityId);
    }

    /** Chỉ Organizer: người ngoài ⇒ 404, thành viên thường ⇒ 403 NOT_ORGANIZER. */
    public void requireOrganizer(UUID identityId) {
        circle.requireOrganizer(identityId);
    }

    /** Quyền sửa/xóa/khôi phục một mục (H3): Organizer mọi mục; thành viên chỉ mục do mình thêm (403 NOT_YOUR_ITEM); người ngoài 404. */
    public void requireMayChange(UUID identityId, Item item) {
        circle.requireMayChange(identityId, item.addedByMemberId());
    }

    /** Vào chuyến bằng liên kết; chuyến đã xóa mềm không nhận ai (INVALID_INVITE). */
    public TripMember joinWithInvite(UUID identityId, String rawDisplayName, String codeHash, Instant now) {
        TripMember member = circle.joinWithInvite(identityId, rawDisplayName, codeHash, now, isDeleted());
        this.updatedAt = now;
        return member;
    }

    /** Q11: đổi tùy chọn chuyến đi (ngân sách, kiểu, nhịp). Không có lịch sử chỉnh sửa (D19). */
    public void changeOptions(TripOptions newOptions, Instant now) {
        this.options = newOptions;
        this.updatedAt = now;
    }

    /**
     * A-1 sửa chuyến. R12 mới (DR-011 A1): đổi khoảng ngày luôn được; mục (kể cả đã xóa mềm) nằm ngoài khoảng mới
     * về "Chưa có ngày", mục còn hiện nối vào cuối vùng đó theo ngày cũ rồi vị trí cũ.
     */
    public void changeDetails(String newName, String newDestination, DateRange newRange, Instant now) {
        String checkedName = ItemText.required(newName, PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME);
        String checkedDestination = ItemText.required(newDestination, PlanningConstants.MAX_DESTINATION, PlanningFields.DESTINATION);
        this.name = checkedName;
        this.destination = checkedDestination;
        if (!newRange.equals(range)) {
            this.range = newRange;
            detachItemsOutsideRange();
        }
        this.updatedAt = now;
    }

    /** Ngày phải nằm trong khoảng ngày của chuyến; sai thì báo DAY_OUT_OF_RANGE ở trường {@code day}. */
    public void requireDayInRange(LocalDate day) {
        if (!range.contains(day)) {
            throw WanderException.invalid(PlanningErrorCodes.DAY_OUT_OF_RANGE, PlanningMessages.DAY_OUT_OF_RANGE, PlanningFields.DAY);
        }
    }

    /** A-3: thêm mục vào ngày đã chọn (null = "Chưa có ngày"), mặc định cuối ngày hoặc tại vị trí yêu cầu. */
    public Item addItem(LocalDate day, ItemDetails details, Integer requestedPosition, Instant now) {
        return addItem(day, details, requestedPosition, null, now);
    }

    /** Như {@link #addItem(LocalDate, ItemDetails, Integer, Instant)} và ghi thành viên đã thêm (null = Organizer). */
    public Item addItem(LocalDate day, ItemDetails details, Integer requestedPosition, UUID addedByMemberId, Instant now) {
        if (day != null) requireDayInRange(day);
        Item item = Item.create(day, details, addedByMemberId, now);
        List<Item> live = liveItems(day);
        items.add(item);
        renumber(insertAt(live, item, requestedPosition == null ? live.size() : requestedPosition));
        return item;
    }

    /** Mục tồn tại và chưa bị xóa (để sửa). */
    public Item editableItem(UUID itemId) {
        Item item = item(itemId);
        if (item.isDeleted()) {
            throw WanderException.conflict(PlanningErrorCodes.ITEM_DELETED, PlanningMessages.ITEM_DELETED_EDIT);
        }
        return item;
    }

    /**
     * A-7: sửa mục. {@code newDay} phân biệt ba trường hợp: không nêu ⇒ giữ ngày; nêu null ⇒ về "Chưa có ngày"; nêu ngày ⇒
     * chuyển sang ngày đó. Khi đổi ngày thì bỏ khỏi ngày cũ và chèn vào ngày mới (mặc định cuối ngày).
     */
    public Item editItem(UUID itemId, ItemDetails details, Patch<LocalDate> newDay, Integer requestedPosition, Instant now) {
        Item item = editableItem(itemId);
        if (newDay.isPresent() && newDay.value() != null) requireDayInRange(newDay.value());
        item.apply(details, now);
        if (newDay.isPresent() && !Objects.equals(newDay.value(), item.day())) {
            moveToDay(item, newDay.value(), requestedPosition);
        }
        return item;
    }

    /** A-5: thứ tự mới phải là hoán vị đúng các mục đang hiện trong ngày. Đổi giờ không tự sắp xếp lại. */
    public List<Item> reorderDay(LocalDate day, List<UUID> orderedIds) {
        requireDayInRange(day);
        List<Item> current = liveItems(day);
        Set<UUID> currentIds = new HashSet<>(current.stream().map(Item::id).toList());
        Set<UUID> requested = new HashSet<>(orderedIds);
        boolean exactPermutation = orderedIds.size() == current.size() && requested.size() == orderedIds.size()
                && currentIds.equals(requested);
        if (!exactPermutation) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_ORDER, PlanningMessages.ORDER_MISMATCH, PlanningFields.ORDERED_IDS);
        }
        List<Item> reordered = orderedIds.stream().map(this::item).toList();
        renumber(reordered);
        return reordered;
    }

    /**
     * Gán ngày hàng loạt, nguyên tử: kiểm tra TOÀN BỘ danh sách trước (mục có thật và chưa xóa, không trùng, ngày nằm trong
     * chuyến), rồi mới áp dụng lần lượt theo thứ tự danh sách. Phần tử cùng ngày hiện tại mà không nêu vị trí thì giữ nguyên;
     * có vị trí thì xếp lại tại đó. Gửi lại trạng thái cũ (theo vị trí tăng dần) là cách Hoàn tác.
     */
    public void assignDays(List<DayAssignment> assignments, Instant now) {
        requireValidAssignments(assignments);
        for (DayAssignment assignment : assignments) {
            Item item = item(assignment.itemId());
            boolean unchanged = Objects.equals(item.day(), assignment.day()) && assignment.position() == null;
            if (unchanged) continue;
            moveToDay(item, assignment.day(), assignment.position());
            item.touch(now);
        }
        this.updatedAt = now;
    }

    /**
     * D19/R7: xóa mềm. Mục rời khỏi lịch và tổng, giữ ngày và vị trí cũ. Các mục còn hiện KHÔNG bị đánh số lại: chỗ của mục
     * đã xóa được giữ (vị trí có khoảng trống) để khôi phục theo bất kỳ thứ tự nào vẫn về đúng chỗ cũ.
     */
    public Item softDelete(UUID itemId, Instant now) {
        Item item = item(itemId);
        if (item.isDeleted()) throw WanderException.conflict(PlanningErrorCodes.ALREADY_DELETED, PlanningMessages.ITEM_DELETED);
        if (items.stream().filter(Item::isDeleted).count() >= PlanningConstants.MAX_TRASH_ITEMS) {
            throw WanderException.conflict(PlanningErrorCodes.TRASH_FULL, PlanningMessages.TRASH_FULL);
        }
        item.markDeleted(now);
        circle.settlePendingOf(itemId, now);
        return item;
    }

    /**
     * Hoàn tác và "khôi phục từ Đã xóa gần đây" là cùng một thao tác: về đúng ngày và chỗ cũ. Mục giữ nguyên vị trí đã lưu
     * (không đánh số lại các mục khác, để mục còn trong thùng rác vẫn so sánh được). Chỉ khi vị trí đó đã bị mục khác chiếm
     * (sau một lần sắp xếp lại) mới chèn nó đứng trước các mục từ vị trí đó trở đi và đánh số lại liền mạch.
     */
    public Item restore(UUID itemId, Instant now) {
        Item item = item(itemId);
        if (!item.isDeleted()) throw WanderException.conflict(PlanningErrorCodes.NOT_DELETED, PlanningMessages.NOT_DELETED);
        List<Item> live = liveItems(item.day());
        boolean positionTaken = live.stream().anyMatch(other -> other.position() == item.position());
        item.markRestored(now);
        if (positionTaken) {
            int slot = (int) live.stream().filter(other -> other.position() < item.position()).count();
            renumber(insertAt(live, item, slot));
        }
        return item;
    }

    /** Xóa vĩnh viễn chỉ áp dụng cho mục đã nằm trong "Đã xóa gần đây" (mặc định cho Q17c). */
    public void purge(UUID itemId) {
        Item item = item(itemId);
        if (!item.isDeleted()) {
            throw WanderException.conflict(PlanningErrorCodes.NOT_IN_TRASH, PlanningMessages.NOT_IN_TRASH);
        }
        items.remove(item);
        circle.forgetItem(itemId);
    }

    /** A-10/DR-029: tích việc cần làm hoặc Đã ghé mục có địa điểm; lưu riêng từng người, mục đã xóa không được tích. */
    public Item setTaskDone(UUID itemId, UUID personId, Boolean done, Instant now) {
        Item item = item(itemId);
        if (item.isDeleted()) throw WanderException.conflict(PlanningErrorCodes.ITEM_DELETED, PlanningMessages.ITEM_DELETED);
        if (item.type() != ItemType.TASK && (item.placeId() == null || item.type() == ItemType.REST)) {
            throw WanderException.invalid(PlanningErrorCodes.NOT_A_TASK, PlanningMessages.NOT_A_TASK, PlanningFields.TYPE);
        }
        if (done == null) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.DONE);
        item.setDone(personId, done, now);
        return item;
    }

    /** Mục theo mã (kể cả đã xóa mềm); không có thì 404. */
    public Item item(UUID itemId) {
        return items.stream().filter(item -> item.id().equals(itemId)).findFirst().orElseThrow(WanderException::notFound);
    }

    /** Mục còn hiện trong ngày (null = vùng "Chưa có ngày"), theo thứ tự thủ công. */
    public List<Item> liveItems(LocalDate day) {
        return items.stream().filter(item -> !item.isDeleted() && Objects.equals(item.day(), day)).sorted(DAY_ORDER).toList();
    }

    /** Mỗi phần tử phải trỏ tới mục có thật và chưa xóa, không trùng mục, và ngày (nếu có) nằm trong chuyến. */
    private void requireValidAssignments(List<DayAssignment> assignments) {
        Set<UUID> seen = new HashSet<>();
        for (DayAssignment assignment : assignments) {
            editableItem(assignment.itemId());
            if (!seen.add(assignment.itemId())) {
                throw WanderException.invalid(PlanningErrorCodes.DUPLICATE_ASSIGNMENT, PlanningMessages.ASSIGNMENT_DUPLICATED,
                        PlanningFields.ASSIGNMENTS);
            }
            if (assignment.day() != null) requireDayInRange(assignment.day());
        }
    }

    /**
     * Chuyển mục sang ngày {@code day} (null = "Chưa có ngày"): chèn vào vùng mới (mặc định cuối) và đánh số lại vùng mới.
     * Vùng cũ KHÔNG đánh số lại (để lại khoảng trống) cho khỏi làm mất chỗ của mục đang nằm trong "Đã xóa gần đây".
     */
    private void moveToDay(Item item, LocalDate day, Integer requestedPosition) {
        List<Item> target = liveItems(day);
        item.moveTo(day);
        renumber(insertAt(target, item, requestedPosition == null ? target.size() : requestedPosition));
    }

    /**
     * R12 mới: mọi mục (kể cả đã xóa mềm) có ngày nằm ngoài khoảng hiện tại về "Chưa có ngày". Mục còn hiện nối vào cuối vùng
     * đó theo ngày cũ rồi vị trí cũ; mục đã xóa giữ vị trí cũ để khôi phục về đúng chỗ.
     */
    private void detachItemsOutsideRange() {
        Set<LocalDate> outsideDays = new HashSet<>(range.outside(items.stream().map(Item::day).filter(Objects::nonNull).toList()));
        if (outsideDays.isEmpty()) return;
        List<Item> detached = items.stream().filter(item -> outsideDays.contains(item.day()))
                .sorted(Comparator.comparing(Item::day).thenComparing(DAY_ORDER)).toList();
        List<Item> unscheduledLive = new ArrayList<>(liveItems(null));
        for (Item item : detached) {
            item.moveTo(null);
            if (!item.isDeleted()) unscheduledLive.add(item);
        }
        renumber(unscheduledLive);
    }

    /** Danh sách mới sau khi đặt {@code item} tại {@code index} (kẹp vào [0, kích thước]), bỏ bản cũ của mục nếu có. */
    private static List<Item> insertAt(List<Item> live, Item item, int index) {
        List<Item> ordered = new ArrayList<>(live);
        ordered.remove(item);
        int clamped = Math.max(0, Math.min(index, ordered.size()));
        ordered.add(clamped, item);
        return ordered;
    }

    /** Đánh lại vị trí liền mạch 0..n-1 theo thứ tự danh sách. */
    private static void renumber(List<Item> ordered) {
        for (int position = 0; position < ordered.size(); position++) ordered.get(position).setPosition(position);
    }

    /** Mã chuyến. */
    public UUID id() { return id; }

    /** Mã danh tính chủ chuyến. */
    public UUID ownerId() { return ownerId; }

    /** Tên chuyến. */
    public String name() { return name; }

    /** Điểm đến. */
    public String destination() { return destination; }

    /** Khoảng ngày. */
    public DateRange range() { return range; }

    /** Tùy chọn chuyến. */
    public TripOptions options() { return options; }

    /** Thời điểm tạo. */
    public Instant createdAt() { return createdAt; }

    /** Thời điểm sửa gần nhất. */
    public Instant updatedAt() { return updatedAt; }

    /** Phiên bản của aggregate (khóa lạc quan). */
    public long version() { return version; }

    /** Mọi mục, kể cả đã xóa mềm (không sửa được). */
    public List<Item> items() { return Collections.unmodifiableList(items); }
}
