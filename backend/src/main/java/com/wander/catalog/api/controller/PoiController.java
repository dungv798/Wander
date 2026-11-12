package com.wander.catalog.api.controller;

import com.wander.catalog.api.constant.PoiApiConstants;
import com.wander.catalog.api.response.CatalogResponses;
import com.wander.catalog.application.query.PoiQueries;
import com.wander.catalog.application.query.PoiSearch;
import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** API POI cộng thêm, dùng chung hạn mức công khai của catalog. */
@RestController
@SecurityRequirements
public class PoiController {
    private final PoiQueries queries;
    private final RateLimits limits;
    private final ClientAddress clientAddress;

    /** Nhận truy vấn, hạn mức và bộ lấy địa chỉ đã chuẩn hóa của hệ thống. */
    public PoiController(PoiQueries queries, RateLimits limits, ClientAddress clientAddress) {
        this.queries = queries;
        this.limits = limits;
        this.clientAddress = clientAddress;
    }

    /** Tìm ứng viên theo mét; giới hạn tốc độ trước khi phân tích các tham số không tin cậy. */
    @GetMapping(PoiApiConstants.PATH)
    public CatalogResponses.PoiResponse searchPoi(HttpServletRequest request, @PathVariable String id,
            @RequestParam(name = PoiConstants.KIND, required = false) String kind,
            @RequestParam(name = PoiConstants.NEAR, required = false) String near,
            @RequestParam(name = PoiConstants.RADIUS_M, required = false) String radiusM,
            @RequestParam(name = PoiConstants.LIMIT, required = false) String limit) {
        limits.catalog(clientAddress.of(request));
        return new CatalogResponses.PoiResponse(queries.search(id, PoiSearch.parse(kind, near, radiusM, limit)));
    }
}
