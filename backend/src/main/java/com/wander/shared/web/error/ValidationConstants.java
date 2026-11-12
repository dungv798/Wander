package com.wander.shared.web.error;

/** Codes Spring reports for the Bean Validation constraints the API uses (the simple name of the constraint annotation). */
final class ValidationConstants {

    /** {@code @NotNull}. */
    static final String NOT_NULL = "NotNull";

    /** {@code @NotBlank}. */
    static final String NOT_BLANK = "NotBlank";

    /** {@code @NotEmpty}. */
    static final String NOT_EMPTY = "NotEmpty";

    /** {@code @Min}. */
    static final String MIN = "Min";

    /** {@code @Max}. */
    static final String MAX = "Max";

    /** {@code @Range}. */
    static final String RANGE = "Range";

    /** {@code @Size}. */
    static final String SIZE = "Size";

    private ValidationConstants() {
    }
}
