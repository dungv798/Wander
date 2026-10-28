package com.wander.planning.application.command;

import java.util.Map;
import java.util.UUID;

/** Lệnh đề nghị xóa (H2). {@code actor} luôn từ phiên. */
public final class RequestCommands {

    private RequestCommands() {
    }

    /** Thành viên đề nghị xóa một mục; {@code input} là JSON thô ({@code itemId}, {@code reason}). */
    public record Submit(UUID actor, UUID tripId, Map<String, Object> input) {
    }

    /** Người đề nghị tự hủy khi còn chờ. */
    public record Cancel(UUID actor, UUID tripId, UUID requestId) {
    }

    /** Organizer đồng ý ({@code approve} = true) hoặc từ chối. */
    public record Decide(UUID actor, UUID tripId, UUID requestId, boolean approve) {
    }
}
