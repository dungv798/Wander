package com.wander.planning.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.planning.domain.constant.CoverConstants;
import com.wander.shared.kernel.error.WanderException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Bìa chỉ giữ mã, không giữ URL hay dữ liệu ảnh tải lên (DR-031). */
class CoverTest {
    /** Sáu gradient là tập đóng, đồng nhất với giao diện. */
    @Test
    @DisplayName("chấp nhận đúng sáu mã gradient và mã ảnh dạng slug")
    void acceptsApprovedReferences() {
        assertThat(CoverConstants.GRADIENT_REFS).hasSize(6);
        for (String ref : CoverConstants.GRADIENT_REFS) {
            assertThat(new Cover("gradient", ref).ref()).isEqualTo(ref);
        }
        assertThat(new Cover("photo", "ho-tuyen-lam-1").kind()).isEqualTo("photo");
        // Planning không phụ thuộc catalog: domain chỉ kiểm dạng; FE chỉ gửi mã ảnh catalog của điểm đến.
        assertThat(new Cover("photo", "catalog-slug-chua-ton-tai").ref()).isEqualTo("catalog-slug-chua-ton-tai");
    }

    /** Mọi dữ liệu không hợp lệ bị chặn ngay tại bộ dựng. */
    @Test
    @DisplayName("từ chối mã gradient lạ, URL, đường dẫn, slug sai và trường rỗng")
    void rejectsInvalidCover() {
        for (String ref : new String[] {"cover-7", "", "https://example.com/a.jpg"}) {
            assertThatThrownBy(() -> new Cover("gradient", ref)).isInstanceOf(WanderException.class);
        }
        for (String ref : new String[] {"", "../a", "a.jpg", "UPPER", "a--b", "-a", "a-", "a".repeat(121)}) {
            assertThatThrownBy(() -> new Cover("photo", ref)).isInstanceOf(WanderException.class);
        }
        assertThatThrownBy(() -> new Cover("upload", "a")).isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> new Cover(null, "a")).isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> new Cover("photo", null)).isInstanceOf(WanderException.class);
    }
}
