package com.wander.shared.kernel;

import java.util.UUID;

/**
 * Danh tính đã xác thực của yêu cầu hiện tại. Module identity tạo ra; module planning chỉ đọc
 * identityId (chủ chuyến) mà không phụ thuộc vào module identity.
 */
public record AuthenticatedPrincipal(UUID identityId, UUID sessionId) {
}
