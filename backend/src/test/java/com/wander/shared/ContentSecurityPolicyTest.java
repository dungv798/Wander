package com.wander.shared;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.shared.web.constant.HttpConstants;
import com.wander.shared.web.filter.ContentSecurityPolicy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

/** The CSP only gains the photo origin when one is configured, and never anything else. */
class ContentSecurityPolicyTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  "})
    @DisplayName("no photo origin: the strict base policy is returned unchanged")
    void unchangedWithoutOrigin(String value) {
        assertThat(ContentSecurityPolicy.forPhotoBaseUrl(value)).isEqualTo(HttpConstants.VALUE_CONTENT_SECURITY_POLICY);
    }

    @Test
    @DisplayName("photo origin set: only img-src gains the origin (scheme://host[:port]), path dropped, rest identical")
    void addsOnlyTheOriginToImgSrc() {
        String csp = ContentSecurityPolicy.forPhotoBaseUrl("https://photos.example.com/wander/");
        assertThat(csp).contains("img-src 'self' data: blob: https://images.unsplash.com https://photos.example.com;");
        assertThat(csp).doesNotContain("/wander");
        assertThat(csp.replace(" https://photos.example.com", "")).isEqualTo(HttpConstants.VALUE_CONTENT_SECURITY_POLICY);
        assertThat(ContentSecurityPolicy.forPhotoBaseUrl("https://cdn.example.com:8443")).contains("https://cdn.example.com:8443;");
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://photos.example.com", "https://u:p@photos.example.com", "https://photos.example.com?x=1", "https://photos.example.com#f",
            "javascript:alert(1)", "https://", "not a url", "https://photos.example.com; script-src *"})
    @DisplayName("anything that is not a plain https URL is ignored and can never be injected into the header")
    void ignoresUnsafeValues(String value) {
        assertThat(ContentSecurityPolicy.forPhotoBaseUrl(value)).isEqualTo(HttpConstants.VALUE_CONTENT_SECURITY_POLICY);
    }
}
