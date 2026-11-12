package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Hạn mức thấp trong context riêng, dùng bộ đếm thật của catalog. */
@TestPropertySource(properties = "wander.limits.catalog-per-minute=2")
class PoiRateLimitIT extends ApiTestSupport {
    /** Chứng minh hạn mức được tiêu thụ trước parse và dùng chung route cũ. */
    @Test
    @DisplayName("POI và catalog dùng chung hạn mức; query sai cũng tiêu thụ một lượt")
    void poiSharesCatalogQuota() {
        assertThat(call("GET", "/api/catalog/destinations/da-lat/poi?kind=sai", null).status()).isEqualTo(400);
        assertThat(call("GET", "/api/catalog/destinations", null).status()).isEqualTo(200);
        Res limited = call("GET", "/api/catalog/destinations/da-lat/poi", null);
        assertProblem(limited, 429, "RATE_LIMITED");
    }
}
