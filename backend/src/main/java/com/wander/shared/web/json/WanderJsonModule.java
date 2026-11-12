package com.wander.shared.web.json;

import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.kernel.util.Patch;
import org.springframework.stereotype.Component;
import tools.jackson.databind.module.SimpleModule;

/** Registers the request-side value types with Jackson: {@link Patch} (not sent / null / value) and {@link FlexibleNumber}. */
@Component
public class WanderJsonModule extends SimpleModule {

    /** Registers the deserializers. */
    public WanderJsonModule() {
        super(JsonConstants.MODULE_NAME);
        addDeserializer(Patch.class, new PatchDeserializer());
        addDeserializer(FlexibleNumber.class, new FlexibleNumberDeserializer());
    }
}
