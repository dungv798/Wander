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
 * An invite code is 256 bits from {@link SecureRandom} (base64url, 43 characters). That entropy is high enough that a plain SHA-256 hash (no key/pepper) is safe:
 * it cannot be reversed or guessed. The hash has its own prefix so it does not share a domain with other hashes.
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
