package com.wander.catalog.infrastructure.adapter;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.catalog.domain.model.GuideItem;
import com.wander.catalog.domain.model.GuideSection;
import com.wander.catalog.domain.model.ItineraryTemplate;
import com.wander.catalog.domain.model.Moment;
import com.wander.catalog.domain.model.Photo;
import com.wander.catalog.domain.model.Place;
import com.wander.catalog.domain.model.ReferencePoint;
import com.wander.catalog.domain.model.TemplateDay;
import com.wander.catalog.domain.model.VenueDetails;
import com.wander.catalog.domain.port.PlaceCatalog;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.rule.SearchText;
import com.wander.catalog.domain.vocabulary.MomentTheme;
import com.wander.catalog.domain.vocabulary.PlaceCategory;
import com.wander.catalog.domain.vocabulary.TemplateStatus;
import com.wander.catalog.domain.vocabulary.TimeSlot;
import com.wander.catalog.domain.vocabulary.VenueKind;
import com.wander.catalog.domain.vocabulary.Verdict;
import com.wander.shared.kernel.util.ImmutableLists;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Adapter đọc kho địa điểm biên tập từ classpath (ADR-009, ADR-010): mỗi điểm đến một tệp {@code catalog/<id>.json},
 * ảnh ở {@code catalog/photos/}. Nạp và kiểm tra hết lúc khởi động: dữ liệu sai hay thiếu ảnh thì ứng dụng không chạy,
 * để lỗi biên tập lộ ngay thay vì thành thẻ hỏng trên giao diện.
 */
@Component
public class ClasspathPlaceCatalog implements PlaceCatalog {

    private final Map<String, Destination> byId;
    private final Map<String, List<ItineraryTemplate>> templatesByDestination;

    /** Chỉ nạp điểm đến, không có lịch mẫu (dùng trong test của riêng kho địa điểm). */
    public ClasspathPlaceCatalog(String pattern) {
        this(pattern, "");
    }

    /**
     * Nạp mọi tệp điểm đến khớp {@code pattern} và mọi tệp lịch mẫu khớp {@code templatesPattern} (rỗng = không có), kiểm tra hết,
     * và sắp điểm đến theo tên (không dấu) để kết quả ổn định.
     */
    @Autowired
    public ClasspathPlaceCatalog(@Value(CatalogConstants.LOCATION_EXPRESSION) String pattern,
                                 @Value(CatalogConstants.TEMPLATES_LOCATION_EXPRESSION) String templatesPattern) {
        JsonMapper mapper = JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
        Map<String, Destination> loaded = loadAll(mapper, pattern);
        this.byId = loaded.values().stream().sorted(Comparator.comparing(destination -> SearchText.normalize(destination.name())))
                .collect(LinkedHashMap::new, (map, destination) -> map.put(destination.id(), destination), Map::putAll);
        this.templatesByDestination = loadTemplates(mapper, templatesPattern, byId);
    }

    @Override
    public List<Destination> searchDestinations(String query) {
        String normalizedQuery = SearchText.normalize(query);
        if (normalizedQuery.isEmpty()) return List.copyOf(byId.values());
        return byId.values().stream().filter(destination -> matches(destination, normalizedQuery)).toList();
    }

    @Override
    public Optional<Destination> destination(String id) {
        return Optional.ofNullable(id == null ? null : byId.get(id));
    }

    @Override
    public List<ItineraryTemplate> templates(String destinationId) {
        return destinationId == null ? List.of() : templatesByDestination.getOrDefault(destinationId, List.of());
    }

    /** Điểm đến khớp chuỗi tìm kiếm (đã chuẩn hóa) ở tên, vùng hoặc mô tả ngắn. */
    private static boolean matches(Destination destination, String normalizedQuery) {
        return SearchText.normalize(destination.name()).contains(normalizedQuery)
                || SearchText.normalize(destination.region()).contains(normalizedQuery)
                || SearchText.normalize(destination.tagline()).contains(normalizedQuery);
    }

    /** Đọc mọi tệp khớp mẫu; hai tệp cùng mã điểm đến hoặc tệp không đọc được thì ném lỗi khởi động. */
    private static Map<String, Destination> loadAll(JsonMapper mapper, String pattern) {
        Map<String, Destination> loaded = new LinkedHashMap<>();
        try {
            for (Resource file : new PathMatchingResourcePatternResolver().getResources(pattern)) {
                Destination destination = read(mapper, file);
                if (loaded.put(destination.id(), destination) != null) {
                    throw new IllegalStateException(CatalogMessages.DESTINATION_ID_DUPLICATED.formatted(destination.id()));
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException(CatalogMessages.CATALOG_UNREADABLE, e);
        }
        return loaded;
    }

    /** Đọc mọi tệp lịch mẫu khớp mẫu (rỗng = không có); tệp trỏ tới điểm đến lạ, trùng điểm đến hoặc hỏng thì ném lỗi khởi động. */
    private static Map<String, List<ItineraryTemplate>> loadTemplates(JsonMapper mapper, String pattern, Map<String, Destination> destinations) {
        Map<String, List<ItineraryTemplate>> loaded = new LinkedHashMap<>();
        if (pattern == null || pattern.isBlank()) return loaded;
        try {
            for (Resource file : new PathMatchingResourcePatternResolver().getResources(pattern)) {
                String fileName = String.valueOf(file.getFilename());
                try (InputStream in = file.getInputStream()) {
                    TemplatesFile source = mapper.readValue(in, TemplatesFile.class);
                    List<ItineraryTemplate> templates = toTemplates(source, destinations);
                    if (loaded.put(source.destinationId(), templates) != null) {
                        throw new IllegalStateException(CatalogMessages.TEMPLATE_FILE_DUPLICATED.formatted(source.destinationId()));
                    }
                } catch (IOException | RuntimeException e) {
                    throw new IllegalStateException(CatalogMessages.CATALOG_FILE_CORRUPT.formatted(fileName, e.getMessage()), e);
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException(CatalogMessages.CATALOG_UNREADABLE, e);
        }
        return loaded;
    }

    /** Dựng lịch mẫu domain từ một tệp: điểm đến phải có trong kho, mỗi địa điểm phải có trong điểm đến, mã lịch không trùng. */
    private static List<ItineraryTemplate> toTemplates(TemplatesFile source, Map<String, Destination> destinations) {
        Destination destination = destinations.get(source.destinationId());
        CatalogValidation.require(destination != null, CatalogMessages.TEMPLATE_DESTINATION_UNKNOWN, source.destinationId());
        Set<String> placeIds = destination.places().stream().map(Place::id).collect(Collectors.toSet());
        Set<String> seenIds = new HashSet<>();
        List<ItineraryTemplate> templates = new ArrayList<>();
        for (TemplateEntry entry : source.templates()) {
            ItineraryTemplate template = toTemplate(entry);
            CatalogValidation.require(seenIds.add(template.id()), CatalogMessages.TEMPLATE_ID_DUPLICATED, destination.id(), template.id());
            template.requirePlacesIn(placeIds, destination.id());
            templates.add(template);
        }
        return List.copyOf(templates);
    }

    /** Dựng một lịch mẫu domain; trạng thái lạ KHÔNG được coi là đã duyệt mà là lỗi dữ liệu. */
    private static ItineraryTemplate toTemplate(TemplateEntry entry) {
        TemplateStatus status = TemplateStatus.fromCode(entry.status())
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.TEMPLATE_STATUS_INVALID.formatted(entry.id(), entry.status())));
        List<TemplateDay> days = ImmutableLists.copyOrEmpty(entry.days()).stream()
                .map(day -> new TemplateDay(day.places(), day.note())).toList();
        return new ItineraryTemplate(entry.id(), entry.title(), entry.summary(), status, days);
    }

    /** Đọc một tệp điểm đến, dựng domain và kiểm tra mọi ảnh có thật trong classpath; sai thì nêu tên tệp. */
    private static Destination read(JsonMapper mapper, Resource file) {
        String fileName = String.valueOf(file.getFilename());
        try (InputStream in = file.getInputStream()) {
            DestinationFile source = mapper.readValue(in, DestinationFile.class);
            List<Place> places = source.places().stream().map(place -> toPlace(source.id(), place)).toList();
            Destination destination = new Destination(source.id(), source.name(), source.region(), source.tagline(), source.coverPlaceId(),
                    source.references().stream().map(ClasspathPlaceCatalog::toReference).toList(),
                    source.guide().stream().map(ClasspathPlaceCatalog::toSection).toList(), places, toMoments(source.moments()), toCoverPhoto(source.coverPhoto()));
            requirePhotoFilesExist(places);
            requireMomentFilesExist(destination.moments());
            requireCoverPhotoFileExists(destination);
            return destination;
        } catch (IOException | RuntimeException e) {
            throw new IllegalStateException(CatalogMessages.CATALOG_FILE_CORRUPT.formatted(fileName, e.getMessage()), e);
        }
    }

    /** Mọi ảnh của mọi địa điểm đều có tệp trong thư mục ảnh của classpath. */
    private static void requirePhotoFilesExist(List<Place> places) {
        for (Place place : places) {
            for (Photo photo : place.photos()) {
                requireClasspathPhoto(photo, place.id(), CatalogMessages.PHOTO_FILE_MISSING);
            }
        }
    }

    /** Mọi ảnh khoảnh khắc đều có tệp trong thư mục ảnh của classpath. */
    private static void requireMomentFilesExist(List<Moment> moments) {
        for (Moment moment : moments) {
            requireClasspathPhoto(moment.photo(), moment.id(), CatalogMessages.MOMENT_PHOTO_FILE_MISSING);
        }
    }

    /** Ảnh bìa riêng (tùy chọn) của điểm đến; thiếu thì null. */
    private static Photo toCoverPhoto(PhotoFile source) {
        return source == null ? null : new Photo(source.file(), source.url(), source.author(), source.license(), source.sourceUrl(), source.caption(), source.authorUrl());
    }

    /** Ảnh bìa riêng, nếu là tệp cục bộ, phải có trong thư mục ảnh của classpath. */
    private static void requireCoverPhotoFileExists(Destination destination) {
        requireClasspathPhoto(destination.coverPhoto(), destination.id(), CatalogMessages.DESTINATION_PHOTO_FILE_MISSING);
    }

    /** Ảnh cục bộ phải tồn tại dưới thư mục ảnh; bỏ qua ảnh ngoài và ảnh tùy chọn chưa khai báo. */
    private static void requireClasspathPhoto(Photo photo, String objectId, String missingMessage) {
        if (photo == null || photo.isExternal()) return;
        String path = CatalogConstants.PHOTO_CLASSPATH_DIR + photo.file();
        if (!new ClassPathResource(path).exists()) {
            throw new IllegalStateException(missingMessage.formatted(path, objectId));
        }
    }

    /** Dựng danh sách khoảnh khắc domain; chủ đề lạ là lỗi dữ liệu, thiếu danh sách thì rỗng. */
    private static List<Moment> toMoments(List<MomentFile> sources) {
        return ImmutableLists.copyOrEmpty(sources).stream().map(source -> {
            MomentTheme theme = MomentTheme.fromCode(source.theme())
                    .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.MOMENT_THEME_INVALID.formatted(source.theme())));
            return new Moment(source.id(), theme, source.caption(),
                    new Photo(source.file(), source.url(), source.author(), source.license(), source.sourceUrl(), null, source.authorUrl()), source.authorUrl());
        }).toList();
    }

    /** Dựng địa điểm domain từ dòng dữ liệu; tọa độ chỉ có khi đủ cả vĩ độ lẫn kinh độ. */
    private static Place toPlace(String destinationId, PlaceFile source) {
        PlaceCategory category = requireCategory(source.category());
        Verdict verdict = Verdict.fromCode(source.verdict())
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.VERDICT_INVALID.formatted(source.verdict())));
        GeoPoint location = source.lat() == null || source.lon() == null ? null : new GeoPoint(source.lat(), source.lon());
        List<Photo> photos = source.photos().stream()
                .map(photo -> new Photo(photo.file(), photo.url(), photo.author(), photo.license(), photo.sourceUrl(), photo.caption(), photo.authorUrl())).toList();
        return new Place(source.id(), destinationId, source.name(), category, source.area(), source.hook(), source.summary(), location,
                source.bestMonths(), source.bestLabel(), source.duration(), source.difficulty(), source.highlights(), verdict,
                source.verdictReason(), toTimeSlots(source.bestSlots()), source.slotReason(), source.tips(), photos, source.wikipediaTitle(), toVenue(source.venue()));
    }

    /** Metadata mới là tùy chọn: tệp catalog cũ không cần được viết lại. */
    private static VenueDetails toVenue(VenueFile source) {
        if (source == null) return null;
        VenueKind kind = VenueKind.fromCode(source.kind())
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.VENUE_KIND_INVALID.formatted(source.kind())));
        return new VenueDetails(kind, source.address(), source.website(), source.sourceUrl(), LocalDate.parse(source.checkedAt()),
                source.phone(), source.serviceHours(), source.priceNote());
    }

    /** Tập buổi trong ngày từ danh sách mã; mã lạ thì ném lỗi dữ liệu. */
    private static Set<TimeSlot> toTimeSlots(List<String> codes) {
        Set<TimeSlot> slots = EnumSet.noneOf(TimeSlot.class);
        for (String code : codes) {
            slots.add(TimeSlot.fromCode(code)
                    .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.TIME_SLOT_INVALID.formatted(code))));
        }
        return slots;
    }

    /** Dựng mốc tham chiếu domain; thiếu tọa độ thì ném lỗi dữ liệu. */
    private static ReferencePoint toReference(ReferenceFile source) {
        if (source.lat() == null || source.lon() == null) {
            throw new IllegalArgumentException(CatalogMessages.REFERENCE_COORDINATES_MISSING.formatted(source.id()));
        }
        return new ReferencePoint(source.id(), source.name(), new GeoPoint(source.lat(), source.lon()), source.approximate());
    }

    /** Dựng khối cẩm nang domain từ dòng dữ liệu. */
    private static GuideSection toSection(SectionFile source) {
        PlaceCategory category = requireCategory(source.category());
        List<GuideItem> items = source.items().stream()
                .map(item -> new GuideItem(item.icon(), item.title(), item.text(), item.placeId())).toList();
        return new GuideSection(source.id(), GuideSection.Layout.valueOf(source.layout()), category, source.icon(), source.title(),
                source.summary(), source.bestMonths(), source.rainyMonths(), source.notes(), items);
    }

    /** Loại địa điểm theo mã; mã lạ thì ném lỗi dữ liệu. */
    private static PlaceCategory requireCategory(String code) {
        return PlaceCategory.fromCode(code)
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.CATEGORY_INVALID.formatted(code)));
    }

    // ---- hình dạng tệp JSON (chỉ dùng trong adapter) ----
    record DestinationFile(String id, String name, String region, String tagline, String coverPlaceId, List<ReferenceFile> references,
                           List<SectionFile> guide, List<PlaceFile> places, List<MomentFile> moments, PhotoFile coverPhoto) {
    }

    record MomentFile(String id, String theme, String caption, String file, String url, String author, String license, String sourceUrl, String authorUrl) {
    }

    record TemplatesFile(String destinationId, List<TemplateEntry> templates) {
    }

    record TemplateEntry(String id, String title, String summary, String status, List<TemplateDayEntry> days) {
    }

    record TemplateDayEntry(List<String> places, String note) {
    }

    record ReferenceFile(String id, String name, Double lat, Double lon, boolean approximate) {
    }

    record SectionFile(String id, String layout, String category, String icon, String title, String summary, List<Integer> bestMonths,
                       List<Integer> rainyMonths, List<String> notes, List<ItemFile> items) {
    }

    record ItemFile(String icon, String title, String text, String placeId) {
    }

    record PlaceFile(String id, String name, String category, String area, String hook, String summary, Double lat, Double lon, List<Integer> bestMonths,
                     String bestLabel, String duration, String difficulty, List<String> highlights, String verdict, String verdictReason,
                     List<String> bestSlots, String slotReason, List<String> tips, List<PhotoFile> photos, String wikipediaTitle, VenueFile venue) {
    }

    record VenueFile(String kind, String address, String website, String sourceUrl, String checkedAt,
                     String phone, String serviceHours, String priceNote) {
    }

    record PhotoFile(String file, String url, String author, String license, String sourceUrl, String caption, String authorUrl) {
    }
}
