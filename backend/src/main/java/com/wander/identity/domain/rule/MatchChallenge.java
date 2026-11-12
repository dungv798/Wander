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
 * The 'matching number' challenge (DR-018 E1): the new device (or the device asking for re-authentication) shows {@link #number()}; the approving device sees
 * {@link #options()} (the real number plus decoys, shuffled) and must pick the real number. The choices are FIXED at creation
 * and stored: if they were regenerated on every view, anyone who looked several times would reveal the real number as the one that appears every time (an intersection attack).
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

    /** Generates a new challenge: a random real number plus distinct decoys, shuffled with a strong generator. */
    public static MatchChallenge random() {
        Set<Integer> picked = new LinkedHashSet<>();
        while (picked.size() < IdentityConstants.MATCH_OPTION_COUNT) picked.add(randomNumber());
        List<Integer> options = new ArrayList<>(picked);
        int number = options.get(0);
        Collections.shuffle(options, RANDOM);
        return new MatchChallenge(number, options);
    }

    /** Rebuilds a stored challenge from the real number and the string of choices (order preserved); a malformed string throws. */
    public static MatchChallenge of(int number, String optionsText) {
        try {
            List<Integer> options = Arrays.stream(optionsText.split(IdentityConstants.MATCH_OPTIONS_SEPARATOR))
                    .map(text -> Integer.parseInt(text.trim())).toList();
            return new MatchChallenge(number, options);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(IdentityMessages.MATCH_OPTIONS_UNREADABLE.formatted(optionsText), e);
        }
    }

    /** The choices as a string for storing in one column, order preserved. */
    public String optionsText() {
        return String.join(IdentityConstants.MATCH_OPTIONS_SEPARATOR, options.stream().map(String::valueOf).toList());
    }

    /** Whether the number the approver chose is the real number. */
    public boolean matches(int chosen) {
        return chosen == number;
    }

    /** A random two-digit number. */
    private static int randomNumber() {
        return IdentityConstants.MATCH_NUMBER_MIN + RANDOM.nextInt(IdentityConstants.MATCH_NUMBER_MAX - IdentityConstants.MATCH_NUMBER_MIN + 1);
    }

    /** The number is within the two-digit range. */
    private static boolean inRange(int value) {
        return value >= IdentityConstants.MATCH_NUMBER_MIN && value <= IdentityConstants.MATCH_NUMBER_MAX;
    }

    /** Throws a data error if the condition is false. */
    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalArgumentException(message);
    }
}
