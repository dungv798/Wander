package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Một hạng mục checklist chuẩn bị của chuyến (Q12): do Organizer tạo, mỗi người tick RIÊNG của mình (không có trạng thái chung). Tên và
 * nhóm là nhãn tự khai nên được chuẩn hóa; nhóm trống nghĩa là "không nhóm".
 */
public final class ChecklistItem {

    private final UUID id;
    private final UUID tripId;
    private String group;
    private String title;
    private final int position;
    private final Instant createdAt;
    private final Map<UUID, Instant> completions;

    /** Dựng lại từ dữ liệu đã lưu (không chuẩn hóa lại). */
    public ChecklistItem(UUID id, UUID tripId, String group, String title, int position, Instant createdAt, Map<UUID, Instant> completions) {
        this.id = id;
        this.tripId = tripId;
        this.group = group;
        this.title = title;
        this.position = position;
        this.createdAt = createdAt;
        this.completions = new LinkedHashMap<>(completions);
    }

    /** Tạo hạng mục mới ở {@code position}; tên bắt buộc, nhóm tùy chọn. */
    public static ChecklistItem create(UUID tripId, String rawGroup, String rawTitle, int position, Instant now) {
        return new ChecklistItem(UUID.randomUUID(), tripId, normalizeGroup(rawGroup), normalizeTitle(rawTitle), position, now, Map.of());
    }

    /** Sửa tên/nhóm: trường null thì giữ nguyên. */
    public void edit(String rawGroup, String rawTitle) {
        if (rawGroup != null) this.group = normalizeGroup(rawGroup);
        if (rawTitle != null) this.title = normalizeTitle(rawTitle);
    }

    /** Đặt hoặc bỏ dấu hoàn thành CỦA {@code personId} (idempotent); không ảnh hưởng người khác. */
    public void setDone(UUID personId, boolean done, Instant now) {
        if (done) completions.putIfAbsent(personId, now);
        else completions.remove(personId);
    }

    /** Người này đã xong chưa. */
    public boolean isDoneBy(UUID personId) {
        return completions.containsKey(personId);
    }

    /** Những người đã xong (mã danh tính, chỉ dùng nội bộ), theo thứ tự tick. */
    public List<UUID> doneBy() {
        return List.copyOf(completions.keySet());
    }

    /** Thời điểm hoàn thành theo người (để lưu). */
    public Map<UUID, Instant> completions() {
        return Map.copyOf(completions);
    }

    /** Mã hạng mục. */
    public UUID id() {
        return id;
    }

    /** Mã chuyến chứa hạng mục. */
    public UUID tripId() {
        return tripId;
    }

    /** Nhóm (chuỗi rỗng = không nhóm). */
    public String group() {
        return group;
    }

    /** Tên hạng mục (đã chuẩn hóa, không rỗng). */
    public String title() {
        return title;
    }

    /** Vị trí trong checklist (tăng dần theo thứ tự thêm). */
    public int position() {
        return position;
    }

    /** Thời điểm tạo. */
    public Instant createdAt() {
        return createdAt;
    }

    /** Nhóm đã chuẩn hóa; null hoặc trống thành chuỗi rỗng. */
    private static String normalizeGroup(String raw) {
        return raw == null ? "" : Labels.normalize(raw, PlanningConstants.MAX_CHECKLIST_GROUP, PlanningFields.GROUP);
    }

    /** Tên đã chuẩn hóa; trống thì REQUIRED. */
    private static String normalizeTitle(String raw) {
        String text = Labels.normalize(raw == null ? "" : raw, PlanningConstants.MAX_CHECKLIST_TITLE, PlanningFields.TITLE);
        if (text.isEmpty()) throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.CHECKLIST_TITLE_REQUIRED, PlanningFields.TITLE);
        return text;
    }
}
