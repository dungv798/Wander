package com.wander.planning.infrastructure.persistence.mapper;

import com.wander.planning.domain.constant.CoverConstants;
import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.Cover;
import com.wander.planning.domain.model.DateRange;
import com.wander.planning.domain.model.DeletionRequest;
import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.ItemCost;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.model.TripInvite;
import com.wander.planning.domain.model.TripMember;
import com.wander.planning.domain.model.TripOptions;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.planning.domain.vocabulary.RequestStatus;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.planning.domain.vocabulary.TripKind;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.planning.infrastructure.persistence.adapter.JpaTripRepository;
import com.wander.planning.infrastructure.persistence.entity.DeletionRequestEntity;
import com.wander.planning.infrastructure.persistence.entity.ItemEntity;
import com.wander.planning.infrastructure.persistence.entity.TripEntity;
import com.wander.planning.infrastructure.persistence.entity.TripInviteEntity;
import com.wander.planning.infrastructure.persistence.entity.TripMemberEntity;
import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * Maps JPA entity <-> domain (ADR-008), generated at compile time. {@code unmappedTargetPolicy = ERROR} checks the target in each
 * direction: adding a column to the entity and forgetting to map it in the write direction, or adding a constructor parameter to the domain and forgetting to map it in the
 * read direction, turns the build red. Limitation: the write direction uses {@code expression}, so a domain field that has only an accessor and no matching column
 * is not caught (like hand-written code).
 * <p>
 * The entity -> domain direction builds the domain through the constructor (invariants are checked by the domain). The domain -> entity direction updates the
 * entity tracked by Hibernate (managed) in place; syncing the item list (add/permanently delete) and the completion set
 * is in {@link JpaTripRepository} because it needs matching by id.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR, imports = {DateRange.class, ItemCost.class, TripOptions.class})
public interface TripMapper {

    /** Column data into a valid cover; null keeps the default for an old trip. */
    default Cover decodeCover(String stored) {
        if (stored == null) return null;
        String[] parts = stored.split(CoverConstants.SEPARATOR, 2);
        return new Cover(parts[0], parts.length == 2 ? parts[1] : null);
    }

    /** A cover into one kind:id column; a slug contains no separator. */
    default String encodeCover(Cover cover) {
        return cover == null ? null : cover.kind() + CoverConstants.SEPARATOR + cover.ref();
    }

    // ---- entity → domain ----

    /** The domain trip from an entity (built through the constructor so every invariant is checked). */
    @Mapping(target = "ownerId", source = "ownerIdentityId")
    @Mapping(target = "members", expression = "java(members(e.getMembers()))")
    @Mapping(target = "invites", expression = "java(invites(e.getInvites()))")
    @Mapping(target = "requests", expression = "java(requests(e.getDeletionRequests()))")
    @Mapping(target = "range", expression = "java(new DateRange(e.getStartDate(), e.getEndDate()))")
    @Mapping(target = "options", expression = "java(new TripOptions(e.getBudgetK(), styles(e.getStyles()), pace(e.getPace()), e.isDatesTentative(), kind(e.getKind()), interests(e.getInterests())))")
    Trip toDomain(TripEntity e);

    /** A string of comma-separated codes -> a list (empty = none). An unknown code in the database is a data error. */
    default List<TripStyle> styles(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(PlanningConstants.STYLE_CODE_SEPARATOR))
                .map(code -> TripStyle.fromCode(code.trim())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_STYLE.formatted(code))))
                .toList();
    }

    /** The trip pace from the stored code; null stays null, an unknown code is a data error. */
    default TripPace pace(String code) {
        if (code == null) return null;
        return TripPace.fromCode(code).orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_PACE.formatted(code)));
    }

    /** 'Who is going' from the stored code; null stays null, an unknown code is a data error. */
    default TripKind kind(String code) {
        if (code == null) return null;
        return TripKind.fromCode(code).orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_KIND.formatted(code)));
    }

    /** A string of comma-separated interest codes -> a list (empty = none); an unknown code is a data error. */
    default List<TripInterest> interests(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(PlanningConstants.STYLE_CODE_SEPARATOR))
                .map(code -> TripInterest.fromCode(code.trim())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_INTEREST.formatted(code))))
                .toList();
    }

    /** A list of interests -> a string of comma-separated codes to store in one column. */
    default String interestCodes(List<TripInterest> interests) {
        return interests.stream().map(TripInterest::code).collect(Collectors.joining(PlanningConstants.STYLE_CODE_SEPARATOR));
    }

    /** A list of trip kinds -> a string of comma-separated codes to store in one column. */
    default String styleCodes(List<TripStyle> styles) {
        return styles.stream().map(TripStyle::code).collect(Collectors.joining(PlanningConstants.STYLE_CODE_SEPARATOR));
    }

    /** The domain item from an entity (built through the constructor; the cost and completion are built from the columns). */
    @Mapping(target = "day", source = "dayDate")
    @Mapping(target = "booking", source = "bookingStatus")
    @Mapping(target = "cost", expression = "java(new ItemCost(e.getCostK(), e.isIncluded(), e.getReferenceK()))")
    @Mapping(target = "completions", expression = "java(completions(e.getCompletions()))")
    Item toDomain(ItemEntity e);

    /** The item type from the stored code; an unknown code is a data error. */
    default ItemType itemType(String code) {
        return ItemType.fromCode(code).orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_ITEM_TYPE.formatted(code)));
    }

    /** The booking status from the stored code; null stays null, an unknown code is a data error. */
    default BookingStatus bookingStatus(String code) {
        if (code == null) return null;
        return BookingStatus.fromCode(code)
                .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_BOOKING_STATUS.formatted(code)));
    }

    /** The stored completion set -> a map person -> completion time (keeping the iteration order). */
    default Map<UUID, Instant> completions(Set<ItemEntity.Completion> stored) {
        Map<UUID, Instant> completions = new LinkedHashMap<>();
        for (ItemEntity.Completion completion : stored) completions.put(completion.getPersonId(), completion.getDoneAt());
        return completions;
    }

    // ---- domain -> entity (update in place) ----

    /** Writes the domain trip state into the tracked entity (does not touch the owner, the creation date, the item list). */
    @Mapping(target = "cover", expression = "java(encodeCover(trip.cover()))")
    @Mapping(target = "name", expression = "java(trip.name())")
    @Mapping(target = "destination", expression = "java(trip.destination())")
    @Mapping(target = "startDate", expression = "java(trip.range().start())")
    @Mapping(target = "endDate", expression = "java(trip.range().end())")
    @Mapping(target = "budgetK", expression = "java(trip.options().budgetK())")
    @Mapping(target = "styles", expression = "java(styleCodes(trip.options().styles()))")
    @Mapping(target = "pace", expression = "java(trip.options().pace() == null ? null : trip.options().pace().code())")
    @Mapping(target = "kind", expression = "java(trip.options().kind() == null ? null : trip.options().kind().code())")
    @Mapping(target = "interests", expression = "java(interestCodes(trip.options().interests()))")
    @Mapping(target = "datesTentative", expression = "java(trip.options().datesTentative())")
    @Mapping(target = "updatedAt", expression = "java(trip.updatedAt())")
    @Mapping(target = "deletedAt", expression = "java(trip.deletedAt())")
    @Mapping(target = "ownerIdentityId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "members", ignore = true)
    @Mapping(target = "invites", ignore = true)
    @Mapping(target = "deletionRequests", ignore = true)
    void update(Trip trip, @MappingTarget TripEntity e);

    /** The domain deletion requests from stored rows, oldest first. */
    default List<DeletionRequest> requests(List<DeletionRequestEntity> stored) {
        return stored.stream()
                .map(r -> new DeletionRequest(r.getId(), r.getItemId(), r.getRequesterMemberId(), r.getReason(), RequestStatus.fromCode(r.getStatus())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_REQUEST_STATUS.formatted(r.getStatus()))), r.getRequestedAt(), r.getDecidedAt()))
                .sorted(Comparator.comparing(DeletionRequest::requestedAt).thenComparing(DeletionRequest::id))
                .toList();
    }

    /** The domain members from stored rows (in the order they joined the trip). */
    default List<TripMember> members(List<TripMemberEntity> stored) {
        return stored.stream()
                .map(m -> new TripMember(m.getId(), m.getIdentityId(), MemberRole.fromCode(m.getRole())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_MEMBER_ROLE.formatted(m.getRole()))), m.getDisplayName(), m.getJoinedAt()))
                .sorted(Comparator.comparing(TripMember::joinedAt).thenComparing(TripMember::id))
                .toList();
    }

    /** The domain invite links from stored rows. */
    default List<TripInvite> invites(List<TripInviteEntity> stored) {
        return stored.stream().map(i -> new TripInvite(i.getId(), i.getCodeHash(), i.getCreatedAt(), i.getExpiresAt(), i.getRevokedAt())).toList();
    }

    /** Writes the domain item state into the tracked entity (does not touch the creation date and the completion set). */
    @Mapping(target = "dayDate", expression = "java(item.day())")
    @Mapping(target = "position", expression = "java(item.position())")
    @Mapping(target = "type", expression = "java(item.type().code())")
    @Mapping(target = "title", expression = "java(item.title())")
    @Mapping(target = "timeOfDay", expression = "java(item.timeOfDay())")
    @Mapping(target = "durationMin", expression = "java(item.durationMin())")
    @Mapping(target = "note", expression = "java(item.note())")
    @Mapping(target = "costK", expression = "java(item.cost().costK())")
    @Mapping(target = "included", expression = "java(item.cost().included())")
    @Mapping(target = "referenceK", expression = "java(item.cost().referenceK())")
    @Mapping(target = "bookingStatus", expression = "java(item.booking() == null ? null : item.booking().code())")
    @Mapping(target = "placeId", expression = "java(item.placeId())")
    @Mapping(target = "deletedAt", expression = "java(item.deletedAt())")
    @Mapping(target = "updatedAt", expression = "java(item.updatedAt())")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "completions", ignore = true)
    @Mapping(target = "addedByMemberId", expression = "java(item.addedByMemberId())")
    void update(Item item, @MappingTarget ItemEntity ie);
}
