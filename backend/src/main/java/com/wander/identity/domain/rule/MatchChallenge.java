package com.wander.identity.domain.rule;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.constant.IdentityMessages;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Thử thách "số khớp" (DR-018 E1): máy mới (hoặc máy đang xin xác thực lại) hiện {@link #number()}; máy duyệt thấy
 * {@link #options()} (số thật cộng các số nhiễu, đã xáo trộn) và phải chọn đúng số thật. Các lựa chọn được CỐ ĐỊNH lúc tạo
 * và lưu lại: nếu sinh lại mỗi lần xem thì ai xem nhiều lần sẽ lộ số thật là số xuất hiện ở mọi lần (phép giao).
 */
public record MatchChallenge(int number, List<Integer> options) {

    private static final SecureRandom RANDOM = new SecureRandom();

    public MatchChallenge {
        options = List.copyOf(options);
        require(inRange(number), IdentityMessages.MATCH_NUMBER_OUT_OF_RANGE);
        require(options.size() == IdentityConstants.MATCH_OPTION_COUNT, IdentityMessages.MATCH_OPTIONS_COUNT);
        require(options.stream().allMatch(MatchChallenge::inRange), IdentityMessages.MATCH_NUMBER_OUT_OF_RANGE);
        require(new LinkedHashSet<>(options).size() == options.size(), IdentityMessages.MATCH_OPTIONS_DUPLICATED);
        require(options.contains(number), IdentityMessages.MATCH_OPTIONS_MISSING_REAL);
    }

    /** Sinh thử thách mới: số thật ngẫu nhiên cộng số nhiễu khác nhau, xáo trộn bằng bộ sinh mạnh. */
    public static MatchChallenge random() {
        Set<Integer> picked = new LinkedHashSet<>();
        while (picked.size() < IdentityConstants.MATCH_OPTION_COUNT) picked.add(randomNumber());
        List<Integer> options = new ArrayList<>(picked);
        int number = options.get(0);
        Collections.shuffle(options, RANDOM);
        return new MatchChallenge(number, options);
    }

    /** Dựng lại thử thách đã lưu từ số thật và chuỗi lựa chọn (giữ nguyên thứ tự); chuỗi sai dạng thì ném lỗi. */
    public static MatchChallenge of(int number, String optionsText) {
        try {
            List<Integer> options = Arrays.stream(optionsText.split(IdentityConstants.MATCH_OPTIONS_SEPARATOR))
                    .map(text -> Integer.parseInt(text.trim())).toList();
            return new MatchChallenge(number, options);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(IdentityMessages.MATCH_OPTIONS_UNREADABLE.formatted(optionsText), e);
        }
    }

    /** Các lựa chọn dạng chuỗi để lưu một cột, giữ thứ tự. */
    public String optionsText() {
        return String.join(IdentityConstants.MATCH_OPTIONS_SEPARATOR, options.stream().map(String::valueOf).toList());
    }

    /** Số người duyệt chọn có phải số thật không. */
    public boolean matches(int chosen) {
        return chosen == number;
    }

    /** Số ngẫu nhiên hai chữ số. */
    private static int randomNumber() {
        return IdentityConstants.MATCH_NUMBER_MIN + RANDOM.nextInt(IdentityConstants.MATCH_NUMBER_MAX - IdentityConstants.MATCH_NUMBER_MIN + 1);
    }

    /** Số nằm trong khoảng hai chữ số. */
    private static boolean inRange(int value) {
        return value >= IdentityConstants.MATCH_NUMBER_MIN && value <= IdentityConstants.MATCH_NUMBER_MAX;
    }

    /** Ném lỗi dữ liệu nếu điều kiện sai. */
    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalArgumentException(message);
    }
}
