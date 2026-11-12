package com.wander.planning.application.command;

import com.wander.planning.application.access.TripAccess;
import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.ChecklistItem;
import com.wander.planning.domain.port.ChecklistRepository;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Handles the preparation-checklist commands (Q12). One transaction per method; access is checked through {@link TripAccess} BEFORE touching data. */
@Service
@Transactional
public class ChecklistCommandHandler {

    private final ChecklistRepository checklist;
    private final TripAccess access;
    private final Clock clock;

    /** Takes the storage port, the access port and the clock. */
    public ChecklistCommandHandler(ChecklistRepository checklist, TripAccess access, Clock clock) {
        this.checklist = checklist;
        this.access = access;
        this.clock = clock;
    }

    /** The Organizer adds an item ({@code group} optional, {@code title} required) at the end; returns the item id. */
    public UUID add(UUID actor, UUID tripId, String group, String title) {
        access.requireOrganizer(tripId, actor);
        if (checklist.countOf(tripId) >= PlanningConstants.MAX_CHECKLIST_ITEMS) {
            throw WanderException.conflict(PlanningErrorCodes.CHECKLIST_FULL, PlanningMessages.CHECKLIST_FULL);
        }
        ChecklistItem item = ChecklistItem.create(tripId, group, title, checklist.nextPosition(tripId),
                Timestamps.now(clock));
        checklist.save(item);
        return item.id();
    }

    /** The Organizer edits the title/group (a field that is not given stays unchanged). */
    public void edit(UUID actor, UUID tripId, UUID itemId, String group, String title) {
        access.requireOrganizer(tripId, actor);
        ChecklistItem item = checklist.find(tripId, itemId).orElseThrow(WanderException::notFound);
        item.edit(group, title);
        checklist.save(item);
    }

    /** The Organizer deletes an item for good. */
    public void remove(UUID actor, UUID tripId, UUID itemId) {
        access.requireOrganizer(tripId, actor);
        if (!checklist.delete(tripId, itemId)) throw WanderException.notFound();
    }

    /** Every member sets/clears THEIR OWN completion mark (the person = the caller, never taken from the request body). */
    public void setDone(UUID actor, UUID tripId, UUID itemId, Boolean done) {
        access.requireMember(tripId, actor);
        ChecklistItem item = checklist.find(tripId, itemId).orElseThrow(WanderException::notFound);
        if (done == null) throw WanderException.invalidValue(com.wander.shared.kernel.constant.ErrorCodes.MALFORMED, PlanningFields.DONE);
        item.setDone(actor, done, Timestamps.now(clock));
        checklist.save(item);
    }

}
