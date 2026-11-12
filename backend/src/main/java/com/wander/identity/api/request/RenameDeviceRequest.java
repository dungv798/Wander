package com.wander.identity.api.request;

import com.wander.shared.kernel.util.Patch;

/**
 * Body of {@code PATCH /api/sessions/current}: rename (or clear the name of) the calling device.
 *
 * @param deviceName the new label; the member must be sent (omitted is {@code REQUIRED}); null or empty clears the name
 */
public record RenameDeviceRequest(
        Patch<String> deviceName) {
}
