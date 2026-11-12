package com.wander.shared;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * The OpenAPI document that the running application generates must equal the committed {@code backend/openapi.yaml}. The web client's
 * TypeScript types are generated from that file, so a stale file would silently desynchronize the two. After an intended API change
 * regenerate it with {@code ./gradlew test --tests OpenApiContractIT -Pwander.openapi.update=true} and commit the result together with
 * the regenerated web types ({@code npm --prefix web run gen:api}).
 */
class OpenApiContractIT extends ApiTestSupport {

    private static final Path COMMITTED = Path.of("openapi.yaml");

    @Test
    @DisplayName("backend/openapi.yaml is up to date with the application's generated OpenAPI document")
    void committedContractMatchesTheApplication() throws IOException {
        String generated = normalize(call("GET", "/v3/api-docs.yaml", null).raw().body());
        if (Boolean.parseBoolean(System.getProperty("wander.openapi.update"))) {
            Files.writeString(COMMITTED, generated);
            return;
        }
        assertThat(COMMITTED).as("backend/openapi.yaml must exist: run the update command in this class's Javadoc").exists();
        assertThat(normalize(Files.readString(COMMITTED)))
                .as("backend/openapi.yaml is stale: regenerate it (see the Javadoc of OpenApiContractIT)")
                .isEqualTo(generated);
    }

    /** Line endings and the trailing newline do not count as differences. */
    private static String normalize(String yaml) {
        return yaml.replace("\r\n", "\n").stripTrailing() + "\n";
    }
}
