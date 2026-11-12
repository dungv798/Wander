package com.wander.planning.application.command;

import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.model.TripInvite;
import com.wander.planning.domain.model.TripMember;
import com.wander.planning.domain.port.InviteCodeHasher;
import com.wander.planning.domain.port.TripRepository;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Handles the member and invite-link commands. One transaction per method; every rule lives in {@link Trip}. */
@Service
@Transactional
public class MembershipCommandHandler {

    private final TripRepository trips;
    private final InviteCodeHasher hasher;
    private final Clock clock;

    /** Takes the trip storage port, the invite-code hasher and the clock. */
    public MembershipCommandHandler(TripRepository trips, InviteCodeHasher hasher, Clock clock) {
        this.trips = trips;
        this.hasher = hasher;
        this.clock = clock;
    }

    /** Creates a new invite link and returns the CODE (shown only this once) along with the link. */
    public CreatedInvite createInvite(MembershipCommands.CreateInvite command) {
        Trip trip = load(command.actor(), command.tripId());
        String code = hasher.newCode();
        TripInvite invite = trip.circle().createInvite(command.actor(), hasher.hash(code), Timestamps.now(clock));
        trips.save(trip);
        return new CreatedInvite(invite, code);
    }

    /** Revokes the invite link in use. */
    public void revokeInvite(MembershipCommands.RevokeInvite command) {
        Trip trip = load(command.actor(), command.tripId());
        trip.circle().revokeInvite(command.actor(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Join a trip with a code; returns the trip id and the member. A malformed code / no trip => the same error INVALID_INVITE. */
    public Joined join(MembershipCommands.Join command) {
        String code = command.code();
        if (!hasher.isWellFormed(code)) throw invalidInvite();
        Trip trip = trips.findByInviteHash(hasher.hash(code)).orElseThrow(MembershipCommandHandler::invalidInvite);
        TripMember member = trip.joinWithInvite(command.actor(), command.displayName(), hasher.hash(code), Timestamps.now(clock));
        trips.save(trip);
        return new Joined(trip.id(), member);
    }

    /** The Organizer removes a member (and also revokes the invite link in use). */
    public void removeMember(MembershipCommands.RemoveMember command) {
        Trip trip = load(command.actor(), command.tripId());
        trip.circle().removeMember(command.actor(), command.memberId(), Timestamps.now(clock));
        trip.circle().dropPendingOf(command.memberId());
        trips.save(trip);
    }

    /** A member leaves the trip. */
    public void leave(MembershipCommands.Leave command) {
        Trip trip = load(command.actor(), command.tripId());
        UUID memberId = trip.requireMember(command.actor()).id();
        trip.circle().leave(command.actor(), Timestamps.now(clock));
        trip.circle().dropPendingOf(memberId);
        trips.save(trip);
    }

    /** Change your own display name. */
    public TripMember renameSelf(MembershipCommands.RenameSelf command) {
        Trip trip = load(command.actor(), command.tripId());
        TripMember renamed = trip.circle().renameMember(command.actor(), command.displayName(), Timestamps.now(clock));
        trips.save(trip);
        return renamed;
    }

    /** Loads a trip of which the caller is a member; an outsider and a deleted trip => 404. */
    private Trip load(UUID actor, UUID tripId) {
        return trips.findAccessible(tripId, actor).orElseThrow(WanderException::notFound);
    }

    /** The common error for every link that cannot be used. */
    private static WanderException invalidInvite() {
        return WanderException.invalid(PlanningErrorCodes.INVALID_INVITE, PlanningMessages.INVALID_INVITE, PlanningFields.INVITE_CODE);
    }

    /** Result of creating a link: the record and the code (a secret, returned only once). */
    public record CreatedInvite(TripInvite invite, String code) {
    }

    /** Result of joining a trip. */
    public record Joined(UUID tripId, TripMember member) {
    }
}
