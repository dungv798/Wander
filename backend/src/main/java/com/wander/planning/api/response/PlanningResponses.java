package com.wander.planning.api.response;

import com.wander.planning.application.view.PlanningViews;
import java.util.List;

/** Response bodies of the planning API. Each wraps read models under the key the web client reads. */
public final class PlanningResponses {

    private PlanningResponses() {
    }

    /** The caller's trips. */
    public record TripsResponse(List<PlanningViews.TripView> trips) {
    }

    /** Soft-deleted trips ("recently deleted"), most recently deleted first. */
    public record DeletedTripsResponse(List<PlanningViews.DeletedTrip> trips) {
    }

    /** One trip. */
    public record TripResponse(PlanningViews.TripView trip) {
    }

    /** One trip item. */
    public record ItemResponse(PlanningViews.ItemView item) {
    }

    /** A list of trip items (a day in its new order, or the trash). */
    public record ItemsResponse(List<PlanningViews.ItemView> items) {
    }

    /** The interests of an identity as code and label pairs. */
    public record InterestsResponse(List<PlanningViews.Choice> interests) {
    }

    /** A freshly created invite; the code is shown only in this response. */
    public record CreatedInviteResponse(PlanningViews.CreatedInviteView invite) {
    }

    /** The current invite link of a trip, or {@code null} when there is none (the code is never repeated). */
    public record InviteResponse(PlanningViews.InviteView invite) {
    }

    /** What an invite link shows before joining: the trip name and member count. */
    public record InvitePreviewResponse(PlanningViews.InvitePreviewView invite) {
    }

    /** The members of a trip. */
    public record MembersResponse(List<PlanningViews.MemberView> members) {
    }

    /** One member. */
    public record MemberResponse(PlanningViews.MemberView member) {
    }

    /** The result of joining a trip: its id and the new member. */
    public record JoinedResponse(String tripId, PlanningViews.MemberView member) {
    }

    /** Deletion requests visible to the caller. */
    public record RequestsResponse(List<PlanningViews.DeletionRequestView> requests) {
    }

    /** One deletion request. */
    public record RequestResponse(PlanningViews.DeletionRequestView request) {
    }

    /** The checklist items of a trip. */
    public record ChecklistItemsResponse(List<PlanningViews.ChecklistItemView> items) {
    }

    /** One checklist item. */
    public record ChecklistItemResponse(PlanningViews.ChecklistItemView item) {
    }
}
