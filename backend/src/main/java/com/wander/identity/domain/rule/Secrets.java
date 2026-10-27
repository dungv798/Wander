package com.wander.identity.domain.rule;

import com.wander.identity.domain.constant.IdentityConstants;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Bí mật và mã của danh tính (D15, D20–D26; bản thiết kế docs/autopilot/q16-design-draft.md — RG-1: CHƯA DUYỆT).
 * Server chỉ lưu băm; mã khôi phục dùng bảng chữ Crockford base32 (không có I, L, O, U) để đọc/chép tay ít nhầm.
 */
public final class Secrets {

    /** Dạng hợp lệ của bí mật phiên do bên giữ phiên tự sinh (từ 256 bit, base64url). */
    public static final Pattern SESSION_TOKEN = Pattern.compile(IdentityConstants.SESSION_TOKEN_REGEX);

    /** Dạng hợp lệ của mã nhận diện một lần thử khôi phục. */
    public static final Pattern ATTEMPT_KEY = Pattern.compile(IdentityConstants.ATTEMPT_KEY_REGEX);

    private static final Pattern CODE_NOISE = Pattern.compile(IdentityConstants.CODE_NOISE_REGEX);
    private static final SecureRandom RANDOM = new SecureRandom();

    private Secrets() {
    }

    /** Bí mật phiên mới: 32 byte ngẫu nhiên (256 bit), base64url không đệm. */
    public static String newSessionToken() {
        byte[] bytes = new byte[IdentityConstants.SESSION_TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Băm SHA-256 (hex) của bí mật phiên; server chỉ lưu băm. */
    public static String hashToken(String token) {
        return sha256Hex(token);
    }

    /** Mã khôi phục hiển thị: 6 nhóm × 5 ký hiệu, ví dụ {@code 7K2QF-...}. */
    public static String newRecoveryCode() {
        String symbols = randomSymbols(IdentityConstants.RECOVERY_CODE_SYMBOLS);
        StringBuilder out = new StringBuilder();
        int groupSize = IdentityConstants.CODE_GROUP_SIZE;
        for (int start = 0; start < symbols.length(); start += groupSize) {
            if (start > 0) out.append(IdentityConstants.CODE_GROUP_SEPARATOR);
            out.append(symbols, start, start + groupSize);
        }
        return out.toString();
    }

    /** Mã ngắn dùng một lần (ghép thiết bị, phê duyệt xác thực lại): {@code XXXX-XXXX}. */
    public static String newShortCode() {
        return formatShort(randomSymbols(IdentityConstants.SHORT_CODE_SYMBOLS));
    }

    /** Dạng hiển thị {@code XXXX-XXXX} của mã ngắn đã chuẩn hóa. */
    public static String formatShort(String normalized) {
        int half = IdentityConstants.SHORT_CODE_HALF_LENGTH;
        return normalized.substring(0, half) + IdentityConstants.CODE_GROUP_SEPARATOR + normalized.substring(half);
    }

    /**
     * Chuẩn hóa mã người dùng nhập: bỏ khoảng trắng và gạch, chữ hoa, O→0, I/L→1.
     *
     * @return chuỗi đúng {@code symbols} ký hiệu hợp lệ, hoặc null nếu không phải mã
     */
    public static String normalize(Object input, int symbols) {
        if (!(input instanceof String raw) || raw.length() > IdentityConstants.MAX_CODE_INPUT_LENGTH) return null;
        String upper = raw.toUpperCase(Locale.ROOT);
        String cleaned = CODE_NOISE.matcher(upper).replaceAll("").replace('O', '0').replace('I', '1').replace('L', '1');
        return cleaned.length() == symbols && allSymbolsValid(cleaned) ? cleaned : null;
    }

    /** Mọi ký tự đều nằm trong bảng chữ của mã. */
    private static boolean allSymbolsValid(String text) {
        return text.chars().allMatch(symbol -> IdentityConstants.CODE_ALPHABET.indexOf(symbol) >= 0);
    }

    /** Chuỗi ngẫu nhiên gồm {@code count} ký hiệu từ bảng chữ của mã. */
    private static String randomSymbols(int count) {
        byte[] bytes = new byte[count];
        RANDOM.nextBytes(bytes);
        StringBuilder symbols = new StringBuilder(count);
        for (byte value : bytes) symbols.append(IdentityConstants.CODE_ALPHABET.charAt(value & IdentityConstants.SYMBOL_BIT_MASK));
        return symbols.toString();
    }

    /** SHA-256 của chuỗi UTF-8, dạng hex chữ thường. */
    private static String sha256Hex(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance(IdentityConstants.HASH_ALGORITHM);
            return HexFormat.of().formatHex(digest.digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
