package com.wander.planning.application.query;

import java.util.List;
import java.util.UUID;

/** Dòng phẳng một hạng mục checklist; {@code doneBy} là mã danh tính (chỉ dùng nội bộ để đổi sang mã thành viên). */
public record ChecklistRow(UUID id, String group, String title, int position, List<UUID> doneBy) {
}
