package com.wander.shared.web.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadata of the generated OpenAPI document: title, version and the bearer-token security scheme every endpoint uses except the few
 * public ones (those are marked with an empty security requirement on the operation).
 */
@Configuration
public class OpenApiConfig {

    /** The document header and the global bearer requirement. */
    @Bean
    public OpenAPI wanderOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title(OpenApiConstants.TITLE)
                        .version(OpenApiConstants.VERSION)
                        .description(OpenApiConstants.DESCRIPTION))
                .components(new Components().addSecuritySchemes(OpenApiConstants.BEARER_SCHEME, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme(OpenApiConstants.BEARER)
                        .description(OpenApiConstants.BEARER_DESCRIPTION)))
                .addSecurityItem(new SecurityRequirement().addList(OpenApiConstants.BEARER_SCHEME));
    }
}
