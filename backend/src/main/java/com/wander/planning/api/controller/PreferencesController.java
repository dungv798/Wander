package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.api.request.InterestsRequest;
import com.wander.planning.api.response.PlanningResponses;
import com.wander.planning.application.command.PlanningCommandHandler;
import com.wander.planning.application.query.PlanningQueries;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Preferences-by-identity API (BE-10): read and replace the onboarding's 'What are you into?', tied to the identity and not to one trip. */
@RestController
@RequestMapping(PlanningApiConstants.PREFERENCES_PATH)
public class PreferencesController {

    private final PlanningCommandHandler commands;
    private final PlanningQueries queries;

    /** Takes the command handler (writes) and the read side. */
    public PreferencesController(PlanningCommandHandler commands, PlanningQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** The existing preferences of the calling identity (code + label, in a fixed order); empty if not set. */
    @GetMapping
    public PlanningResponses.InterestsResponse preferences(AuthenticatedPrincipal principal) {
        return new PlanningResponses.InterestsResponse(queries.interestPreferences(principal.identityId()));
    }

    /** Replaces all preferences (idempotent); an empty or null list clears them; returns the preferences after setting. */
    @PutMapping(PlanningApiConstants.INTERESTS_PATH)
    public PlanningResponses.InterestsResponse setInterests(AuthenticatedPrincipal principal, @RequestBody InterestsRequest body) {
        commands.setInterestPreferences(body.toCommand(principal.identityId()));
        return new PlanningResponses.InterestsResponse(queries.interestPreferences(principal.identityId()));
    }
}
