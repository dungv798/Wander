package com.wander.shared.web.error;

import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.web.request.InputError;
import com.wander.shared.web.request.InputErrors;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import tools.jackson.core.JacksonException;
import tools.jackson.core.exc.StreamReadException;
import tools.jackson.databind.exc.MismatchedInputException;

/**
 * Translates failures of reading a JSON request body into the API's input errors:
 * invalid JSON syntax or a body that is not a JSON object is {@code INVALID_JSON}; a value of the wrong type for a field is the
 * error the request record declares for that field ({@link InputError}) or, by default, {@code MALFORMED} naming the field.
 */
public final class RequestErrors {

    private RequestErrors() {
    }

    /** The application error for an unreadable request body, found by walking the cause chain of {@code failure}. */
    public static WanderException from(Throwable failure) {
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (cause instanceof WanderException business) {
                return business;
            }
            if (cause instanceof MismatchedInputException mismatch) {
                return fromMismatch(mismatch);
            }
            if (cause instanceof StreamReadException) {
                return WanderException.invalid(ErrorCodes.INVALID_JSON, ErrorMessages.JSON_SYNTAX_INVALID, null);
            }
        }
        return WanderException.invalid(ErrorCodes.INVALID_JSON, ErrorMessages.JSON_SYNTAX_INVALID, null);
    }

    /**
     * The application error for a request record that failed Bean Validation: the first violation (by field name, so the answer is
     * deterministic) as {@code REQUIRED} (missing), {@code OUT_OF_RANGE} (bounds), {@code TOO_MANY} (collection size),
     * {@code TOO_LONG} (text length) or {@code MALFORMED}.
     */
    public static WanderException fromValidation(BindingResult result) {
        FieldError first = result.getFieldErrors().stream().min(Comparator.comparing(FieldError::getField)).orElse(null);
        if (first == null) {
            return WanderException.invalid(ErrorCodes.MALFORMED, ErrorMessages.VALUE_INVALID, null);
        }
        String code = switch (String.valueOf(first.getCode())) {
            case ValidationConstants.NOT_NULL, ValidationConstants.NOT_BLANK, ValidationConstants.NOT_EMPTY -> ErrorCodes.REQUIRED;
            case ValidationConstants.MIN, ValidationConstants.MAX, ValidationConstants.RANGE -> ErrorCodes.OUT_OF_RANGE;
            case ValidationConstants.SIZE -> first.getRejectedValue() instanceof Collection<?> ? ErrorCodes.TOO_MANY : ErrorCodes.TOO_LONG;
            default -> ErrorCodes.MALFORMED;
        };
        return WanderException.invalidValue(code, first.getField());
    }

    /** A type mismatch: at the root the body is not an object; deeper it names the offending field. */
    private static WanderException fromMismatch(MismatchedInputException mismatch) {
        List<JacksonException.Reference> path = mismatch.getPath();
        for (int i = path.size() - 1; i >= 0; i--) {
            String field = path.get(i).getPropertyName();
            if (field != null) {
                Optional<InputError> declared = InputErrors.declaredFor(path.get(i).from(), field);
                return declared.map(error -> WanderException.invalid(error.code(), error.message(), error.field().isEmpty() ? field : error.field()))
                        .orElseGet(() -> WanderException.invalidValue(ErrorCodes.MALFORMED, field));
            }
        }
        return WanderException.invalid(ErrorCodes.INVALID_JSON, ErrorMessages.JSON_OBJECT_REQUIRED, null);
    }
}
