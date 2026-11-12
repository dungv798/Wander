package com.wander.shared.kernel.constant;

/**
 * Constants of the SYSTEM tier: values that shape the behavior of the whole application (input limits, shared defaults).
 * Base values are in {@link CommonConstants}; values specific to one feature are in that feature's {@code *Constants} file.
 */
public final class SystemConstants {

    /** Maximum size of a JSON request body, in bytes (64 KB). */
    public static final int MAX_REQUEST_BODY_BYTES = 64 * CommonConstants.BYTES_PER_KILOBYTE;

    private SystemConstants() {
    }
}
