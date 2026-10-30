package com.wander.catalog.domain.port;

import com.wander.catalog.domain.model.PoiCollection;
import java.util.Optional;

/** Cổng đọc POI rộng; không ép POI thiếu ảnh vào kho Discover. */
public interface PoiCatalog {
    /** Đọc batch của điểm đến; chưa có dữ liệu trả Optional rỗng. */
    Optional<PoiCollection> destination(String destinationId);
}
