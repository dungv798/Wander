package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.api.request.SubmitDeletionRequest;
import com.wander.planning.api.response.PlanningResponses;
import com.wander.planning.application.command.RequestCommandHandler;
import com.wander.planning.application.command.RequestCommands;
import com.wander.planning.application.query.MembershipQueries;
import com.wander.planning.application.view.PlanningViews.DeletionRequestView;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Deletion-request API of ONE trip (H2): members submit/cancel, the Organizer decides. An outsider => 404. */
@RestController
@RequestMapping(PlanningApiConstants.TRIPS_PATH)
public class RequestController {

    private final RequestCommandHandler commands;
    private final MembershipQueries queries;

    /** Takes the command handler and the read side. */
    public RequestController(RequestCommandHandler commands, MembershipQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** List of requests: the Organizer sees all, a member only their own. */
    @GetMapping(PlanningApiConstants.REQUESTS_PATH)
    public PlanningResponses.RequestsResponse list(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return new PlanningResponses.RequestsResponse(queries.deletionRequests(principal.identityId(), parseId(tripId)));
    }

    /** A member asks to delete an item that belongs to someone else. */
    @PostMapping(PlanningApiConstants.REQUESTS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public PlanningResponses.RequestResponse submit(AuthenticatedPrincipal principal, @PathVariable String tripId, @RequestBody SubmitDeletionRequest body) {
        UUID trip = parseId(tripId);
        UUID id = commands.submit(body.toCommand(principal.identityId(), trip)).id();
        return new PlanningResponses.RequestResponse(find(principal, trip, id));
    }

    /** The requester cancels a pending request. */
    @DeleteMapping(PlanningApiConstants.REQUEST_PATH)
    public ResponseEntity<Void> cancel(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String requestId) {
        commands.cancel(new RequestCommands.Cancel(principal.identityId(), parseId(tripId), parseId(requestId)));
        return ResponseEntity.noContent().build();
    }

    /** The Organizer approves: the item is soft-deleted. */
    @PostMapping(PlanningApiConstants.REQUEST_APPROVE_PATH)
    public PlanningResponses.RequestResponse approve(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String requestId) {
        return decide(principal, tripId, requestId, true);
    }

    /** The Organizer rejects. */
    @PostMapping(PlanningApiConstants.REQUEST_REJECT_PATH)
    public PlanningResponses.RequestResponse reject(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String requestId) {
        return decide(principal, tripId, requestId, false);
    }

    /** Decide a request, then return the decided copy. */
    private PlanningResponses.RequestResponse decide(AuthenticatedPrincipal principal, String tripId, String requestId, boolean approve) {
        UUID trip = parseId(tripId);
        UUID id = commands.decide(new RequestCommands.Decide(principal.identityId(), trip, parseId(requestId), approve)).id();
        return new PlanningResponses.RequestResponse(find(principal, trip, id));
    }

    /** Re-reads a request by id (visible to the caller). */
    private DeletionRequestView find(AuthenticatedPrincipal principal, UUID trip, UUID id) {
        return queries.deletionRequests(principal.identityId(), trip).stream().filter(r -> r.id().equals(id.toString())).findFirst().orElseThrow(WanderException::notFound);
    }

    /** The id in the URL; a string that is not a UUID counts as non-existent (404). */
    private static UUID parseId(String raw) {
        return Ids.parse(raw).orElseThrow(WanderException::notFound);
    }
}
