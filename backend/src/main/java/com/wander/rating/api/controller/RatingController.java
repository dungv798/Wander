package com.wander.rating.api.controller;

import com.wander.rating.api.constant.RatingApiConstants;
import com.wander.rating.api.request.RateRequest;
import com.wander.rating.api.response.RatingResponses.RatingResponse;
import com.wander.rating.application.service.RatingService;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Rating endpoints. Every endpoint needs a valid session; the write budget per identity is applied by the shared limiter. */
@RestController
@RequestMapping(RatingApiConstants.PLACE_PATH)
public class RatingController {

    private final RatingService ratings;

    /** Takes the rating service. */
    public RatingController(RatingService ratings) {
        this.ratings = ratings;
    }

    /** The rating of a place as the caller sees it. */
    @GetMapping(RatingApiConstants.RATING_PATH)
    public RatingResponse view(AuthenticatedPrincipal principal, @PathVariable String placeRef) {
        return new RatingResponse(ratings.view(principal, placeRef));
    }

    /** Rate (or change the rating of) a place; one rating per identity and place. */
    @PutMapping(RatingApiConstants.RATING_PATH)
    public RatingResponse rate(AuthenticatedPrincipal principal, @PathVariable String placeRef, @Valid @RequestBody RateRequest body) {
        return new RatingResponse(ratings.rate(principal, placeRef, body.stars(), body.comment()));
    }

    /** Remove the caller's rating of a place. */
    @DeleteMapping(RatingApiConstants.RATING_PATH)
    public RatingResponse remove(AuthenticatedPrincipal principal, @PathVariable String placeRef) {
        return new RatingResponse(ratings.remove(principal, placeRef));
    }

    /** Report a comment. */
    @PostMapping(RatingApiConstants.REPORT_PATH)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void report(AuthenticatedPrincipal principal, @PathVariable String placeRef, @PathVariable String ratingId) {
        ratings.report(principal, placeRef, ratingId);
    }
}
