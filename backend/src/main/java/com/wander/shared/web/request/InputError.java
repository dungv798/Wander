package com.wander.shared.web.request;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declares, on a request record component, which application error to report when the JSON value has the wrong type (for example a
 * number where a string is expected). Without this annotation a wrong type is reported as {@code MALFORMED} for that field.
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.RECORD_COMPONENT, ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD})
public @interface InputError {

    /** Stable error code (for example {@code INVALID_TYPE}). */
    String code();

    /** User-facing message that goes with the code. */
    String message();

    /** Field name to report instead of the JSON property that had the wrong type (empty = report that property). */
    String field() default "";
}
