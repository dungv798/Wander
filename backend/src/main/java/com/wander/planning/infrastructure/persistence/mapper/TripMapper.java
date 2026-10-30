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
 * Ánh xạ entity JPA ↔ domain (ADR-008), sinh lúc biên dịch. {@code unmappedTargetPolicy = ERROR} kiểm tra đích của mỗi
 * chiều: thêm cột vào entity mà quên ánh xạ ở chiều ghi, hoặc thêm tham số constructor vào domain mà quên ánh xạ ở chiều
 * đọc, thì biên dịch đỏ. Giới hạn: chiều ghi dùng {@code expression} nên một trường domain chỉ có accessor mà không có cột
 * tương ứng thì không bị bắt (giống mã viết tay).
 * <p>
 * Chiều entity → domain dựng domain qua constructor (bất biến do domain kiểm tra). Chiều domain → entity cập nhật
 * entity đang được Hibernate theo dõi (managed) tại chỗ; việc đồng bộ danh sách mục (thêm/xóa vĩnh viễn) và tập hoàn thành
 * nằm ở {@link JpaTripRepository} vì cần đối chiếu theo id.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR, imports = {DateRange.class, ItemCost.class, TripOptions.class})
public interface TripMapper {

    /** Dữ liệu cột thành bìa hợp lệ; null giữ mặc định cho chuyến cũ. */
    default Cover decodeCover(String stored) {
        if (stored == null) return null;
        String[] parts = stored.split(CoverConstants.SEPARATOR, 2);
        return new Cover(parts[0], parts.length == 2 ? parts[1] : null);
    }

    /** Bìa thành một cột loại:mã; slug không chứa dấu phân cách. */
    default String encodeCover(Cover cover) {
        return cover == null ? null : cover.kind() + CoverConstants.SEPARATOR + cover.ref();
    }

    // ---- entity → domain ----

    /** Chuyến domain từ entity (dựng qua constructor nên mọi bất biến được kiểm tra). */
    @Mapping(target = "ownerId", source = "ownerIdentityId")
    @Mapping(target = "members", expression = "java(members(e.getMembers()))")
    @Mapping(target = "invites", expression = "java(invites(e.getInvites()))")
    @Mapping(target = "requests", expression = "java(requests(e.getDeletionRequests()))")
    @Mapping(target = "range", expression = "java(new DateRange(e.getStartDate(), e.getEndDate()))")
    @Mapping(target = "options", expression = "java(new TripOptions(e.getBudgetK(), styles(e.getStyles()), pace(e.getPace()), e.isDatesTentative(), kind(e.getKind()), interests(e.getInterests())))")
    Trip toDomain(TripEntity e);

    /** Chuỗi mã cách nhau bằng dấu phẩy → danh sách (rỗng = không có). Mã lạ trong cơ sở dữ liệu là lỗi dữ liệu. */
    default List<TripStyle> styles(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(PlanningConstants.STYLE_CODE_SEPARATOR))
                .map(code -> TripStyle.fromCode(code.trim())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_STYLE.formatted(code))))
                .toList();
    }

    /** Nhịp chuyến từ mã đã lưu; null giữ nguyên null, mã lạ là lỗi dữ liệu. */
    default TripPace pace(String code) {
        if (code == null) return null;
        return TripPace.fromCode(code).orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_PACE.formatted(code)));
    }

    /** "Ai đi" từ mã đã lưu; null giữ nguyên null, mã lạ là lỗi dữ liệu. */
    default TripKind kind(String code) {
        if (code == null) return null;
        return TripKind.fromCode(code).orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_KIND.formatted(code)));
    }

    /** Chuỗi mã sở thích cách nhau bằng dấu phẩy → danh sách (rỗng = không có); mã lạ là lỗi dữ liệu. */
    default List<TripInterest> interests(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(PlanningConstants.STYLE_CODE_SEPARATOR))
                .map(code -> TripInterest.fromCode(code.trim())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_TRIP_INTEREST.formatted(code))))
                .toList();
    }

    /** Danh sách sở thích → chuỗi mã cách nhau bằng dấu phẩy để lưu một cột. */
    default String interestCodes(List<TripInterest> interests) {
        return interests.stream().map(TripInterest::code).collect(Collectors.joining(PlanningConstants.STYLE_CODE_SEPARATOR));
    }

    /** Danh sách kiểu chuyến → chuỗi mã cách nhau bằng dấu phẩy để lưu một cột. */
    default String styleCodes(List<TripStyle> styles) {
        return styles.stream().map(TripStyle::code).collect(Collectors.joining(PlanningConstants.STYLE_CODE_SEPARATOR));
    }

    /** Mục domain từ entity (dựng qua constructor; chi phí và hoàn thành dựng từ các cột). */
    @Mapping(target = "day", source = "dayDate")
    @Mapping(target = "booking", source = "bookingStatus")
    @Mapping(target = "cost", expression = "java(new ItemCost(e.getCostK(), e.isIncluded(), e.getReferenceK()))")
    @Mapping(target = "completions", expression = "java(completions(e.getCompletions()))")
    Item toDomain(ItemEntity e);

    /** Loại mục từ mã đã lưu; mã lạ là lỗi dữ liệu. */
    default ItemType itemType(String code) {
        return ItemType.fromCode(code).orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_ITEM_TYPE.formatted(code)));
    }

    /** Trạng thái đặt chỗ từ mã đã lưu; null giữ nguyên null, mã lạ là lỗi dữ liệu. */
    default BookingStatus bookingStatus(String code) {
        if (code == null) return null;
        return BookingStatus.fromCode(code)
                .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_BOOKING_STATUS.formatted(code)));
    }

    /** Tập hoàn thành đã lưu → bản đồ người → thời điểm hoàn thành (giữ thứ tự duyệt). */
    default Map<UUID, Instant> completions(Set<ItemEntity.Completion> stored) {
        Map<UUID, Instant> completions = new LinkedHashMap<>();
        for (ItemEntity.Completion completion : stored) completions.put(completion.getPersonId(), completion.getDoneAt());
        return completions;
    }

    // ---- domain → entity (cập nhật tại chỗ) ----

    /** Ghi trạng thái chuyến domain vào entity đang được theo dõi (không đụng chủ, ngày tạo, danh sách mục). */
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

    /** Đề nghị xóa domain từ các dòng đã lưu, cũ trước. */
    default List<DeletionRequest> requests(List<DeletionRequestEntity> stored) {
        return stored.stream()
                .map(r -> new DeletionRequest(r.getId(), r.getItemId(), r.getRequesterMemberId(), r.getReason(), RequestStatus.fromCode(r.getStatus())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_REQUEST_STATUS.formatted(r.getStatus()))), r.getRequestedAt(), r.getDecidedAt()))
                .sorted(Comparator.comparing(DeletionRequest::requestedAt).thenComparing(DeletionRequest::id))
                .toList();
    }

    /** Thành viên domain từ các dòng đã lưu (thứ tự vào chuyến). */
    default List<TripMember> members(List<TripMemberEntity> stored) {
        return stored.stream()
                .map(m -> new TripMember(m.getId(), m.getIdentityId(), MemberRole.fromCode(m.getRole())
                        .orElseThrow(() -> new IllegalStateException(PlanningMessages.UNKNOWN_MEMBER_ROLE.formatted(m.getRole()))), m.getDisplayName(), m.getJoinedAt()))
                .sorted(Comparator.comparing(TripMember::joinedAt).thenComparing(TripMember::id))
                .toList();
    }

    /** Liên kết mời domain từ các dòng đã lưu. */
    default List<TripInvite> invites(List<TripInviteEntity> stored) {
        return stored.stream().map(i -> new TripInvite(i.getId(), i.getCodeHash(), i.getCreatedAt(), i.getExpiresAt(), i.getRevokedAt())).toList();
    }

    /** Ghi trạng thái mục domain vào entity đang được theo dõi (không đụng ngày tạo và tập hoàn thành). */
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
