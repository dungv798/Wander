package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Mục trong lịch (D13, D16; R6). Entity bên trong aggregate {@link Trip}: chỉ Trip được đổi ngày/vị trí
 * để giữ bất biến thứ tự trong ngày. Giờ và thời lượng tùy chọn; thứ tự là thủ công.
 */
public final class Item {

    private final UUID id;
    /** Ngày của mục; null = "Chưa có ngày" (DR-011 A1). Mục chưa có ngày vẫn có thứ tự riêng trong vùng đó. */
    private LocalDate day;
    private int position;
    private ItemType type;
    private String title;
    private LocalTime timeOfDay;
    private Integer durationMin;
    private String note;
    private ItemCost cost;
    /** Trạng thái đặt chỗ (A-14); null chỉ khi loại mục không có đặt chỗ (Nghỉ, Việc cần làm). */
    private BookingStatus booking;
    /** Mã địa điểm trong kho biên tập mà mục liên kết tới; null = mục tự do. */
    private String placeId;
    private Instant deletedAt;
    private final Instant createdAt;
    private Instant updatedAt;
    /** Hoàn thành theo cặp (việc × người), đề xuất P5. Ở Lát 1a người duy nhất là chủ chuyến. */
    private final Map<UUID, Instant> completions;
    /** Mã THÀNH VIÊN đã thêm mục (null = Organizer/dữ liệu cũ); dùng cho quyền sửa/xóa mục của mình (H3). */
    private final UUID addedByMemberId;

    /** Dựng lại từ dữ liệu đã lưu (không chuẩn hóa lại: cơ sở dữ liệu có ràng buộc CHECK tương ứng). */
    public Item(UUID id, LocalDate day, int position, ItemType type, String title, LocalTime timeOfDay,
                Integer durationMin, String note, ItemCost cost, BookingStatus booking, String placeId, Instant deletedAt,
                Instant createdAt, Instant updatedAt, Map<UUID, Instant> completions, UUID addedByMemberId) {
        this.id = id;
        this.day = day;
        this.position = position;
        this.type = type;
        this.title = title;
        this.timeOfDay = timeOfDay;
        this.durationMin = durationMin;
        this.note = note;
        this.cost = cost;
        this.booking = booking;
        this.placeId = placeId;
        this.deletedAt = deletedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.completions = new LinkedHashMap<>(completions);
        this.addedByMemberId = addedByMemberId;
    }

    /** Mã thành viên đã thêm mục; null nếu do Organizer thêm hoặc là dữ liệu cũ. */
    public UUID addedByMemberId() {
        return addedByMemberId;
    }

    /** Tạo mục mới ở vị trí 0 của ngày {@code day} (null = chưa có ngày) từ các trường đã kiểm tra; Trip sẽ đánh số lại vị trí. */
    static Item create(LocalDate day, ItemDetails details, UUID addedByMemberId, Instant now) {
        return new Item(UUID.randomUUID(), day, 0, details.type(), details.title(), details.timeOfDay(),
                checkDuration(details.durationMin()), details.note(), details.cost(),
                bookingFor(details.type(), details.booking()), details.placeId(), null, now, now, Map.of(), addedByMemberId);
    }

    /**
     * Quy tắc trạng thái đặt chỗ (A-14): loại có đặt chỗ luôn có trạng thái (không nêu ⇒ "Chờ xác nhận");
     * Nghỉ và Việc cần làm không có, và không nhận giá trị.
     */
    static BookingStatus bookingFor(ItemType type, BookingStatus requested) {
        if (!type.supportsBooking()) {
            if (requested != null) {
                throw WanderException.invalid(PlanningErrorCodes.BOOKING_NOT_APPLICABLE, PlanningMessages.BOOKING_NOT_APPLICABLE,
                        PlanningFields.BOOKING);
            }
            return null;
        }
        return requested == null ? BookingStatus.PENDING : requested;
    }

    /** Thời lượng (nếu có) phải trong [0, tối đa]; sai thì báo OUT_OF_RANGE. */
    static Integer checkDuration(Integer minutes) {
        if (minutes != null && (minutes < 0 || minutes > PlanningConstants.MAX_DURATION_MIN)) {
            throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, PlanningFields.DURATION_MIN);
        }
        return minutes;
    }

    /** Áp dụng các trường mới của mục (không đổi ngày hay vị trí). */
    void apply(ItemDetails details, Instant now) {
        this.type = details.type();
        this.title = details.title();
        this.timeOfDay = details.timeOfDay();
        this.durationMin = checkDuration(details.durationMin());
        this.note = details.note();
        this.cost = details.cost();
        this.booking = bookingFor(details.type(), details.booking());
        this.placeId = details.placeId();
        this.updatedAt = now;
    }

    /** Ghi nhận mục vừa được sắp xếp lại (đổi ngày hoặc vị trí) tại thời điểm {@code now}. */
    void touch(Instant now) {
        this.updatedAt = now;
    }

    /** Chuyển mục sang ngày khác, hoặc về "Chưa có ngày" nếu {@code newDay} là null (vị trí do Trip đánh số lại). */
    void moveTo(LocalDate newDay) {
        this.day = newDay;
    }

    /** Đặt vị trí trong ngày. */
    void setPosition(int position) {
        this.position = position;
    }

    /** Đánh dấu đã xóa mềm tại thời điểm {@code now}; giữ nguyên ngày và vị trí. */
    void markDeleted(Instant now) {
        this.deletedAt = now;
        this.updatedAt = now;
    }

    /** Bỏ dấu xóa mềm (khôi phục). */
    void markRestored(Instant now) {
        this.deletedAt = null;
        this.updatedAt = now;
    }

    /** Ghi hoặc xóa trạng thái hoàn thành của một người. */
    void setDone(UUID personId, boolean done, Instant now) {
        if (done) completions.put(personId, now);
        else completions.remove(personId);
    }

    /** Các trường người dùng sửa được của mục. */
    public ItemDetails details() {
        return new ItemDetails(type, title, timeOfDay, durationMin, note, cost, booking, placeId);
    }

    /** Mục đã bị xóa mềm. */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** Người này đã hoàn thành mục (việc cần làm) chưa. */
    public boolean isDoneBy(UUID personId) {
        return completions.containsKey(personId);
    }

    /** Phần chi phí tính vào tổng (R2): mục đã xóa không tính. */
    public long countedK() {
        return isDeleted() ? 0 : cost.countedK();
    }

    /** Mã mục. */
    public UUID id() { return id; }

    /** Ngày của mục, hoặc null nếu chưa có ngày. */
    public LocalDate day() { return day; }

    /** Mã địa điểm trong kho mà mục liên kết tới, hoặc null nếu là mục tự do. */
    public String placeId() { return placeId; }

    /** Vị trí trong ngày, bắt đầu từ 0. */
    public int position() { return position; }

    /** Loại mục. */
    public ItemType type() { return type; }

    /** Tiêu đề. */
    public String title() { return title; }

    /** Giờ trong ngày, hoặc null. */
    public LocalTime timeOfDay() { return timeOfDay; }

    /** Thời lượng, phút, hoặc null. */
    public Integer durationMin() { return durationMin; }

    /** Ghi chú, hoặc null. */
    public String note() { return note; }

    /** Chi phí. */
    public ItemCost cost() { return cost; }

    /** Trạng thái đặt chỗ, hoặc null nếu loại mục không có. */
    public BookingStatus booking() { return booking; }

    /** Thời điểm xóa mềm, hoặc null nếu chưa xóa. */
    public Instant deletedAt() { return deletedAt; }

    /** Thời điểm tạo. */
    public Instant createdAt() { return createdAt; }

    /** Thời điểm sửa gần nhất. */
    public Instant updatedAt() { return updatedAt; }

    /** Hoàn thành theo người (không sửa được). */
    public Map<UUID, Instant> completions() { return Collections.unmodifiableMap(completions); }
}
