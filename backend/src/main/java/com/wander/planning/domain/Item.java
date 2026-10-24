package com.wander.planning.domain;

import com.wander.shared.kernel.WanderException;
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

    /** Thời lượng tối đa (phút): 7 ngày. Mặc định của implementation. */
    public static final int MAX_DURATION_MIN = 7 * 24 * 60;

    private final UUID id;
    private LocalDate day;
    private int position;
    private ItemType type;
    private String title;
    private LocalTime timeOfDay;
    private Integer durationMin;
    private String note;
    private CostInfo cost;
    private Instant deletedAt;
    private final Instant createdAt;
    private Instant updatedAt;
    /** Hoàn thành theo cặp (việc × người), đề xuất P5. Ở Lát 1a người duy nhất là chủ chuyến. */
    private final Map<UUID, Instant> completions;

    public Item(UUID id, LocalDate day, int position, ItemType type, String title, LocalTime timeOfDay,
                Integer durationMin, String note, CostInfo cost, Instant deletedAt, Instant createdAt,
                Instant updatedAt, Map<UUID, Instant> completions) {
        this.id = id;
        this.day = day;
        this.position = position;
        this.type = type;
        this.title = title;
        this.timeOfDay = timeOfDay;
        this.durationMin = durationMin;
        this.note = note;
        this.cost = cost;
        this.deletedAt = deletedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.completions = new LinkedHashMap<>(completions);
    }

    static Item create(LocalDate day, ItemDetails d, Instant now) {
        return new Item(UUID.randomUUID(), day, 0, d.type(), d.title(), d.timeOfDay(), checkDuration(d.durationMin()),
                d.note(), d.cost(), null, now, now, Map.of());
    }

    static Integer checkDuration(Integer minutes) {
        if (minutes != null && (minutes < 0 || minutes > MAX_DURATION_MIN)) {
            throw WanderException.invalidValue("OUT_OF_RANGE", "durationMin");
        }
        return minutes;
    }

    void apply(ItemDetails d, Instant now) {
        this.type = d.type();
        this.title = d.title();
        this.timeOfDay = d.timeOfDay();
        this.durationMin = checkDuration(d.durationMin());
        this.note = d.note();
        this.cost = d.cost();
        this.updatedAt = now;
    }

    void moveTo(LocalDate newDay) {
        this.day = newDay;
    }

    void setPosition(int position) {
        this.position = position;
    }

    void markDeleted(Instant now) {
        this.deletedAt = now;
        this.updatedAt = now;
    }

    void markRestored(Instant now) {
        this.deletedAt = null;
        this.updatedAt = now;
    }

    void setDone(UUID personId, boolean done, Instant now) {
        if (done) completions.put(personId, now);
        else completions.remove(personId);
    }

    public ItemDetails details() {
        return new ItemDetails(type, title, timeOfDay, durationMin, note, cost);
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean isDoneBy(UUID personId) {
        return completions.containsKey(personId);
    }

    /** Phần chi phí tính vào tổng (R2): mục đã xóa không tính. */
    public long countedK() {
        return isDeleted() ? 0 : cost.countedK();
    }

    public UUID id() { return id; }
    public LocalDate day() { return day; }
    public int position() { return position; }
    public ItemType type() { return type; }
    public String title() { return title; }
    public LocalTime timeOfDay() { return timeOfDay; }
    public Integer durationMin() { return durationMin; }
    public String note() { return note; }
    public CostInfo cost() { return cost; }
    public Instant deletedAt() { return deletedAt; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
    public Map<UUID, Instant> completions() { return Collections.unmodifiableMap(completions); }
}
