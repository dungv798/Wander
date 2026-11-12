package com.wander.planning.application.access;

import com.wander.planning.application.query.TripReadModel;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.shared.kernel.error.WanderException;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * The access gate in ONE PLACE for light trip-related features that do not load the aggregate (checklist...). The role is looked up in the DB on every request
 * (no cache): a removed person loses access immediately. An outsider and a deleted trip => 404 (INV-6); a regular member doing an Organizer action => 403.
 */
@Component
public class TripAccess {

    private final TripReadModel read;

    /** Takes the read port. */
    public TripAccess(TripReadModel read) {
        this.read = read;
    }

    /** The caller's role; an outsider => 404. */
    public MemberRole requireMember(UUID tripId, UUID identityId) {
        return read.roleIn(tripId, identityId).flatMap(MemberRole::fromCode).orElseThrow(WanderException::notFound);
    }

    /** Organizer only: an outsider => 404, a regular member => 403 NOT_ORGANIZER. */
    public void requireOrganizer(UUID tripId, UUID identityId) {
        if (requireMember(tripId, identityId) != MemberRole.ORGANIZER) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_ORGANIZER, PlanningMessages.NOT_ORGANIZER);
        }
    }
}
