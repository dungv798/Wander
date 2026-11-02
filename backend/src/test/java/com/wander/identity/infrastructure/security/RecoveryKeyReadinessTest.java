package com.wander.identity.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.wander.identity.infrastructure.persistence.repository.RecoveryCodeJpaRepository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Không cho deploy khi bỏ khóa cũ mà dữ liệu hoặc mã chờ vẫn cần khóa đó. */
class RecoveryKeyReadinessTest {

    private static final String PEPPER = "test-only-pepper-for-readiness-0123456789";

    @Test
    @DisplayName("khóa đang dùng đủ thì startup tiếp tục, DB trống không bắt giữ khóa không cần")
    void allRequiredKeysAreAvailable() {
        var codes = mock(RecoveryCodeJpaRepository.class);
        when(codes.findRequiredKeyVersions()).thenReturn(List.of("v1", "v2"));
        var hasher = new HmacRecoveryCodeHasher(PEPPER + "new", "v2", "v1", PEPPER);
        assertThatCode(() -> new RecoveryKeyReadiness(codes, hasher).run(null)).doesNotThrowAnyException();
        when(codes.findRequiredKeyVersions()).thenReturn(List.of());
        assertThatCode(() -> new RecoveryKeyReadiness(codes, new HmacRecoveryCodeHasher(PEPPER)).run(null)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("bỏ khóa trước khi mã cũ được thay xong thì fail-fast, lời báo không chứa secret")
    void retiringARequiredKeyBlocksDeployment() {
        var codes = mock(RecoveryCodeJpaRepository.class);
        when(codes.findRequiredKeyVersions()).thenReturn(List.of("v1"));
        var currentOnly = new HmacRecoveryCodeHasher(PEPPER, "v2", "", "");
        assertThatThrownBy(() -> new RecoveryKeyReadiness(codes, currentOnly).run(null))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("Thiếu phiên bản khóa").hasMessageNotContaining(PEPPER);
    }
}
