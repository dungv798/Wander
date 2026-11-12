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
 * The adapter that reads the editorial venue catalog from the classpath (ADR-009, ADR-010): one file per destination {@code catalog/<id>.json},
 * photos in {@code catalog/photos/}. It loads and validates everything at startup: wrong data or a missing photo means the application does not run,
 * so an editorial error shows up immediately instead of becoming a broken card in the UI.
 */
@Component
public class ClasspathPlaceCatalog implements PlaceCatalog {

    private final Map<String, Destination> byId;
    private final Map<String, List<ItineraryTemplate>> templatesByDestination;

    /** Loads only destinations, no sample itineraries (used in the venue catalog's own tests). */
    public ClasspathPlaceCatalog(String pattern) {
        this(pattern, "");
    }

    /**
     * Loads every destination file that matches {@code pattern} and every sample-itinerary file that matches {@code templatesPattern} (empty = none), validates everything,
     * and sorts destinations by name (without accents) so the result is stable.
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

    /** The destinations whose name, region or short description matches the (normalized) search string. */
    private static boolean matches(Destination destination, String normalizedQuery) {
        return SearchText.normalize(destination.name()).contains(normalizedQuery)
                || SearchText.normalize(destination.region()).contains(normalizedQuery)
                || SearchText.normalize(destination.tagline()).contains(normalizedQuery);
    }

    /** Reads every file that matches the pattern; two files with the same destination id or a file that cannot be read throw a startup error. */
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

    /** Reads every sample-itinerary file that matches the pattern (empty = none); a file that points to an unknown destination, duplicates a destination or is broken throws a startup error. */
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

    /** Builds the domain itinerary from one file: the destination must be in the catalog, each place must be in the destination, itinerary ids must not repeat. */
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

    /** Builds one domain itinerary; an unknown status is NOT treated as approved but as a data error. */
    private static ItineraryTemplate toTemplate(TemplateEntry entry) {
        TemplateStatus status = TemplateStatus.fromCode(entry.status())
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.TEMPLATE_STATUS_INVALID.formatted(entry.id(), entry.status())));
        List<TemplateDay> days = ImmutableLists.copyOrEmpty(entry.days()).stream()
                .map(day -> new TemplateDay(day.places(), day.note())).toList();
        return new ItineraryTemplate(entry.id(), entry.title(), entry.summary(), status, days);
    }

    /** Reads one destination file, builds the domain and checks that every photo really exists on the classpath; if wrong, names the file. */
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

    /** Every photo of every place has a file in the photo directory of the classpath. */
    private static void requirePhotoFilesExist(List<Place> places) {
        for (Place place : places) {
            for (Photo photo : place.photos()) {
                requireClasspathPhoto(photo, place.id(), CatalogMessages.PHOTO_FILE_MISSING);
            }
        }
    }

    /** Every moment photo has a file in the photo directory of the classpath. */
    private static void requireMomentFilesExist(List<Moment> moments) {
        for (Moment moment : moments) {
            requireClasspathPhoto(moment.photo(), moment.id(), CatalogMessages.MOMENT_PHOTO_FILE_MISSING);
        }
    }

    /** The destination's own cover photo (optional); null if missing. */
    private static Photo toCoverPhoto(PhotoFile source) {
        return source == null ? null : new Photo(source.file(), source.url(), source.author(), source.license(), source.sourceUrl(), source.caption(),
                source.authorUrl(), source.thumbFile());
    }

    /** The own cover photo, if it is a local file, must exist in the photo directory of the classpath. */
    private static void requireCoverPhotoFileExists(Destination destination) {
        requireClasspathPhoto(destination.coverPhoto(), destination.id(), CatalogMessages.DESTINATION_PHOTO_FILE_MISSING);
    }

    /** A local photo must exist under the photo directory; external photos and optional photos that are not declared are skipped. */
    private static void requireClasspathPhoto(Photo photo, String objectId, String missingMessage) {
        if (photo == null || photo.isExternal()) return;
        for (String name : photo.thumbFile() == null ? List.of(photo.file()) : List.of(photo.file(), photo.thumbFile())) {
            String path = CatalogConstants.PHOTO_CLASSPATH_DIR + name;
            if (!new ClassPathResource(path).exists()) {
                throw new IllegalStateException(missingMessage.formatted(path, objectId));
            }
        }
    }

    /** Builds the list of domain moments; an unknown theme is a data error, a missing list is empty. */
    private static List<Moment> toMoments(List<MomentFile> sources) {
        return ImmutableLists.copyOrEmpty(sources).stream().map(source -> {
            MomentTheme theme = MomentTheme.fromCode(source.theme())
                    .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.MOMENT_THEME_INVALID.formatted(source.theme())));
            return new Moment(source.id(), theme, source.caption(),
                    new Photo(source.file(), source.url(), source.author(), source.license(), source.sourceUrl(), null, source.authorUrl(), source.thumbFile()),
                    source.authorUrl());
        }).toList();
    }

    /** Builds the domain place from a data row; coordinates exist only when both latitude and longitude are present. */
    private static Place toPlace(String destinationId, PlaceFile source) {
        PlaceCategory category = requireCategory(source.category());
        Verdict verdict = Verdict.fromCode(source.verdict())
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.VERDICT_INVALID.formatted(source.verdict())));
        GeoPoint location = source.lat() == null || source.lon() == null ? null : new GeoPoint(source.lat(), source.lon());
        List<Photo> photos = source.photos().stream()
                .map(photo -> new Photo(photo.file(), photo.url(), photo.author(), photo.license(), photo.sourceUrl(), photo.caption(), photo.authorUrl(),
                        photo.thumbFile())).toList();
        return new Place(source.id(), destinationId, source.name(), category, source.area(), source.hook(), source.summary(), location,
                source.bestMonths(), source.bestLabel(), source.duration(), source.difficulty(), source.highlights(), verdict,
                source.verdictReason(), toTimeSlots(source.bestSlots()), source.slotReason(), source.tips(), photos, source.wikipediaTitle(), toVenue(source.venue()));
    }

    /** The new metadata is optional: an old catalog file does not need to be rewritten. */
    private static VenueDetails toVenue(VenueFile source) {
        if (source == null) return null;
        VenueKind kind = VenueKind.fromCode(source.kind())
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.VENUE_KIND_INVALID.formatted(source.kind())));
        return new VenueDetails(kind, source.address(), source.website(), source.sourceUrl(), LocalDate.parse(source.checkedAt()),
                source.phone(), source.serviceHours(), source.priceNote());
    }

    /** The set of times of day from a list of codes; an unknown code throws a data error. */
    private static Set<TimeSlot> toTimeSlots(List<String> codes) {
        Set<TimeSlot> slots = EnumSet.noneOf(TimeSlot.class);
        for (String code : codes) {
            slots.add(TimeSlot.fromCode(code)
                    .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.TIME_SLOT_INVALID.formatted(code))));
        }
        return slots;
    }

    /** Builds the domain reference landmark; missing coordinates throw a data error. */
    private static ReferencePoint toReference(ReferenceFile source) {
        if (source.lat() == null || source.lon() == null) {
            throw new IllegalArgumentException(CatalogMessages.REFERENCE_COORDINATES_MISSING.formatted(source.id()));
        }
        return new ReferencePoint(source.id(), source.name(), new GeoPoint(source.lat(), source.lon()), source.approximate());
    }

    /** Builds the domain guide block from a data row. */
    private static GuideSection toSection(SectionFile source) {
        PlaceCategory category = requireCategory(source.category());
        List<GuideItem> items = source.items().stream()
                .map(item -> new GuideItem(item.icon(), item.title(), item.text(), item.placeId())).toList();
        return new GuideSection(source.id(), GuideSection.Layout.valueOf(source.layout()), category, source.icon(), source.title(),
                source.summary(), source.bestMonths(), source.rainyMonths(), source.notes(), items);
    }

    /** The place kind by code; an unknown code throws a data error. */
    private static PlaceCategory requireCategory(String code) {
        return PlaceCategory.fromCode(code)
                .orElseThrow(() -> new IllegalArgumentException(CatalogMessages.CATEGORY_INVALID.formatted(code)));
    }

    // ---- the shape of the JSON files (used only inside the adapter) ----
    record DestinationFile(String id, String name, String region, String tagline, String coverPlaceId, List<ReferenceFile> references,
                           List<SectionFile> guide, List<PlaceFile> places, List<MomentFile> moments, PhotoFile coverPhoto) {
    }

    record MomentFile(String id, String theme, String caption, String file, String thumbFile, String url, String author, String license, String sourceUrl, String authorUrl) {
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

    record PhotoFile(String file, String thumbFile, String url, String author, String license, String sourceUrl, String caption, String authorUrl) {
    }
}
