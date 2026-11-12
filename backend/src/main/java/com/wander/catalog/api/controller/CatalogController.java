package com.wander.catalog.api.controller;

import com.wander.catalog.api.constant.CatalogApiConstants;
import com.wander.catalog.api.response.CatalogResponses;
import com.wander.catalog.application.query.CatalogQueries;
import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The Catalog API (read only). Public (DR-008 Q-a): no session needed so a newcomer can explore before having an identity;
 * instead it is rate limited by the caller's address. Photos are served publicly at {@code /catalog/photos/**} (ADR-010).
 * The list of public routes is in {@code SecurityConfig} of the identity module (a single source).
 */
@RestController
@SecurityRequirements
@RequestMapping(CatalogApiConstants.BASE_PATH)
public class CatalogController {

    private final CatalogQueries queries;
    private final RateLimits limits;
    private final ClientAddress clientAddress;

    /** Takes the catalog read side, the rate limiter and the resolver of the caller's address. */
    public CatalogController(CatalogQueries queries, RateLimits limits, ClientAddress clientAddress) {
        this.queries = queries;
        this.limits = limits;
        this.clientAddress = clientAddress;
    }

    /** The destinations that match the search string (empty = all); a string that is too long is cut. */
    @GetMapping(CatalogApiConstants.DESTINATIONS_PATH)
    public CatalogResponses.DestinationsResponse searchDestinations(HttpServletRequest request,
            @RequestParam(name = CatalogApiConstants.QUERY_PARAM, defaultValue = "") String query) {
        limitByAddress(request);
        return new CatalogResponses.DestinationsResponse(queries.searchDestinations(truncateQuery(query)));
    }

    /** The detail of one destination by id; 404 if it does not exist. */
    @GetMapping(CatalogApiConstants.DESTINATION_PATH)
    public CatalogResponses.DestinationResponse getDestination(HttpServletRequest request, @PathVariable String id) {
        limitByAddress(request);
        return new CatalogResponses.DestinationResponse(queries.destination(id));
    }

    /** The sample itineraries of a destination (N-2); an unknown destination 404, a destination with no itinerary yet returns an empty list. */
    @GetMapping(CatalogApiConstants.TEMPLATES_PATH)
    public CatalogResponses.TemplatesResponse getTemplates(HttpServletRequest request, @PathVariable String id) {
        limitByAddress(request);
        return new CatalogResponses.TemplatesResponse(queries.templates(id));
    }

    /** Rate limit of reading the public venue catalog by the caller's address; past the threshold 429. */
    private void limitByAddress(HttpServletRequest request) {
        limits.catalog(clientAddress.of(request));
    }

    /** Cuts the search string to the maximum length allowed. */
    private static String truncateQuery(String query) {
        int max = CatalogConstants.SEARCH_QUERY_MAX_LENGTH;
        return query.length() > max ? query.substring(0, max) : query;
    }
}
