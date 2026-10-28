package com.wander.catalog.application.query;

import com.wander.catalog.application.view.CatalogViews;
import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.catalog.domain.model.GuideSection;
import com.wander.catalog.domain.model.Photo;
import com.wander.catalog.domain.model.Place;
import com.wander.catalog.domain.model.ReferencePoint;
import com.wander.catalog.domain.model.TravelEstimate;
import com.wander.catalog.domain.port.PlaceCatalog;
import com.wander.catalog.domain.vocabulary.TimeSlot;
import com.wander.shared.kernel.error.WanderException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

/**
 * Phía đọc của catalog. Không có giao dịch hay aggregate: dữ liệu biên tập bất biến trong bộ nhớ. Đây là nơi tính
 * "cách bao xa" (ước tính), để giao diện không phải biết công thức.
 */
@Service
public class CatalogQueries {

    private final PlaceCatalog catalog;

    /** Nhận cổng tới kho địa điểm. */
    public CatalogQueries(PlaceCatalog catalog) {
        this.catalog = catalog;
    }

    /** Tóm tắt các điểm đến khớp chuỗi tìm kiếm (rỗng = tất cả). */
    public List<CatalogViews.DestinationSummary> searchDestinations(String query) {
        return catalog.searchDestinations(query).stream().map(CatalogQueries::toSummary).toList();
    }

    /** Chi tiết một điểm đến (mốc, cẩm nang, địa điểm); không có trong kho thì ném lỗi không tìm thấy. */
    public CatalogViews.DestinationDetail destination(String id) {
        Destination destination = catalog.destination(id).orElseThrow(WanderException::notFound);
        return new CatalogViews.DestinationDetail(destination.id(), destination.name(), destination.region(), destination.tagline(),
                coverUrl(destination),
                destination.references().stream().map(CatalogQueries::toReferenceView).toList(),
                destination.guide().stream().map(CatalogQueries::toSectionView).toList(),
                destination.places().stream().map(place -> toPlaceView(destination, place)).toList());
    }

    /** Lịch mẫu của một điểm đến theo thứ tự biên tập; điểm đến không có trong kho thì ném lỗi không tìm thấy, chưa có lịch thì rỗng. */
    public List<CatalogViews.TemplateView> templates(String destinationId) {
        catalog.destination(destinationId).orElseThrow(WanderException::notFound);
        return catalog.templates(destinationId).stream()
                .map(template -> new CatalogViews.TemplateView(template.id(), template.title(), template.summary(), template.status().code(),
                        template.days().stream().map(day -> new CatalogViews.TemplateDayView(day.placeIds(), day.note())).toList()))
                .toList();
    }

    /** Tóm tắt điểm đến; JSON chưa có tâm riêng nên lấy trung bình các địa điểm có tọa độ, thiếu hết trả null. */
    private static CatalogViews.DestinationSummary toSummary(Destination destination) {
        List<Integer> bestMonths = destination.guide().stream()
                .filter(section -> section.layout() == GuideSection.Layout.MONTHS)
                .findFirst().map(GuideSection::bestMonths).orElse(List.of());
        List<CatalogViews.Preview> previews = destination.places().stream().limit(CatalogConstants.PREVIEW_PLACE_COUNT)
                .map(place -> new CatalogViews.Preview(place.id(), place.name(), photoUrl(place.photos().getFirst()))).toList();
        List<GeoPoint> locations = destination.places().stream().map(Place::location).filter(Objects::nonNull).toList();
        Double lat = locations.isEmpty() ? null : locations.stream().mapToDouble(GeoPoint::lat).average().orElseThrow();
        Double lon = locations.isEmpty() ? null : locations.stream().mapToDouble(GeoPoint::lon).average().orElseThrow();
        return new CatalogViews.DestinationSummary(destination.id(), destination.name(), destination.region(), destination.tagline(),
                destination.places().size(), coverUrl(destination), bestMonths, previews, lat, lon);
    }

    /** Đường dẫn công khai của ảnh bìa điểm đến (ảnh đầu của địa điểm bìa). */
    private static String coverUrl(Destination destination) {
        return photoUrl(destination.coverPlace().photos().getFirst());
    }

    /** Đường dẫn công khai của một ảnh. */
    private static String photoUrl(Photo photo) {
        return CatalogConstants.PHOTO_URL_PREFIX + photo.file();
    }

    /** Dạng hiển thị của mốc tham chiếu. */
    private static CatalogViews.ReferenceView toReferenceView(ReferencePoint reference) {
        return new CatalogViews.ReferenceView(reference.id(), reference.name(), reference.location().lat(), reference.location().lon(),
                reference.approximate());
    }

    /** Dạng hiển thị của một khối cẩm nang (kiểu hiển thị viết thường như hợp đồng API). */
    private static CatalogViews.GuideSectionView toSectionView(GuideSection section) {
        List<CatalogViews.GuideItemView> items = section.items().stream()
                .map(item -> new CatalogViews.GuideItemView(item.icon(), item.title(), item.text(), item.placeId())).toList();
        return new CatalogViews.GuideSectionView(section.id(), section.layout().name().toLowerCase(), section.category().code(), section.icon(),
                section.title(), section.summary(), section.bestMonths(), section.rainyMonths(), section.notes(), items);
    }

    /** Dạng hiển thị của một địa điểm, kèm khoảng cách ước tính từ từng mốc tham chiếu của điểm đến. */
    private static CatalogViews.PlaceView toPlaceView(Destination destination, Place place) {
        // Thứ tự = thứ tự mốc trong dữ liệu; mốc đầu là mốc chính.
        List<CatalogViews.Away> away = place.location() == null ? List.of()
                : destination.references().stream().map(reference -> toAway(reference, place)).toList();
        List<String> slots = Stream.of(TimeSlot.values()).filter(place.bestSlots()::contains).map(TimeSlot::code).toList();
        Double lat = place.location() == null ? null : place.location().lat();
        Double lon = place.location() == null ? null : place.location().lon();
        return new CatalogViews.PlaceView(place.id(), place.name(), place.category().code(), place.category().label(), place.area(),
                place.hook(), place.summary(), lat, lon, place.bestMonths(), place.bestLabel(), place.duration(), place.difficulty(),
                place.highlights(), place.verdict().code(), place.verdict().label(), place.verdictReason(), slots, place.slotReason(),
                place.tips(), place.photos().stream().map(CatalogQueries::toPhotoView).toList(), away, place.wikipediaTitle());
    }

    /** Khoảng cách ước tính từ một mốc tham chiếu tới địa điểm. */
    private static CatalogViews.Away toAway(ReferencePoint reference, Place place) {
        TravelEstimate estimate = TravelEstimate.between(reference.location(), place.location());
        return new CatalogViews.Away(reference.id(), reference.name(), estimate.roadKm(), estimate.minutes(), reference.approximate());
    }

    /** Dạng hiển thị của một ảnh kèm thông tin ghi công. */
    private static CatalogViews.PhotoView toPhotoView(Photo photo) {
        return new CatalogViews.PhotoView(photoUrl(photo), photo.author(), photo.license(), photo.sourceUrl());
    }
}
