package com.wander.planning.application.query;

import com.wander.planning.application.access.TripAccess;
import com.wander.planning.application.view.PlanningViews.ChecklistItemView;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The read side of the checklist: every member can view it, progress is by MEMBER id (the identity id is not exposed). */
@Service
@Transactional(readOnly = true)
public class ChecklistQueries {

    private final TripReadModel read;
    private final TripAccess access;

    /** Takes the read port and the access port. */
    public ChecklistQueries(TripReadModel read, TripAccess access) {
        this.read = read;
        this.access = access;
    }

    /** The trip's checklist by group then position; an outsider => 404. */
    public List<ChecklistItemView> list(UUID identityId, UUID tripId) {
        access.requireMember(tripId, identityId);
        Map<UUID, Integer> order = new HashMap<>();
        Map<UUID, String> memberOf = new HashMap<>();
        for (MemberRow member : read.members(tripId)) {
            order.put(member.identityId(), order.size());
            memberOf.put(member.identityId(), member.id().toString());
        }
        return read.checklist(tripId).stream().map(row -> view(row, identityId, order, memberOf)).toList();
    }

    /** The display form of one item. */
    private static ChecklistItemView view(ChecklistRow row, UUID identityId, Map<UUID, Integer> order, Map<UUID, String> memberOf) {
        List<String> doneBy = row.doneBy().stream().filter(order::containsKey).sorted(Comparator.comparing(order::get)).map(memberOf::get).toList();
        return new ChecklistItemView(row.id().toString(), row.group(), row.title(), row.position(), row.doneBy().contains(identityId), doneBy);
    }

    /** One item (to return after a write). */
    public ChecklistItemView item(UUID identityId, UUID tripId, UUID itemId) {
        return list(identityId, tripId).stream().filter(v -> v.id().equals(itemId.toString())).findFirst().orElseThrow(com.wander.shared.kernel.error.WanderException::notFound);
    }
}
