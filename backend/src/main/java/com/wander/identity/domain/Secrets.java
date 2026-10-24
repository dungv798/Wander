package com.wander.identity.domain;

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

    public static final String ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    /** 30 ký hiệu × 5 bit = 150 bit; mã tự chứa đủ thông tin để tìm danh tính (MĐ-8). */
    public static final int RECOVERY_CODE_SYMBOLS = 30;
    public static final int SHORT_CODE_SYMBOLS = 8;

    /** Bí mật phiên do bên giữ phiên tự sinh (≥ 256 bit, base64url). */
    public static final Pattern SESSION_TOKEN = Pattern.compile("^[A-Za-z0-9_-]{43,128}$");
    public static final Pattern ATTEMPT_KEY = Pattern.compile("^[A-Za-z0-9_-]{16,128}$");

    private static final SecureRandom RANDOM = new SecureRandom();

    private Secrets() {
    }

    /** Bí mật phiên mới: 32 byte ngẫu nhiên (256 bit), base64url không đệm. */
    public static String newSessionToken() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    public static String hashToken(String token) {
        return sha256Hex(token);
    }

    public static String hashRecoveryCode(String normalized) {
        return sha256Hex("wander-recovery-v1:" + normalized);
    }

    /** Mã khôi phục hiển thị: 6 nhóm × 5 ký hiệu, ví dụ {@code 7K2QF-...}. */
    public static String newRecoveryCode() {
        String s = randomSymbols(RECOVERY_CODE_SYMBOLS);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < s.length(); i += 5) {
            if (i > 0) out.append('-');
            out.append(s, i, i + 5);
        }
        return out.toString();
    }

    /** Mã ngắn dùng một lần (ghép thiết bị, phê duyệt xác thực lại): {@code XXXX-XXXX}. */
    public static String newShortCode() {
        String s = randomSymbols(SHORT_CODE_SYMBOLS);
        return s.substring(0, 4) + "-" + s.substring(4);
    }

    public static String formatShort(String normalized) {
        return normalized.substring(0, 4) + "-" + normalized.substring(4);
    }

    /**
     * Chuẩn hóa mã người dùng nhập: bỏ khoảng trắng và gạch, chữ hoa, O→0, I/L→1.
     *
     * @return chuỗi đúng {@code symbols} ký hiệu hợp lệ, hoặc null nếu không phải mã
     */
    public static String normalize(Object input, int symbols) {
        if (!(input instanceof String raw) || raw.length() > 80) return null;
        String s = raw.toUpperCase(Locale.ROOT).replaceAll("[\\s-]", "").replace('O', '0').replace('I', '1').replace('L', '1');
        if (s.length() != symbols) return null;
        for (int i = 0; i < s.length(); i++) if (ALPHABET.indexOf(s.charAt(i)) < 0) return null;
        return s;
    }

    private static String randomSymbols(int n) {
        byte[] b = new byte[n];
        RANDOM.nextBytes(b);
        StringBuilder s = new StringBuilder(n);
        for (byte x : b) s.append(ALPHABET.charAt(x & 31)); // 256 chia hết cho 32 nên phân bố đều
        return s.toString();
    }

    private static String sha256Hex(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
