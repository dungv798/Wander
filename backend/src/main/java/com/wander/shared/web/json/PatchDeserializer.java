package com.wander.shared.web.json;

import com.wander.shared.kernel.util.Patch;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.BeanProperty;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ValueDeserializer;

/**
 * Reads {@link Patch} request fields so that "not sent", "sent as null" and "sent with a value" stay distinct: a missing key yields
 * {@code Patch.absent()}, an explicit {@code null} yields {@code Patch.of(null)}, anything else {@code Patch.of(value)} where the
 * value is read with the deserializer of the declared type argument ({@code Patch<List<String>>} reads a string array, and so on).
 */
public final class PatchDeserializer extends ValueDeserializer<Patch<?>> {

    private final ValueDeserializer<Object> valueDeserializer;

    /** The prototype registered with the module; it is replaced per property by {@link #createContextual}. */
    public PatchDeserializer() {
        this(null);
    }

    private PatchDeserializer(ValueDeserializer<Object> valueDeserializer) {
        this.valueDeserializer = valueDeserializer;
    }

    /** Resolves the deserializer of the wrapped type from the declared generic argument of the property. */
    @Override
    public ValueDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) {
        JavaType patchType = property != null ? property.getType() : ctxt.getContextualType();
        JavaType valueType = patchType.containedTypeOrUnknown(0);
        return new PatchDeserializer(ctxt.findContextualValueDeserializer(valueType, property));
    }

    /** A present, non-null value. */
    @Override
    public Patch<?> deserialize(JsonParser parser, DeserializationContext ctxt) {
        return Patch.of(valueDeserializer.deserialize(parser, ctxt));
    }

    /** An explicit JSON {@code null}: present, with a null value. */
    @Override
    public Object getNullValue(DeserializationContext ctxt) {
        return Patch.of(null);
    }

    /** The key was not in the JSON object. */
    @Override
    public Object getAbsentValue(DeserializationContext ctxt) {
        return Patch.absent();
    }
}
