package com.wander.shared.web.config;

import com.fasterxml.jackson.databind.JavaType;
import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.kernel.util.Patch;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverter;
import io.swagger.v3.core.converter.ModelConverterContext;
import io.swagger.v3.core.util.Json;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import java.util.Iterator;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Teaches the OpenAPI generator how the API's two wrapper types look on the wire: a {@link Patch Patch&lt;T&gt;} field is documented as
 * the schema of {@code T} (the wrapper only records whether the key was sent), and a {@link FlexibleNumber} is "an integer or a
 * string of digits".
 */
@Component
public class OpenApiRequestTypes implements ModelConverter {

    /** Unwraps {@code Patch<T>} to {@code T} and maps {@code FlexibleNumber} to integer-or-string; everything else is left to the chain. */
    @Override
    public Schema<?> resolve(AnnotatedType type, ModelConverterContext context, Iterator<ModelConverter> chain) {
        JavaType javaType = Json.mapper().constructType(type.getType());
        if (javaType != null && Patch.class.equals(javaType.getRawClass())) {
            AnnotatedType inner = new AnnotatedType()
                    .type(javaType.containedTypeOrUnknown(0))
                    .ctxAnnotations(type.getCtxAnnotations())
                    .parent(type.getParent())
                    .resolveAsRef(type.isResolveAsRef());
            return context.resolve(inner);
        }
        if (javaType != null && FlexibleNumber.class.equals(javaType.getRawClass())) {
            return new Schema<>().oneOf(List.of(new IntegerSchema(), new StringSchema())).description(OpenApiSpecConstants.FLEXIBLE_NUMBER);
        }
        return chain.hasNext() ? chain.next().resolve(type, context, chain) : null;
    }
}
