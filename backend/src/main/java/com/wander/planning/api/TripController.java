package com.wander.planning.api;

import com.wander.planning.application.command.PlanningCommandHandler;
import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.application.query.PlanningQueries;
import com.wander.planning.application.query.PlanningViews;
import com.wander.shared.kernel.AuthenticatedPrincipal;
import com.wander.shared.kernel.Ids;
import com.wander.shared.kernel.WanderException;
import com.wander.shared.web.JsonBody;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * API của Planning. Mẫu CQRS ở mức controller: lệnh ghi qua {@link PlanningCommandHandler} (trả id),
 * rồi đọc lại qua {@link PlanningQueries} để trả read model. Chuyến của người khác ⇒ 404 như không tồn tại (INV-6).
 */
@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final PlanningCommandHandler commands;
    private final PlanningQueries queries;

    public TripController(PlanningCommandHandler commands, PlanningQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    @GetMapping
    public Map<String, Object> list(AuthenticatedPrincipal p) {
        return Map.of("trips", queries.listTrips(p.identityId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(AuthenticatedPrincipal p, JsonBody body) {
        UUID id = commands.handle(new PlanningCommands.CreateTrip(p.identityId(), body.asMap()));
        return Map.of("trip", queries.trip(p.identityId(), id));
    }

    @GetMapping("/{tripId}")
    public PlanningViews.TripDetail detail(AuthenticatedPrincipal p, @PathVariable String tripId) {
        return queries.detail(p.identityId(), id(tripId));
    }

    @PatchMapping("/{tripId}")
    public Map<String, Object> update(AuthenticatedPrincipal p, @PathVariable String tripId, JsonBody body) {
        UUID trip = id(tripId);
        commands.handle(new PlanningCommands.UpdateTrip(p.identityId(), trip, body.asMap()));
        return Map.of("trip", queries.trip(p.identityId(), trip));
    }

    @PostMapping("/{tripId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addItem(AuthenticatedPrincipal p, @PathVariable String tripId, JsonBody body) {
        UUID trip = id(tripId);
        UUID item = commands.handle(new PlanningCommands.AddItem(p.identityId(), trip, body.asMap()));
        return Map.of("item", queries.item(p.identityId(), trip, item));
    }

    @GetMapping("/{tripId}/items/{itemId}")
    public Map<String, Object> item(AuthenticatedPrincipal p, @PathVariable String tripId, @PathVariable String itemId) {
        return Map.of("item", queries.item(p.identityId(), id(tripId), id(itemId)));
    }

    @PatchMapping("/{tripId}/items/{itemId}")
    public Map<String, Object> editItem(AuthenticatedPrincipal p, @PathVariable String tripId, @PathVariable String itemId,
                                        JsonBody body) {
        UUID trip = id(tripId);
        UUID item = id(itemId);
        commands.handle(new PlanningCommands.EditItem(p.identityId(), trip, item, body.asMap()));
        return Map.of("item", queries.item(p.identityId(), trip, item));
    }

    @DeleteMapping("/{tripId}/items/{itemId}")
    public Map<String, Object> softDelete(AuthenticatedPrincipal p, @PathVariable String tripId, @PathVariable String itemId) {
        UUID trip = id(tripId);
        UUID item = id(itemId);
        commands.handle(new PlanningCommands.SoftDeleteItem(p.identityId(), trip, item));
        return Map.of("item", queries.item(p.identityId(), trip, item));
    }

    @PostMapping("/{tripId}/items/{itemId}/restore")
    public Map<String, Object> restore(AuthenticatedPrincipal p, @PathVariable String tripId, @PathVariable String itemId) {
        UUID trip = id(tripId);
        UUID item = id(itemId);
        commands.handle(new PlanningCommands.RestoreItem(p.identityId(), trip, item));
        return Map.of("item", queries.item(p.identityId(), trip, item));
    }

    @DeleteMapping("/{tripId}/items/{itemId}/permanent")
    public ResponseEntity<Void> purge(AuthenticatedPrincipal p, @PathVariable String tripId, @PathVariable String itemId) {
        commands.handle(new PlanningCommands.PurgeItem(p.identityId(), id(tripId), id(itemId)));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{tripId}/items/{itemId}/done")
    public Map<String, Object> setDone(AuthenticatedPrincipal p, @PathVariable String tripId, @PathVariable String itemId,
                                       JsonBody body) {
        UUID trip = id(tripId);
        UUID item = id(itemId);
        commands.handle(new PlanningCommands.SetTaskDone(p.identityId(), trip, item, body.get("done")));
        return Map.of("item", queries.item(p.identityId(), trip, item));
    }

    @PostMapping("/{tripId}/days/{day}/reorder")
    public Map<String, Object> reorder(AuthenticatedPrincipal p, @PathVariable String tripId, @PathVariable String day,
                                       JsonBody body) {
        UUID trip = id(tripId);
        LocalDate d = commands.handle(new PlanningCommands.ReorderDay(p.identityId(), trip, day, body.get("orderedIds")));
        return Map.of("items", queries.dayItems(p.identityId(), trip, d));
    }

    @GetMapping("/{tripId}/trash")
    public Map<String, Object> trash(AuthenticatedPrincipal p, @PathVariable String tripId) {
        return Map.of("items", queries.trash(p.identityId(), id(tripId)));
    }

    private static UUID id(String raw) {
        return Ids.parse(raw).orElseThrow(WanderException::notFound);
    }
}
