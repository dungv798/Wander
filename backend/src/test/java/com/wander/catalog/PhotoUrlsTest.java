package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.application.query.PhotoUrls;
import com.wander.catalog.domain.model.Photo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** URL building for catalog photos, with and without an external photo origin (WANDER_PHOTO_BASE_URL). */
class PhotoUrlsTest {

    private static final Photo TWO_VARIANTS = new Photo("hue-1-w1280-aaaaaaaaaa.webp", null, "A", "CC BY 4.0", "https://example.org/p", "", "",
            "hue-1-w480-bbbbbbbbbb.webp");
    private static final Photo EXTERNAL = new Photo(null, "https://images.unsplash.com/photo-1?w=800", "A", "Unsplash", "https://unsplash.com/photos/1");

    @Test
    @DisplayName("empty origin: photos are served by this application under /catalog/photos/")
    void localPrefixByDefault() {
        PhotoUrls urls = new PhotoUrls("");
        assertThat(urls.url(TWO_VARIANTS)).isEqualTo("/catalog/photos/hue-1-w1280-aaaaaaaaaa.webp");
        assertThat(urls.thumbUrl(TWO_VARIANTS)).isEqualTo("/catalog/photos/hue-1-w480-bbbbbbbbbb.webp");
        assertThat(new PhotoUrls(null).url(TWO_VARIANTS)).startsWith("/catalog/photos/");
    }

    @Test
    @DisplayName("origin set: local photos move to the origin (flat keys); external photos are untouched")
    void originOverridesLocalOnly() {
        for (String base : new String[] {"https://photos.example.com", "https://photos.example.com/", " https://photos.example.com "}) {
            PhotoUrls urls = new PhotoUrls(base);
            assertThat(urls.url(TWO_VARIANTS)).as(base).isEqualTo("https://photos.example.com/hue-1-w1280-aaaaaaaaaa.webp");
            assertThat(urls.srcSet(TWO_VARIANTS)).as(base)
                    .isEqualTo("https://photos.example.com/hue-1-w480-bbbbbbbbbb.webp 480w, https://photos.example.com/hue-1-w1280-aaaaaaaaaa.webp 1280w");
        }
        assertThat(new PhotoUrls("https://cdn.example.com/wander").url(TWO_VARIANTS)).isEqualTo("https://cdn.example.com/wander/hue-1-w1280-aaaaaaaaaa.webp");
        assertThat(new PhotoUrls("https://photos.example.com").url(EXTERNAL)).isEqualTo("https://images.unsplash.com/photo-1?w=800");
        assertThat(new PhotoUrls("https://photos.example.com").thumbUrl(EXTERNAL)).isNull();
        assertThat(new PhotoUrls("https://photos.example.com").srcSet(EXTERNAL)).isNull();
    }

    @ParameterizedTest
    @DisplayName("an unsafe or malformed origin stops startup instead of leaking into responses")
    @ValueSource(strings = {"http://photos.example.com", "//photos.example.com", "photos.example.com", "https://user:pw@photos.example.com",
            "https://photos.example.com?x=1", "https://photos.example.com#f", "javascript:alert(1)", "https://", "https://photo s.example.com"})
    void rejectsInvalidOrigin(String base) {
        assertThatThrownBy(() -> new PhotoUrls(base)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("photo-base-url");
    }

    @Test
    @DisplayName("srcset needs both variants with widths in their names")
    void srcSetOnlyWhenBothWidthsKnown() {
        Photo legacyNames = new Photo("a.jpg", null, "A", "CC BY 4.0", "https://example.org/p", "", "", "a-thumb.jpg");
        assertThat(new PhotoUrls("").srcSet(legacyNames)).isNull();
        assertThat(new PhotoUrls("").thumbUrl(legacyNames)).isEqualTo("/catalog/photos/a-thumb.jpg");
    }
}
