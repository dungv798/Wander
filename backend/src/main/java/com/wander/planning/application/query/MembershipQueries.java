package com.wander.planning.application.query;

import com.wander.planning.application.view.PlanningViews.DeletionRequestView;
import com.wander.planning.application.view.PlanningViews.InvitePreviewView;
import com.wander.planning.application.view.PlanningViews.InviteView;
import com.wander.planning.application.view.PlanningViews.MemberView;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.port.InviteCodeHasher;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.planning.domain.vocabulary.RequestStatus;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The read side of members and invite links. Every method checks the role permission BEFORE reading; an outsider => 404. */
@Service
@Transactional(readOnly = true)
public class MembershipQueries {

    private final TripReadModel read;
    private final InviteCodeHasher hasher;
    private final Clock clock;

    /** Takes the read port, the invite-code hasher and the clock. */
    public MembershipQueries(TripReadModel read, InviteCodeHasher hasher, Clock clock) {
        this.read = read;
        this.hasher = hasher;
        this.clock = clock;
    }

    /** The trip's members (every member can see them); {@code self} marks the caller. The identity id is NOT returned. */
    public List<MemberView> members(UUID identityId, UUID tripId) {
        requireTrip(identityId, tripId);
        return read.members(tripId).stream()
                .map(m -> new MemberView(m.id().toString(), m.displayName(), m.role(), Timestamps.format(m.joinedAt()), m.identityId().equals(identityId)))
                .toList();
    }

    /** Status of the existing invite link (Organizer only); the code is not returned. Empty if there is none. */
    public Optional<InviteView> invite(UUID identityId, UUID tripId) {
        TripRow trip = requireTrip(identityId, tripId);
        if (!MemberRole.ORGANIZER.code().equals(trip.role())) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_ORGANIZER, PlanningMessages.NOT_ORGANIZER);
        }
        return read.unrevokedInvite(tripId).map(row -> new InviteView(row.id().toString(), Timestamps.format(row.createdAt()),
                Timestamps.format(row.expiresAt()), Timestamps.now(clock).isBefore(row.expiresAt())));
    }

    /** Preview of an invite link (public): wrong shape, wrong, expired, revoked, trip deleted => THE SAME error INVALID_INVITE. */
    public InvitePreviewView preview(String code) {
        if (!hasher.isWellFormed(code)) throw invalidInvite();
        return read.previewInvite(hasher.hash(code), Timestamps.now(clock))
                .map(row -> new InvitePreviewView(row.tripName(), row.memberCount())).orElseThrow(MembershipQueries::invalidInvite);
    }

    /**
     * The trip's deletion requests: the Organizer sees all (pending first, then decided ones, newest first); a member sees only THEIR OWN requests
     * (including 'Rejected', Q9). An outsider => 404.
     */
    public List<DeletionRequestView> deletionRequests(UUID identityId, UUID tripId) {
        TripRow trip = requireTrip(identityId, tripId);
        boolean organizer = MemberRole.ORGANIZER.code().equals(trip.role());
        List<MemberRow> members = read.members(tripId);
        UUID selfMemberId = members.stream().filter(m -> m.identityId().equals(identityId)).map(MemberRow::id).findFirst().orElseThrow(WanderException::notFound);
        java.util.Map<UUID, String> names = new java.util.HashMap<>();
        members.forEach(m -> names.put(m.id(), m.displayName()));
        return read.deletionRequests(tripId).stream()
                .filter(r -> organizer || r.requesterMemberId().equals(selfMemberId))
                .sorted(java.util.Comparator.comparing((RequestRow r) -> !RequestStatus.PENDING.code().equals(r.status())).thenComparing(RequestRow::requestedAt, java.util.Comparator.reverseOrder()))
                .map(r -> new DeletionRequestView(r.id().toString(), r.itemId().toString(), r.requesterMemberId().toString(), names.get(r.requesterMemberId()),
                        r.reason(), r.status(), Timestamps.format(r.requestedAt()), Timestamps.format(r.decidedAt())))
                .toList();
    }

    /** A visible trip of which this person is a member; an outsider => 404. */
    private TripRow requireTrip(UUID identityId, UUID tripId) {
        return read.findTrip(tripId, identityId).orElseThrow(WanderException::notFound);
    }

    /** The common error for every link that cannot be used. */
    private static WanderException invalidInvite() {
        return WanderException.invalid(PlanningErrorCodes.INVALID_INVITE, PlanningMessages.INVALID_INVITE, PlanningFields.INVITE_CODE);
    }
}
