package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.PlaceCategory;
import com.wander.shared.kernel.util.ImmutableLists;
import com.wander.shared.kernel.util.Texts;
import java.util.List;
import java.util.stream.Stream;

/**
 * Một khối cẩm nang điểm đến (mùa nên đi, chuẩn bị, ăn gì...). {@link Layout} cho giao diện biết cách vẽ.
 * Khối {@code MONTHS} dùng {@code bestMonths}/{@code rainyMonths}; các khối khác dùng {@code items}.
 */
public record GuideSection(
        String id,
        Layout layout,
        PlaceCategory category,
        String icon,
        String title,
        String summary,
        List<Integer> bestMonths,
        List<Integer> rainyMonths,
        List<String> notes,
        List<GuideItem> items) {

    /** Kiểu hiển thị của khối cho giao diện. */
    public enum Layout { MONTHS, CHECKLIST, CARDS, PLACES, ROWS }

    public GuideSection {
        boolean hasText = Stream.of(id, title, summary).noneMatch(Texts::isNullOrBlank);
        CatalogValidation.require(hasText, CatalogMessages.GUIDE_SECTION_FIELDS_MISSING);
        CatalogValidation.require(layout != null && category != null, CatalogMessages.GUIDE_SECTION_KIND_MISSING, id);
        icon = Texts.trimToEmpty(icon);
        bestMonths = ImmutableLists.copyOrEmpty(bestMonths);
        rainyMonths = ImmutableLists.copyOrEmpty(rainyMonths);
        CatalogValidation.requireMonths(bestMonths, CatalogMessages.MONTH_OUT_OF_RANGE_IN_SECTION, id);
        CatalogValidation.requireMonths(rainyMonths, CatalogMessages.MONTH_OUT_OF_RANGE_IN_SECTION, id);
        CatalogValidation.require(bestMonths.stream().noneMatch(rainyMonths::contains), CatalogMessages.MONTH_BOTH_BEST_AND_RAINY, id);
        notes = ImmutableLists.copyOrEmpty(notes);
        items = ImmutableLists.copyOrEmpty(items);
    }
}
