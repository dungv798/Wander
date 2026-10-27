package com.wander.shared.web.request;

/** Hằng số riêng của chức năng đọc thân JSON ({@link JsonBodyArgumentResolver}). */
final class JsonBodyConstants {

    /** Kích thước bộ đệm đọc luồng, tính bằng byte. */
    static final int READ_BUFFER_BYTES = 8192;

    private JsonBodyConstants() {
    }
}
