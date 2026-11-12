package com.wander.shared.web.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.type.LogicalType;

/**
 * Request JSON is read strictly: a number or boolean where text is expected is an error, never silently turned into a string.
 * (The "no scalar coercion" mapper feature already rejects text where a number or boolean is expected; Jackson only allows
 * this direction to be tightened through the coercion configuration.)
 */
@Configuration
public class JsonStrictnessConfig {

    /**
     * Makes number-to-text and boolean-to-text coercion fail, and keeps the documented leniency that an empty string where a list is
     * expected means "empty list" (web forms send it).
     */
    @Bean
    public JsonMapperBuilderCustomizer strictTextCoercion() {
        return builder -> builder
                .withCoercionConfig(LogicalType.Textual, config -> {
                    config.setCoercion(CoercionInputShape.Integer, CoercionAction.Fail);
                    config.setCoercion(CoercionInputShape.Float, CoercionAction.Fail);
                    config.setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail);
                })
                .withCoercionConfig(LogicalType.Collection, config -> config.setCoercion(CoercionInputShape.EmptyString, CoercionAction.AsEmpty));
    }
}
