package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.ImmutableLists;
import com.wander.shared.kernel.util.Texts;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/** Điểm đến (ví dụ Hà Giang) cùng bộ địa điểm và cẩm nang biên tập. Dữ liệu nhỏ, đọc nguyên khối. */
public record Destination(
        String id,
        String name,
        String region,
        String tagline,
        String coverPlaceId,
        List<ReferencePoint> references,
        List<GuideSection> guide,
        List<Place> places,
        List<Moment> moments,
        Photo coverPhoto) {

    /** Điểm đến chưa có thư viện khoảnh khắc và dùng ảnh bìa của địa điểm bìa (tương thích dữ liệu cũ). */
    public Destination(String id, String name, String region, String tagline, String coverPlaceId, List<ReferencePoint> references,
                       List<GuideSection> guide, List<Place> places) {
        this(id, name, region, tagline, coverPlaceId, references, guide, places, List.of(), null);
    }

    /** Điểm đến có khoảnh khắc, ảnh bìa lấy từ địa điểm bìa. */
    public Destination(String id, String name, String region, String tagline, String coverPlaceId, List<ReferencePoint> references,
                       List<GuideSection> guide, List<Place> places, List<Moment> moments) {
        this(id, name, region, tagline, coverPlaceId, references, guide, places, moments, null);
    }

    public Destination {
        CatalogValidation.require(hasIdentity(id, name, region, tagline), CatalogMessages.DESTINATION_FIELDS_MISSING);
        references = ImmutableLists.copyOrEmpty(references);
        guide = ImmutableLists.copyOrEmpty(guide);
        places = ImmutableLists.copyOrEmpty(places);
        moments = ImmutableLists.copyOrEmpty(moments);
        validateMoments(id, moments);
        CatalogValidation.require(!references.isEmpty(), CatalogMessages.DESTINATION_NEEDS_REFERENCE, id);
        CatalogValidation.require(!places.isEmpty(), CatalogMessages.DESTINATION_NEEDS_PLACE, id);
        Set<String> placeIds = collectPlaceIds(id, places);
        CatalogValidation.require(placeIds.contains(coverPlaceId), CatalogMessages.COVER_PLACE_MISSING, coverPlaceId);
        CatalogValidation.require(places.stream().anyMatch(place -> place.id().equals(coverPlaceId) && !place.photos().isEmpty()),
                CatalogMessages.COVER_PLACE_NEEDS_PHOTO, coverPlaceId);
        validateGuide(guide, placeIds);
    }

    /** Địa điểm theo mã trong điểm đến này; không có thì trả rỗng. */
    public Optional<Place> place(String placeId) {
        return places.stream().filter(place -> place.id().equals(placeId)).findFirst();
    }

    /** Địa điểm dùng làm ảnh bìa của điểm đến. */
    public Place coverPlace() {
        return place(coverPlaceId).orElseThrow();
    }

    /** Cả bốn trường nhận diện (id, tên, vùng, mô tả ngắn) đều có nội dung. */
    private static boolean hasIdentity(String id, String name, String region, String tagline) {
        return Stream.of(id, name, region, tagline).noneMatch(Texts::isNullOrBlank);
    }

    /** Tập mã địa điểm; mỗi địa điểm phải thuộc điểm đến {@code destinationId} và mã không được trùng. */
    private static Set<String> collectPlaceIds(String destinationId, List<Place> places) {
        Set<String> ids = new HashSet<>();
        for (Place place : places) {
            CatalogValidation.require(place.destinationId().equals(destinationId), CatalogMessages.PLACE_OF_OTHER_DESTINATION, place.id());
            CatalogValidation.require(ids.add(place.id()), CatalogMessages.PLACE_ID_DUPLICATED, place.id());
        }
        return ids;
    }

    /** Số khoảnh khắc trong giới hạn và mã không trùng. */
    private static void validateMoments(String destinationId, List<Moment> moments) {
        CatalogValidation.require(moments.size() <= CatalogConstants.MAX_MOMENTS_PER_DESTINATION,
                CatalogMessages.DESTINATION_TOO_MANY_MOMENTS, destinationId, CatalogConstants.MAX_MOMENTS_PER_DESTINATION);
        Set<String> ids = new HashSet<>();
        for (Moment moment : moments) {
            CatalogValidation.require(ids.add(moment.id()), CatalogMessages.MOMENT_ID_DUPLICATED, moment.id());
        }
    }

    /** Mã khối cẩm nang không trùng và mọi dòng trỏ tới địa điểm đều trỏ vào địa điểm có trong điểm đến. */
    private static void validateGuide(List<GuideSection> guide, Set<String> placeIds) {
        Set<String> sectionIds = new HashSet<>();
        for (GuideSection section : guide) {
            CatalogValidation.require(sectionIds.add(section.id()), CatalogMessages.GUIDE_SECTION_ID_DUPLICATED, section.id());
            validateGuideLinks(section, placeIds);
        }
    }

    /** Mọi dòng có {@code placeId} của khối đều trỏ tới địa điểm có trong điểm đến. */
    private static void validateGuideLinks(GuideSection section, Set<String> placeIds) {
        for (GuideItem item : section.items()) {
            boolean linkValid = item.placeId() == null || placeIds.contains(item.placeId());
            CatalogValidation.require(linkValid, CatalogMessages.GUIDE_LINKS_UNKNOWN_PLACE, item.placeId());
        }
    }
}
