package com.wander.planning.application.command;

import java.util.Map;
import java.util.UUID;

/** Lệnh thành viên và liên kết mời (Lát 1b). {@code actor} luôn là danh tính từ phiên, KHÔNG BAO GIỜ lấy từ thân yêu cầu. */
public final class MembershipCommands {

    private MembershipCommands() {
    }

    /** Organizer tạo liên kết mời mới. */
    public record CreateInvite(UUID actor, UUID tripId) {
    }

    /** Organizer thu hồi liên kết đang dùng. */
    public record RevokeInvite(UUID actor, UUID tripId) {
    }

    /** Vào chuyến bằng liên kết; {@code input} là JSON thô ({@code code}, {@code displayName}). */
    public record Join(UUID actor, Map<String, Object> input) {
    }

    /** Organizer gỡ một thành viên. */
    public record RemoveMember(UUID actor, UUID tripId, UUID memberId) {
    }

    /** Thành viên rời chuyến. */
    public record Leave(UUID actor, UUID tripId) {
    }

    /** Đổi tên hiển thị của chính mình; {@code input} là JSON thô ({@code displayName}). */
    public record RenameSelf(UUID actor, UUID tripId, Map<String, Object> input) {
    }
}
