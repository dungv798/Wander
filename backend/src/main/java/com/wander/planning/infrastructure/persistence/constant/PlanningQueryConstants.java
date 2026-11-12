package com.wander.planning.infrastructure.persistence.constant;

/** JPQL queries and parameter names of the Planning read/write side (FEATURE tier). The parameter name {@code :x} matches {@code setParameter("x")}. */
public final class PlanningQueryConstants {

    /** Parameter: the trip id. */
    public static final String PARAM_TRIP_ID = "id";

    /** Parameter: the identity id of the trip owner. */
    public static final String PARAM_OWNER = "owner";

    /** Parameter: the trip id when filtering items. */
    public static final String PARAM_TRIP = "trip";

    /** Parameter: the item id. */
    public static final String PARAM_ITEM_ID = "id";

    /** Parameter: the hash of the invite-link code. */
    public static final String PARAM_CODE_HASH = "codeHash";

    /** Parameter: the id of the person who finished. */
    public static final String PARAM_PERSON = "person";

    /** Selects the trip columns into the flat row {@code TripRow} (constructor expression). */
    public static final String TRIP_ROW = "select new com.wander.planning.application.query.TripRow("
            + "t.id, t.ownerIdentityId, t.name, t.destination, t.startDate, t.endDate, t.budgetK, t.styles, t.pace, t.datesTentative, t.kind, t.interests, "
            + "t.createdAt, t.updatedAt, t.deletedAt, "
            + "(select m.role from TripMemberEntity m where m.trip = t and m.identityId = :" + PARAM_OWNER + "), "
            + "(select count(m2) from TripMemberEntity m2 where m2.trip = t), "
            + "(select m3.id from TripMemberEntity m3 where m3.trip = t and m3.identityId = :" + PARAM_OWNER + "), t.cover) "
            + "from TripEntity t ";

    /** Selects the item columns into the flat row {@code ItemRow} (constructor expression). */
    public static final String ITEM_ROW = "select new com.wander.planning.application.query.ItemRow("
            + "i.id, i.trip.id, i.dayDate, i.position, i.type, i.title, i.timeOfDay, i.durationMin, i.note, "
            + "i.costK, i.included, i.referenceK, i.bookingStatus, i.placeId, i.deletedAt, i.createdAt, i.addedByMemberId) from ItemEntity i ";

    /** Condition: this person is a member of the trip (any role). */
    public static final String IS_MEMBER = "exists (select 1 from TripMemberEntity mm where mm.trip = t and mm.identityId = :" + PARAM_OWNER + ")";

    /** Condition: a VISIBLE trip by id of which the caller is a member (an outsider and a soft-deleted trip count as absent). */
    public static final String WHERE_TRIP_OF_OWNER = "where t.id = :" + PARAM_TRIP_ID + " and " + IS_MEMBER + " and t.deletedAt is null";

    /** Condition: a SOFT-DELETED trip by id of exactly the owner (only the Organizer sees a deleted trip). */
    public static final String WHERE_DELETED_TRIP_OF_OWNER = "where t.id = :" + PARAM_TRIP_ID + " and t.ownerIdentityId = :" + PARAM_OWNER + " and t.deletedAt is not null";

    /** Condition and order: every trip of the owner, newest first. */
    public static final String WHERE_OWNER_NEWEST_FIRST =
            "where " + IS_MEMBER + " and t.deletedAt is null order by t.startDate desc, t.createdAt desc";

    /** Condition and order: the owner's soft-deleted trips, most recently deleted first. */
    public static final String WHERE_OWNER_DELETED_RECENT_FIRST =
            "where t.ownerIdentityId = :" + PARAM_OWNER + " and t.deletedAt is not null order by t.deletedAt desc, t.id";

    /** Condition and order: every item of the trip, by day then manual position. */
    public static final String WHERE_TRIP_ITEMS_IN_ORDER =
            "where i.trip.id = :" + PARAM_TRIP + " order by i.dayDate, i.position, i.createdAt, i.id";

    /** Condition: one item of the trip by id. */
    public static final String WHERE_TRIP_ITEM = "where i.trip.id = :" + PARAM_TRIP + " and i.id = :" + PARAM_ITEM_ID;

    /** Condition and order: the trip's soft-deleted items, most recently deleted first. */
    public static final String WHERE_TRIP_TRASH =
            "where i.trip.id = :" + PARAM_TRIP + " and i.deletedAt is not null order by i.deletedAt desc, i.id";

    /** Every (item, person who finished) pair of the trip. */
    public static final String COMPLETIONS_OF_TRIP = "select i.id, c.personId from ItemEntity i join i.completions c where i.trip.id = :" + PARAM_TRIP;

    /** The ids of the items a person has completed in the trip. */
    public static final String DONE_ITEM_IDS = "select i.id from ItemEntity i join i.completions c "
            + "where i.trip.id = :" + PARAM_TRIP + " and c.personId = :" + PARAM_PERSON;

    /** The owner's preferences by identity (BE-10). */
    public static final String OWNER_INTEREST_PREFERENCES =
            "select p.interests from OwnerPreferencesEntity p where p.ownerIdentityId = :" + PARAM_OWNER;

    /** Writes or replaces the preferences by identity with one atomic statement (plain SQL because it needs ON CONFLICT). */
    public static final String UPSERT_OWNER_INTERESTS = "INSERT INTO owner_preferences (owner_identity_id, interests, updated_at) "
            + "VALUES (:owner, :interests, :now) ON CONFLICT (owner_identity_id) DO UPDATE "
            + "SET interests = EXCLUDED.interests, updated_at = EXCLUDED.updated_at";

    /** The id and name of every trip of the owner (to choose a name that does not clash). */
    public static final String TRIP_NAMES = "select t.id, t.name from TripEntity t where t.ownerIdentityId = :" + PARAM_OWNER;

    /** Loads the owner's trip with all its items in one query (avoiding N+1). */
    public static final String TRIP_WITH_ITEMS = "select distinct t from TripEntity t left join fetch t.items "
            + "where t.id = :" + PARAM_TRIP_ID + " and t.deletedAt is null and exists (select 1 from TripMemberEntity mm where mm.trip = t and mm.identityId = :" + PARAM_OWNER + ")";

    /** Loads the owner's SOFT-DELETED trip with its items (to restore it). */
    public static final String TRIP_WITH_ITEMS_DELETED = "select distinct t from TripEntity t left join fetch t.items "
            + "where t.id = :" + PARAM_TRIP_ID + " and t.ownerIdentityId = :" + PARAM_OWNER + " and t.deletedAt is not null";

    /** A visible trip that has an invite link with this code hash (including an expired/revoked link: the domain decides). */
    public static final String TRIP_BY_INVITE_HASH = "select distinct t from TripEntity t left join fetch t.items where t.deletedAt is null "
            + "and exists (select 1 from TripInviteEntity i where i.trip = t and i.codeHash = :" + PARAM_CODE_HASH + ")";

    /** Every member of the trip, in the order they joined. */
    public static final String MEMBERS_OF_TRIP = "select new com.wander.planning.application.query.MemberRow(m.id, m.identityId, m.role, m.displayName, m.joinedAt) "
            + "from TripMemberEntity m where m.trip.id = :" + PARAM_TRIP + " order by m.joinedAt, m.id";

    /** Every deletion request of the trip, oldest first. */
    public static final String REQUESTS_OF_TRIP = "select new com.wander.planning.application.query.RequestRow(r.id, r.itemId, r.requesterMemberId, r.reason, r.status, r.requestedAt, r.decidedAt) "
            + "from DeletionRequestEntity r where r.trip.id = :" + PARAM_TRIP + " order by r.requestedAt, r.id";

    /** The invite link of the trip that is not revoked (at most one). */
    public static final String UNREVOKED_INVITE_OF_TRIP = "select new com.wander.planning.application.query.InviteRow(i.id, i.createdAt, i.expiresAt, i.revokedAt) "
            + "from TripInviteEntity i where i.trip.id = :" + PARAM_TRIP + " and i.revokedAt is null";

    /** Parameter: the current time. */
    public static final String PARAM_NOW = "now";

    /** Preview of an invite link that is still usable: the trip name and the member count. */
    public static final String INVITE_PREVIEW = "select new com.wander.planning.application.query.InvitePreviewRow(t.name, (select count(m) from TripMemberEntity m where m.trip = t)) "
            + "from TripEntity t where t.deletedAt is null and exists (select 1 from TripInviteEntity i where i.trip = t and i.codeHash = :" + PARAM_CODE_HASH
            + " and i.revokedAt is null and i.expiresAt > :" + PARAM_NOW + ")";

    private PlanningQueryConstants() {
    }

    /** The trip's checklist items by group then position. */
    public static final String CHECKLIST_OF_TRIP = "select c from ChecklistItemEntity c where c.tripId = :trip order by c.groupTitle, c.position, c.id";

    /** One checklist item of exactly this trip. */
    public static final String CHECKLIST_ITEM_OF_TRIP = "select c from ChecklistItemEntity c where c.tripId = :trip and c.id = :item";

    /** The largest position of the checklist. */
    public static final String CHECKLIST_MAX_POSITION = "select max(c.position) from ChecklistItemEntity c where c.tripId = :trip";

    /** The role of an identity in a visible trip (empty = not a member or the trip is deleted). */
    public static final String ROLE_IN_TRIP = "select m.role from TripMemberEntity m where m.trip.id = :" + PARAM_TRIP
            + " and m.identityId = :" + PARAM_OWNER + " and m.trip.deletedAt is null";

    /** The member id of an identity in a visible trip. */
    public static final String MEMBER_ID_IN_TRIP = "select m.id from TripMemberEntity m where m.trip.id = :" + PARAM_TRIP
            + " and m.identityId = :" + PARAM_OWNER + " and m.trip.deletedAt is null";
}
