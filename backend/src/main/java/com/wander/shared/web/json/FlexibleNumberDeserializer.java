package com.wander.shared.web.json;

import com.wander.shared.kernel.util.FlexibleNumber;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

/**
 * Reads a {@link FlexibleNumber}: a JSON number or a JSON string. Any other token (boolean, object, array) is a type mismatch and
 * is reported as a malformed value of that field.
 */
public final class FlexibleNumberDeserializer extends ValueDeserializer<FlexibleNumber> {

    /** Number token to number, string token to text, everything else to a mismatch error. */
    @Override
    public FlexibleNumber deserialize(JsonParser parser, DeserializationContext ctxt) {
        JsonToken token = parser.currentToken();
        if (token == JsonToken.VALUE_NUMBER_INT || token == JsonToken.VALUE_NUMBER_FLOAT) {
            return FlexibleNumber.ofNumber(parser.getNumberValue());
        }
        if (token == JsonToken.VALUE_STRING) {
            return FlexibleNumber.ofText(parser.getString());
        }
        return (FlexibleNumber) ctxt.handleUnexpectedToken(FlexibleNumber.class, parser);
    }
}
