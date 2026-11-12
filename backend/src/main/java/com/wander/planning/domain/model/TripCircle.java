package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.planning.domain.vocabulary.RequestStatus;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * The circle of people of one trip (Slice 1b, DR-021): members and invite links with shared invariants - exactly one Organizer, at most
 * {@value PlanningConstants#MAX_MEMBERS} members, no duplicate display names, at most one link that is not revoked. Part of the {@link Trip} aggregate:
 * reached only through {@code trip.circle()}, and saved with the trip (same optimistic lock) so concurrent joins cannot exceed the ceiling.
 */
public final class TripCircle {

    private final List<TripMember> members;
    private final List<TripInvite> invites;
    private final List<DeletionRequest> requests;

    /** Built from stored data. */
    TripCircle(List<TripMember> members, List<TripInvite> invites, List<DeletionRequest> requests) {
        this.members = new ArrayList<>(members);
        this.invites = new ArrayList<>(invites);
        this.requests = new ArrayList<>(requests);
    }

    /** Every deletion request (pending and decided), oldest first. */
    public List<DeletionRequest> requests() {
        return List.copyOf(requests);
    }

    /** Members (including the Organizer), in the order they joined the trip. */
    public List<TripMember> members() {
        return List.copyOf(members);
    }

    /** Every invite link (including revoked/expired ones). */
    public List<TripInvite> invites() {
        return List.copyOf(invites);
    }

    /** The member that corresponds to an identity, if any. */
    public Optional<TripMember> memberOf(UUID identityId) {
        return members.stream().filter(m -> m.identityId().equals(identityId)).findFirst();
    }

    /** The role of an identity in the trip; empty for an outsider. */
    public Optional<MemberRole> roleOf(UUID identityId) {
        return memberOf(identityId).map(TripMember::role);
    }

    /** The member of this identity; an outsider => 404 (does not reveal that the trip exists, INV-6). */
    public TripMember requireMember(UUID identityId) {
        return memberOf(identityId).orElseThrow(WanderException::notFound);
    }

    /** Organizer only: an outsider => 404, a regular member => 403 NOT_ORGANIZER. */
    public void requireOrganizer(UUID identityId) {
        if (requireMember(identityId).role() != MemberRole.ORGANIZER) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_ORGANIZER, PlanningMessages.NOT_ORGANIZER);
        }
    }

    /** Permission to edit/delete/restore an item (H3): the Organizer any item; a member only items they added (403 NOT_YOUR_ITEM); an outsider 404. */
    public void requireMayChange(UUID identityId, UUID itemAddedByMemberId) {
        TripMember member = requireMember(identityId);
        if (member.role() == MemberRole.ORGANIZER) return;
        if (!member.id().equals(itemAddedByMemberId)) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_YOUR_ITEM, PlanningMessages.NOT_YOUR_ITEM);
        }
    }

    /** The link that is usable at {@code now}, if any. */
    public Optional<TripInvite> activeInvite(Instant now) {
        return invites.stream().filter(i -> i.isActiveAt(now)).findFirst();
    }

    /** The Organizer creates a new invite link (expires after INVITE_TTL_DAYS); every earlier link that is not revoked is revoked so only one remains. */
    public TripInvite createInvite(UUID actor, String codeHash, Instant now) {
        requireOrganizer(actor);
        revokeAllInvites(now);
        TripInvite invite = new TripInvite(UUID.randomUUID(), codeHash, now, now.plus(PlanningConstants.INVITE_TTL_DAYS, ChronoUnit.DAYS), null);
        invites.add(invite);
        return invite;
    }

    /** The Organizer revokes the link in use; no link in use => 404. */
    public void revokeInvite(UUID actor, Instant now) {
        requireOrganizer(actor);
        if (activeInvite(now).isEmpty()) throw WanderException.notFound();
        revokeAllInvites(now);
    }

    /** Revokes every link that is not revoked (including expired ones). */
    private void revokeAllInvites(Instant now) {
        invites.replaceAll(i -> i.revoked(now));
    }

    /**
     * Joins the trip with a link: the code must match the link in use (wrong/expired/revoked/trip deleted => ONE error INVALID_INVITE). If already a
     * member, that very member is returned (idempotent). MAX_MEMBERS reached => TRIP_FULL.
     */
    public TripMember joinWithInvite(UUID identityId, String rawDisplayName, String codeHash, Instant now, boolean tripDeleted) {
        boolean valid = !tripDeleted && activeInvite(now).map(i -> i.codeHash().equals(codeHash)).orElse(false);
        if (!valid) throw WanderException.invalid(PlanningErrorCodes.INVALID_INVITE, PlanningMessages.INVALID_INVITE, PlanningFields.INVITE_CODE);
        Optional<TripMember> existing = memberOf(identityId);
        if (existing.isPresent()) return existing.get();
        if (members.size() >= PlanningConstants.MAX_MEMBERS) {
            throw WanderException.conflict(PlanningErrorCodes.TRIP_FULL, PlanningMessages.TRIP_FULL);
        }
        TripMember member = new TripMember(UUID.randomUUID(), identityId, MemberRole.MEMBER, uniqueDisplayName(rawDisplayName, null, MemberRole.MEMBER), now);
        members.add(member);
        return member;
    }

    /** The Organizer removes a member; the Organizer cannot be removed; after removal the link in use is revoked (the removed person cannot rejoin with the old code). */
    public void removeMember(UUID actor, UUID memberId, Instant now) {
        requireOrganizer(actor);
        TripMember target = members.stream().filter(m -> m.id().equals(memberId)).findFirst().orElseThrow(WanderException::notFound);
        if (target.role() == MemberRole.ORGANIZER) {
            throw WanderException.conflict(PlanningErrorCodes.ORGANIZER_CANNOT_LEAVE, PlanningMessages.ORGANIZER_CANNOT_LEAVE);
        }
        members.remove(target);
        revokeAllInvites(now);
    }

    /** A member leaves the trip themself; the Organizer cannot leave; an outsider 404. */
    public void leave(UUID identityId, Instant now) {
        TripMember member = requireMember(identityId);
        if (member.role() == MemberRole.ORGANIZER) {
            throw WanderException.conflict(PlanningErrorCodes.ORGANIZER_CANNOT_LEAVE, PlanningMessages.ORGANIZER_CANNOT_LEAVE);
        }
        members.remove(member);
    }

    /** Changes one's own display name by the same rule (it does not clash with oneself). */
    public TripMember renameMember(UUID identityId, String rawDisplayName, Instant now) {
        TripMember member = requireMember(identityId);
        TripMember renamed = member.withDisplayName(uniqueDisplayName(rawDisplayName, member.id(), member.role()));
        members.replaceAll(m -> m.id().equals(member.id()) ? renamed : m);
        return renamed;
    }

    /**
     * Normalizes the display name (NFC, control/invisible characters forbidden, at most MAX_DISPLAY_NAME code points; blank => REQUIRED) and makes it unique
     * within the trip (case-insensitive): on a clash a suffix ' - 2', ' - 3'... is added after trimming the base name to fit the limit. 'Organizer'
     * is the name reserved for the Organizer.
     */
    private String uniqueDisplayName(String raw, UUID exceptMemberId, MemberRole role) {
        String text = Labels.normalize(raw == null ? "" : raw, PlanningConstants.MAX_DISPLAY_NAME, PlanningFields.DISPLAY_NAME);
        if (text.isEmpty()) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.DISPLAY_NAME_REQUIRED, PlanningFields.DISPLAY_NAME);
        }
        String candidate = text;
        for (int n = 2; isDisplayNameTaken(candidate, exceptMemberId, role); n++) {
            String suffix = PlanningConstants.NAME_SUFFIX_SEPARATOR + n;
            int room = PlanningConstants.MAX_DISPLAY_NAME - suffix.length();
            int keep = Math.min(text.codePointCount(0, text.length()), room);
            candidate = text.substring(0, text.offsetByCodePoints(0, keep)) + suffix;
        }
        return candidate;
    }

    /** The name is already used by someone else (case-insensitive) or is the Organizer's reserved name. */
    private boolean isDisplayNameTaken(String candidate, UUID exceptMemberId, MemberRole role) {
        boolean reserved = role != MemberRole.ORGANIZER && PlanningConstants.ORGANIZER_DISPLAY_NAME.equalsIgnoreCase(candidate);
        return reserved || members.stream().anyMatch(m -> !m.id().equals(exceptMemberId) && m.displayName().equalsIgnoreCase(candidate));
    }


    // ---- deletion requests (H2/H3) ----

    /**
     * A member asks to delete an item that belongs to SOMEONE ELSE. The Organizer and the item's owner delete directly so they are refused; the item must be visible; at most one pending request per item,
     * at most MAX_PENDING_REQUESTS pending requests per member. The reason is optional, normalized like a self-declared label.
     */
    public DeletionRequest submitDeletion(UUID identityId, Item item, String rawReason, Instant now) {
        TripMember requester = requireMember(identityId);
        if (requester.role() == MemberRole.ORGANIZER) {
            throw WanderException.conflict(PlanningErrorCodes.ORGANIZER_DELETES_DIRECTLY, PlanningMessages.ORGANIZER_DELETES_DIRECTLY);
        }
        String reason = Labels.normalize(rawReason == null ? "" : rawReason, PlanningConstants.MAX_REQUEST_REASON, PlanningFields.REASON);
        if (item.isDeleted()) throw WanderException.conflict(PlanningErrorCodes.ITEM_DELETED, PlanningMessages.ITEM_DELETED);
        if (requester.id().equals(item.addedByMemberId())) {
            throw WanderException.conflict(PlanningErrorCodes.OWN_ITEM_DELETE_DIRECTLY, PlanningMessages.OWN_ITEM_DELETE_DIRECTLY);
        }
        if (requests.stream().anyMatch(r -> r.isPending() && r.itemId().equals(item.id()))) {
            throw WanderException.conflict(PlanningErrorCodes.REQUEST_EXISTS, PlanningMessages.REQUEST_EXISTS);
        }
        if (requests.stream().filter(r -> r.isPending() && r.requesterMemberId().equals(requester.id())).count() >= PlanningConstants.MAX_PENDING_REQUESTS) {
            throw WanderException.conflict(PlanningErrorCodes.TOO_MANY_REQUESTS, PlanningMessages.TOO_MANY_REQUESTS);
        }
        DeletionRequest request = new DeletionRequest(UUID.randomUUID(), item.id(), requester.id(), reason, RequestStatus.PENDING, now, null);
        requests.add(request);
        return request;
    }

    /** The requester cancels while it is pending; another person's request => 404, already decided => ALREADY_DECIDED. */
    public void cancelDeletion(UUID identityId, UUID requestId) {
        TripMember requester = requireMember(identityId);
        DeletionRequest request = requests.stream().filter(r -> r.id().equals(requestId) && r.requesterMemberId().equals(requester.id()))
                .findFirst().orElseThrow(WanderException::notFound);
        if (!request.isPending()) throw WanderException.conflict(PlanningErrorCodes.ALREADY_DECIDED, PlanningMessages.ALREADY_DECIDED);
        requests.remove(request);
    }

    /** The Organizer approves or rejects a pending request; returns the decided request. Soft-deleting the item on approval is done by the command handler in the same transaction. */
    public DeletionRequest decideDeletion(UUID identityId, UUID requestId, boolean approve, Instant now) {
        requireOrganizer(identityId);
        DeletionRequest request = requests.stream().filter(r -> r.id().equals(requestId)).findFirst().orElseThrow(WanderException::notFound);
        if (!request.isPending()) throw WanderException.conflict(PlanningErrorCodes.ALREADY_DECIDED, PlanningMessages.ALREADY_DECIDED);
        DeletionRequest decided = request.decided(approve ? RequestStatus.APPROVED : RequestStatus.REJECTED, now);
        requests.replaceAll(r -> r.id().equals(requestId) ? decided : r);
        trimDecided();
        return decided;
    }

    /** Keeps at most MAX_DECIDED_REQUESTS decided requests (the oldest are cleaned up) so the data does not grow forever. */
    private void trimDecided() {
        List<DeletionRequest> decided = requests.stream().filter(r -> !r.isPending()).sorted(java.util.Comparator.comparing(DeletionRequest::decidedAt)).toList();
        int excess = decided.size() - PlanningConstants.MAX_DECIDED_REQUESTS;
        for (int i = 0; i < excess; i++) requests.remove(decided.get(i));
    }

    /** An item has just been soft-deleted (not through approval): the pending deletion request for it becomes 'approved' because what the requester wanted has happened. */
    public void settlePendingOf(UUID itemId, Instant now) {
        requests.replaceAll(r -> r.isPending() && r.itemId().equals(itemId) ? r.decided(RequestStatus.APPROVED, now) : r);
    }

    /** An item is permanently deleted: every request for it loses its meaning. */
    public void forgetItem(UUID itemId) {
        requests.removeIf(r -> r.itemId().equals(itemId));
    }

    /** A member leaves or is removed: their pending requests are dropped (decided ones are kept as history). */
    public void dropPendingOf(UUID memberId) {
        requests.removeIf(r -> r.isPending() && r.requesterMemberId().equals(memberId));
    }
}
