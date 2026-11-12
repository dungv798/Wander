package com.wander;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Wander - a modular monolith. The bounded contexts: {@code identity} (anonymous identity, sessions, recovery),
 * {@code planning} (trips, days, items) and {@code catalog} (the editorial venue catalog, read only). The module and layer boundaries
 * are checked automatically by ArchUnit (src/test/java/com/wander/ArchitectureTest.java).
 */
@SpringBootApplication
public class WanderApplication {

    /** The application entry point: starts Spring Boot with the command-line arguments. */
    public static void main(String[] args) {
        SpringApplication.run(WanderApplication.class, args);
    }
}
