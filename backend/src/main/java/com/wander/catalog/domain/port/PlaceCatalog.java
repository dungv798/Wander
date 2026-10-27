package com.wander.catalog.domain.port;

import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.ItineraryTemplate;
import java.util.List;
import java.util.Optional;

/**
 * Cổng tới kho địa điểm (ADR-009, ADR-010). Nghiệp vụ không biết nguồn là tệp biên tập, Google hay cổng admin.
 * Chỉ đọc.
 */
public interface PlaceCatalog {

    /** Tìm điểm đến theo tên/vùng, không phân biệt hoa thường và dấu. Chuỗi rỗng trả tất cả. */
    List<Destination> searchDestinations(String query);

    /** Điểm đến theo mã; mã null hoặc không có trong kho thì trả rỗng. */
    Optional<Destination> destination(String id);

    /** Lịch mẫu của một điểm đến theo thứ tự biên tập; điểm đến chưa có lịch hoặc mã lạ thì trả danh sách rỗng. */
    List<ItineraryTemplate> templates(String destinationId);
}
