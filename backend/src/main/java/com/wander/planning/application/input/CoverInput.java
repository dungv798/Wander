package com.wander.planning.application.input;

/**
 * A trip cover as sent by a client: a kind ({@code photo} or {@code gradient}) and a reference. It becomes a validated
 * {@link com.wander.planning.domain.model.Cover} through {@link PlanningInput#cover}.
 *
 * @param kind cover kind code
 * @param ref  photo id or gradient name
 */
public record CoverInput(String kind, String ref) {
}
