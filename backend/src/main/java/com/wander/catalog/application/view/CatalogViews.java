package com.wander.catalog.application.view;

import java.util.List;

/** Read model của catalog: bản phẳng cho API, không lộ kiểu domain. Tên trường khớp {@code web/src/api.ts}. */
public final class CatalogViews {

    private CatalogViews() {
    }

    /** Ảnh và tên một địa điểm tiêu biểu, để vẽ màn Khám phá mà không phải tải cả điểm đến. */
    public record Preview(String placeId, String name, String url) {
    }

    public record DestinationSummary(String id, String name, String region, String tagline, int placeCount, String coverUrl, List<Integer> bestMonths,
                                     List<Preview> previews, Double lat, Double lon, PhotoView coverPhoto, List<String> categories) {
    }

    /**
     * A photo with attribution. {@code id} is the stable photo identifier (trip covers store it), {@code thumbUrl} the 480 px
     * variant and {@code srcSet} the ready-made {@code srcset} value; the last three are {@code null} when not applicable.
     */
    public record PhotoView(String url, String author, String license, String sourceUrl, String caption, String authorUrl,
                            String id, String thumbUrl, String srcSet) {
    }

    /** Khoảng cách ước tính từ một mốc tham chiếu. {@code approximate} = tọa độ mốc chưa kiểm chứng. */
    public record Away(String refId, String refName, int km, int minutes, boolean approximate) {
    }

    public record PlaceView(
            String id, String name, String category, String categoryName, String area, String hook, String summary,
            Double lat, Double lon, List<Integer> bestMonths, String bestLabel, String duration, String difficulty,
            List<String> highlights, String verdict, String verdictLabel, String verdictReason, List<String> bestSlots, String slotReason,
            List<String> tips, List<PhotoView> photos, List<Away> away, String wikipediaTitle, VenueView venue) {
    }

    public record VenueView(String kind, String kindName, String address, String website, String sourceUrl, String checkedAt,
                            String phone, String serviceHours, String priceNote) {
    }

    public record GuideItemView(String icon, String title, String text, String placeId) {
    }

    public record GuideSectionView(
            String id, String layout, String category, String icon, String title, String summary,
            List<Integer> bestMonths, List<Integer> rainyMonths, List<String> notes, List<GuideItemView> items) {
    }

    /** Mốc tham chiếu để tính khoảng cách; có tọa độ để giao diện vẽ bản đồ nhỏ. {@code approximate} = tọa độ chưa kiểm chứng. */
    /** Một ngày của lịch mẫu: mã địa điểm theo thứ tự đi (ghép với địa điểm của điểm đến ở phía gọi) và ghi chú biên tập. */
    public record TemplateDayView(List<String> placeIds, String note) {
    }

    /** Lịch mẫu của điểm đến (N-2). {@code status} là mã duyệt ({@code draft}/{@code approved}); không có giờ, giá hay đánh giá. */
    public record TemplateView(String id, String title, String summary, String status, List<TemplateDayView> days) {
    }

    public record ReferenceView(String id, String name, double lat, double lon, boolean approximate) {
    }

    /** Khoảnh khắc đời sống của điểm đến (DR-034): ảnh minh họa không khí kèm chủ đề, chú thích và ghi công. */
    public record MomentView(String id, String theme, String themeLabel, String caption, PhotoView photo, String authorUrl) {
    }

    public record DestinationDetail(
            String id, String name, String region, String tagline, String coverUrl, List<ReferenceView> references,
            List<GuideSectionView> guide, List<PlaceView> places, List<MomentView> moments, PhotoView coverPhoto) {
    }
}
