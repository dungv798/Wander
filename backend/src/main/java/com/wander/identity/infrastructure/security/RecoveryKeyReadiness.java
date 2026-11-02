package com.wander.identity.infrastructure.security;

import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.port.RecoveryCodeHasher;
import com.wander.identity.infrastructure.persistence.repository.RecoveryCodeJpaRepository;
import com.wander.shared.kernel.constant.ConfigConstants;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Kiểm tra dữ liệu sau Flyway và trước khi nhận traffic: không được bỏ khóa mà mã đang hiệu lực vẫn cần. */
@Component
@Profile(ConfigConstants.FREE_PROFILE)
public class RecoveryKeyReadiness implements ApplicationRunner {

    private final RecoveryCodeJpaRepository codes;
    private final RecoveryCodeHasher hasher;

    /** Nhận truy vấn metadata và bộ khóa; không cần đọc mã plaintext hoặc in secret. */
    public RecoveryKeyReadiness(RecoveryCodeJpaRepository codes, RecoveryCodeHasher hasher) {
        this.codes = codes;
        this.hasher = hasher;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        if (!hasher.keyVersions().containsAll(codes.findRequiredKeyVersions())) {
            throw new IllegalStateException(IdentityMessages.RECOVERY_KEY_STILL_REQUIRED);
        }
    }
}
