package com.wander.catalog.api.controller;

import com.wander.catalog.api.constant.CatalogApiConstants;
import com.wander.catalog.application.query.CatalogQueries;
import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API của Catalog (chỉ đọc). Công khai (DR-008 Q-a): không cần phiên để người mới khám phá trước khi có danh tính;
 * thay vào đó có giới hạn tốc độ theo địa chỉ người gọi. Ảnh phục vụ công khai ở {@code /catalog/photos/**} (ADR-010).
 * Danh sách route công khai nằm ở {@code SecurityConfig} của module identity (một nguồn duy nhất).
 */
@RestController
@RequestMapping(CatalogApiConstants.BASE_PATH)
public class CatalogController {

    private final CatalogQueries queries;
    private final RateLimits limits;
    private final ClientAddress clientAddress;

    /** Nhận phía đọc của catalog, bộ giới hạn tốc độ và bộ lấy địa chỉ người gọi. */
    public CatalogController(CatalogQueries queries, RateLimits limits, ClientAddress clientAddress) {
        this.queries = queries;
        this.limits = limits;
        this.clientAddress = clientAddress;
    }

    /** Danh sách điểm đến khớp chuỗi tìm kiếm (rỗng = tất cả); chuỗi quá dài bị cắt. */
    @GetMapping(CatalogApiConstants.DESTINATIONS_PATH)
    public Map<String, Object> searchDestinations(HttpServletRequest request,
            @RequestParam(name = CatalogApiConstants.QUERY_PARAM, defaultValue = "") String query) {
        limitByAddress(request);
        return Map.of(CatalogApiConstants.KEY_DESTINATIONS, queries.searchDestinations(truncateQuery(query)));
    }

    /** Chi tiết một điểm đến theo mã; không có thì 404. */
    @GetMapping(CatalogApiConstants.DESTINATION_PATH)
    public Map<String, Object> getDestination(HttpServletRequest request, @PathVariable String id) {
        limitByAddress(request);
        return Map.of(CatalogApiConstants.KEY_DESTINATION, queries.destination(id));
    }

    /** Giới hạn tốc độ đọc kho địa điểm công khai theo địa chỉ người gọi; vượt ngưỡng thì 429. */
    private void limitByAddress(HttpServletRequest request) {
        limits.catalog(clientAddress.of(request));
    }

    /** Cắt chuỗi tìm kiếm tới độ dài tối đa cho phép. */
    private static String truncateQuery(String query) {
        int max = CatalogConstants.SEARCH_QUERY_MAX_LENGTH;
        return query.length() > max ? query.substring(0, max) : query;
    }
}
