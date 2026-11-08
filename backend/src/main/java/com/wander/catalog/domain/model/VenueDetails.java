package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.VenueKind;
import com.wander.shared.kernel.util.Texts;
import java.net.URI;
import java.time.LocalDate;

/** Thông tin địa chỉ có nguồn; không suy ra giá, phòng trống hoặc giờ mở cửa từ việc có website. */
public record VenueDetails(VenueKind kind, String address, String website, String sourceUrl, LocalDate checkedAt,
                           String phone, String serviceHours, String priceNote) {

    /** Dữ liệu cũ giữ nguyên khả năng đọc khi chưa thu thập các thông tin tùy chọn. */
    public VenueDetails(VenueKind kind, String address, String website, String sourceUrl, LocalDate checkedAt) {
        this(kind, address, website, sourceUrl, checkedAt, "", "", "");
    }

    public VenueDetails {
        CatalogValidation.require(kind != null && checkedAt != null, CatalogMessages.VENUE_METADATA_INVALID);
        address = CatalogValidation.requiredText(address, CatalogMessages.LABEL_VENUE_ADDRESS, CatalogConstants.VENUE_ADDRESS_MAX_LENGTH);
        website = Texts.trimToEmpty(website);
        sourceUrl = Texts.trimToEmpty(sourceUrl);
        CatalogValidation.require(https(sourceUrl) && (website.isEmpty() || https(website)), CatalogMessages.VENUE_URL_INVALID);
        phone = optional(phone, CatalogMessages.LABEL_VENUE_PHONE, CatalogConstants.VENUE_PHONE_MAX_LENGTH);
        serviceHours = optional(serviceHours, CatalogMessages.LABEL_VENUE_HOURS, CatalogConstants.VENUE_HOURS_MAX_LENGTH);
        priceNote = optional(priceNote, CatalogMessages.LABEL_VENUE_PRICE_NOTE, CatalogConstants.VENUE_PRICE_NOTE_MAX_LENGTH);
    }

    /** Trống là chưa có thông tin, không tự thêm một giá trị mặc định để giả định đã xác nhận. */
    private static String optional(String value, String label, int maxLength) {
        String text = Texts.trimToEmpty(value);
        return text.isEmpty() ? text : CatalogValidation.requiredText(text, label, maxLength);
    }

    /** Chỉ nhận liên kết web HTTPS có host, không có thông tin đăng nhập nhúng trong URL. */
    private static boolean https(String value) {
        try {
            URI uri = URI.create(value);
            return value.startsWith(CatalogConstants.HTTPS_PREFIX) && uri.getHost() != null && uri.getUserInfo() == null;
        } catch (IllegalArgumentException error) {
            return false;
        }
    }
}
