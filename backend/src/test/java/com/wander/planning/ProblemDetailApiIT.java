package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Error responses are RFC 9457 problem details: {@code application/problem+json}, the standard members, plus the stable {@code code}
 * and (for input errors) the offending {@code field}. 401, 409 and 429 are asserted next to the scenarios that provoke them
 * ({@code SecurityIT}, {@code ConcurrencyIT}, {@code PoiRateLimitIT}); this class covers validation and not-found.
 */
class ProblemDetailApiIT extends ApiTestSupport {

    @Test
    @DisplayName("400 validation: a missing required field is a problem with code REQUIRED and the field name")
    void validationErrorNamesTheField() {
        User u = newUser();
        Res res = call("POST", "/api/trips", u.token(), Map.of("destination", "da-lat", "startDate", "2026-12-05", "endDate", "2026-12-06"));
        assertProblem(res, 400, "REQUIRED");
        assertThat(res.str("field")).isEqualTo("name");
    }

    @Test
    @DisplayName("400 malformed JSON is a problem with code INVALID_JSON and no field")
    void malformedJsonIsAProblem() {
        User u = newUser();
        Res res = call("POST", "/api/trips", u.token(), "{ not json");
        assertProblem(res, 400, "INVALID_JSON");
        assertThat(res.at("field")).isNull();
    }

    @Test
    @DisplayName("404: someone else's or unknown trip is NOT_FOUND, indistinguishable from each other")
    void notFoundIsAProblem() {
        User owner = newUser();
        User stranger = newUser();
        String trip = newTrip(owner.token());
        Res unknown = call("GET", "/api/trips/" + UUID.randomUUID(), stranger.token());
        Res foreign = call("GET", "/api/trips/" + trip, stranger.token());
        assertProblem(unknown, 404, "NOT_FOUND");
        assertProblem(foreign, 404, "NOT_FOUND");
        // Same body apart from `instance` (the request path the caller itself sent): nothing tells "someone else's" from "unknown".
        assertThat(withoutInstance(foreign)).isEqualTo(withoutInstance(unknown));
    }

    /** The response body as a map without the {@code instance} member. */
    private static Map<Object, Object> withoutInstance(Res res) {
        Map<Object, Object> copy = new HashMap<>((Map<?, ?>) res.body());
        copy.remove("instance");
        return copy;
    }
}
