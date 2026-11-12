package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.api.request.ChecklistItemRequest;
import com.wander.planning.api.request.DoneRequest;
import com.wander.planning.api.response.PlanningResponses;
import com.wander.planning.application.command.ChecklistCommandHandler;
import com.wander.planning.application.query.ChecklistQueries;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Preparation checklist API of ONE trip (Q12): the Organizer creates/edits/deletes, every member ticks their own and sees the progress. */
@RestController
@RequestMapping(PlanningApiConstants.TRIPS_PATH)
public class ChecklistController {

    private final ChecklistCommandHandler commands;
    private final ChecklistQueries queries;

    /** Takes the command handler and the read side. */
    public ChecklistController(ChecklistCommandHandler commands, ChecklistQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** The list of items with progress. */
    @GetMapping(PlanningApiConstants.CHECKLIST_PATH)
    public PlanningResponses.ChecklistItemsResponse list(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return new PlanningResponses.ChecklistItemsResponse(queries.list(principal.identityId(), parseId(tripId)));
    }

    /** The Organizer adds an item. */
    @PostMapping(PlanningApiConstants.CHECKLIST_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public PlanningResponses.ChecklistItemResponse add(AuthenticatedPrincipal principal, @PathVariable String tripId, @RequestBody ChecklistItemRequest body) {
        UUID trip = parseId(tripId);
        UUID id = commands.add(principal.identityId(), trip, body.group(), body.title());
        return new PlanningResponses.ChecklistItemResponse(queries.item(principal.identityId(), trip, id));
    }

    /** The Organizer edits the title/group. */
    @PatchMapping(PlanningApiConstants.CHECKLIST_ITEM_PATH)
    public PlanningResponses.ChecklistItemResponse edit(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId, @RequestBody ChecklistItemRequest body) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.edit(principal.identityId(), trip, item, body.group(), body.title());
        return new PlanningResponses.ChecklistItemResponse(queries.item(principal.identityId(), trip, item));
    }

    /** The Organizer deletes an item. */
    @DeleteMapping(PlanningApiConstants.CHECKLIST_ITEM_PATH)
    public ResponseEntity<Void> remove(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        commands.remove(principal.identityId(), parseId(tripId), parseId(itemId));
        return ResponseEntity.noContent().build();
    }

    /** Every member sets/clears THEIR OWN completion mark. */
    @PutMapping(PlanningApiConstants.CHECKLIST_DONE_PATH)
    public PlanningResponses.ChecklistItemResponse setDone(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId, @RequestBody DoneRequest body) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.setDone(principal.identityId(), trip, item, body.done());
        return new PlanningResponses.ChecklistItemResponse(queries.item(principal.identityId(), trip, item));
    }

    /** The id in the URL; a string that is not a UUID counts as non-existent (404). */
    private static UUID parseId(String raw) {
        return Ids.parse(raw).orElseThrow(WanderException::notFound);
    }
}
