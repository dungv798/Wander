package com.wander;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * The module structure as Spring Modulith sees it: {@code catalog}, {@code identity}, {@code planning} and {@code rating} are
 * application modules; {@code shared} is an OPEN module they all use. Verification fails on a dependency cycle, on a business
 * module reaching into another one, and on use of a module's internal packages. It complements {@link ArchitectureTest} (layers).
 */
class ModulesTest {

    private static final ApplicationModules MODULES = ApplicationModules.of(WanderApplication.class);

    @Test
    @DisplayName("module structure verifies: no cycles, no business module depends on another, shared is open")
    void modulesVerify() {
        MODULES.verify();
        assertThat(MODULES.stream().map(module -> module.getIdentifier().toString()))
                .containsExactlyInAnyOrder("catalog", "identity", "planning", "rating", "shared");
    }

    @Test
    @DisplayName("business modules depend only on shared")
    void businessModulesDependOnlyOnShared() {
        for (String name : new String[] {"catalog", "identity", "planning", "rating"}) {
            var module = MODULES.getModuleByName(name).orElseThrow();
            var dependencies = MODULES.getModuleByName(name).orElseThrow().getDirectDependencies(MODULES).stream()
                    .map(dependency -> dependency.getTargetModule().getIdentifier().toString()).distinct().toList();
            assertThat(dependencies).as("direct module dependencies of %s", module.getIdentifier()).isSubsetOf("shared");
        }
    }

    @Test
    @DisplayName("with -Pwander.modules.docs=true, regenerates the module diagrams and canvases in docs/architecture/modules")
    void generatesModuleDocumentation() throws IOException {
        assumeTrue(Boolean.parseBoolean(System.getProperty("wander.modules.docs")), "run with -Pwander.modules.docs=true to regenerate");
        new Documenter(MODULES, Documenter.Options.defaults().withOutputFolder("../docs/architecture/modules"))
                .writeModulesAsPlantUml()
                .writeIndividualModulesAsPlantUml()
                .writeModuleCanvases();
        assertThat(java.nio.file.Files.list(java.nio.file.Path.of("../docs/architecture/modules")).count()).isPositive();
    }
}
