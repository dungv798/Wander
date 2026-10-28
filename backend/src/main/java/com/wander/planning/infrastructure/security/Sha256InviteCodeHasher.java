package com.wander.planning.infrastructure.security;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.port.InviteCodeHasher;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Mã mời là 256 bit từ {@link SecureRandom} (base64url, 43 ký tự). Entropy này đủ cao để băm SHA-256 thường (không cần khóa/pepper) là an toàn:
 * không thể dò ngược hay đoán. Băm có tiền tố riêng để không trùng miền với băm khác.
 */
@Component
public class Sha256InviteCodeHasher implements InviteCodeHasher {

    private static final Pattern WELL_FORMED = Pattern.compile(PlanningConstants.INVITE_CODE_REGEX);
    private final SecureRandom random = new SecureRandom();

    @Override
    public String newCode() {
        byte[] bytes = new byte[PlanningConstants.INVITE_CODE_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Override
    public boolean isWellFormed(String code) {
        return code != null && WELL_FORMED.matcher(code).matches();
    }

    @Override
    public String hash(String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance(PlanningConstants.INVITE_HASH_ALGORITHM);
            return HexFormat.of().formatHex(digest.digest((PlanningConstants.INVITE_HASH_PREFIX + code).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
