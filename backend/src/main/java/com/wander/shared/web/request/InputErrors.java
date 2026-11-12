package com.wander.shared.web.request;

import java.lang.reflect.RecordComponent;
import java.util.Optional;

/** Looks up the {@link InputError} declared on a request record component. */
public final class InputErrors {

    private InputErrors() {
    }

    /**
     * The error declared for {@code field} of the record {@code owner}, if the owner is a record that declares one.
     *
     * @param owner the object being deserialized when the mismatch happened (may be {@code null})
     * @param field the JSON property name, which equals the record component name
     */
    public static Optional<InputError> declaredFor(Object owner, String field) {
        if (owner == null || field == null) {
            return Optional.empty();
        }
        Class<?> type = owner instanceof Class<?> c ? c : owner.getClass();
        if (!type.isRecord()) {
            return Optional.empty();
        }
        for (RecordComponent component : type.getRecordComponents()) {
            if (component.getName().equals(field)) {
                return Optional.ofNullable(component.getAnnotation(InputError.class));
            }
        }
        return Optional.empty();
    }
}
