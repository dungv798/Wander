package com.wander.planning.infrastructure.persistence.mapper;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.DateRange;
import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.ItemCost;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.model.TripOptions;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.planning.infrastructure.persistence.adapter.JpaTripRepository;
import com.wander.planning.infrastructure.persistence.entity.ItemEntity;
import com.wander.planning.infrastructure.persistence.entity.TripEntity;
import java.time.Instant;
import java.util.Arrays;
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

    // ---- entity → domain ----

    /** Chuyến domain từ entity (dựng qua constructor nên mọi bất biến được kiểm tra). */
    @Mapping(target = "ownerId", source = "ownerIdentityId")
    @Mapping(target = "range", expression = "java(new DateRange(e.getStartDate(), e.getEndDate()))")
    @Mapping(target = "options", expression = "java(new TripOptions(e.getBudgetK(), styles(e.getStyles()), pace(e.getPace())))")
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
    @Mapping(target = "name", expression = "java(trip.name())")
    @Mapping(target = "destination", expression = "java(trip.destination())")
    @Mapping(target = "startDate", expression = "java(trip.range().start())")
    @Mapping(target = "endDate", expression = "java(trip.range().end())")
    @Mapping(target = "budgetK", expression = "java(trip.options().budgetK())")
    @Mapping(target = "styles", expression = "java(styleCodes(trip.options().styles()))")
    @Mapping(target = "pace", expression = "java(trip.options().pace() == null ? null : trip.options().pace().code())")
    @Mapping(target = "updatedAt", expression = "java(trip.updatedAt())")
    @Mapping(target = "ownerIdentityId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "items", ignore = true)
    void update(Trip trip, @MappingTarget TripEntity e);

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
    void update(Item item, @MappingTarget ItemEntity ie);
}
