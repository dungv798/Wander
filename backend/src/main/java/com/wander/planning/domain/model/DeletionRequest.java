package com.wander.planning.domain.model;

import com.wander.planning.domain.vocabulary.RequestStatus;
import java.time.Instant;
import java.util.UUID;

/** Một đề nghị xóa mục do thành viên gửi cho Organizer. {@code reason} tùy chọn (chuỗi rỗng nếu không nêu). */
public record DeletionRequest(UUID id, UUID itemId, UUID requesterMemberId, String reason, RequestStatus status, Instant requestedAt, Instant decidedAt) {

    /** Còn chờ duyệt? */
    public boolean isPending() {
        return status == RequestStatus.PENDING;
    }

    /** Bản sao đã được quyết định tại {@code now}. */
    public DeletionRequest decided(RequestStatus newStatus, Instant now) {
        return new DeletionRequest(id, itemId, requesterMemberId, reason, newStatus, requestedAt, now);
    }
}
