package com.wander.shared.web.config;

import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadata of the generated OpenAPI document: title, version and the bearer-token security scheme every endpoint uses except the few
 * public ones (those are marked with an empty security requirement on the operation).
 */
@Configuration
public class OpenApiConfig {

    static {
        // The authenticated caller is injected by the framework; it is not a parameter of the API.
        SpringDocUtils.getConfig().addRequestWrapperToIgnore(AuthenticatedPrincipal.class);
    }

    /** Adds the shared {@code Problem} schema and a default error response to every operation. */
    @Bean
    public OpenApiCustomizer problemResponses() {
        return openApi -> {
            ObjectSchema problem = new ObjectSchema();
            for (String member : OpenApiSpecConstants.PROBLEM_TEXT_MEMBERS) {
                problem.addProperty(member, new StringSchema());
            }
            problem.addProperty(OpenApiSpecConstants.PROBLEM_STATUS, new IntegerSchema());
            problem.getProperties().get(OpenApiSpecConstants.PROBLEM_CODE_MEMBER).setDescription(OpenApiSpecConstants.PROBLEM_CODE);
            openApi.getComponents().addSchemas(OpenApiSpecConstants.PROBLEM_SCHEMA, problem);
            Schema<?> reference = new Schema<>().$ref(OpenApiSpecConstants.SCHEMA_REF_PREFIX + OpenApiSpecConstants.PROBLEM_SCHEMA);
            ApiResponse response = new ApiResponse().description(OpenApiSpecConstants.PROBLEM_RESPONSE)
                    .content(new Content().addMediaType(OpenApiSpecConstants.PROBLEM_MEDIA_TYPE, new MediaType().schema(reference)));
            openApi.getPaths().values().forEach(path -> path.readOperations()
                    .forEach(operation -> operation.getResponses().addApiResponse(OpenApiSpecConstants.DEFAULT_RESPONSE, response)));
        };
    }

    /** The document header and the global bearer requirement. */
    @Bean
    public OpenAPI wanderOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title(OpenApiSpecConstants.TITLE)
                        .version(OpenApiSpecConstants.VERSION)
                        .description(OpenApiSpecConstants.DESCRIPTION))
                .components(new Components().addSecuritySchemes(OpenApiSpecConstants.BEARER_SCHEME, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme(OpenApiSpecConstants.BEARER)
                        .description(OpenApiSpecConstants.BEARER_DESCRIPTION)))
                .servers(List.of(new Server().url(OpenApiSpecConstants.SERVER_URL)))
                .addSecurityItem(new SecurityRequirement().addList(OpenApiSpecConstants.BEARER_SCHEME));
    }
}
