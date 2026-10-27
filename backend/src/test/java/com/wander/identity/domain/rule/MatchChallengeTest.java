package com.wander.identity.domain.rule;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Thử thách số khớp (DR-018 E1): một số thật hai chữ số cùng hai số nhiễu, xáo trộn, cố định sau khi tạo. */
class MatchChallengeTest {

    @Test
    @DisplayName("sinh ngẫu nhiên: ba số khác nhau, đều hai chữ số, có chứa số thật")
    void randomChallengeIsWellFormed() {
        for (int i = 0; i < 500; i++) {
            MatchChallenge challenge = MatchChallenge.random();
            assertThat(challenge.number()).isBetween(10, 99);
            assertThat(challenge.options()).hasSize(3).doesNotHaveDuplicates().contains(challenge.number()).allMatch(n -> n >= 10 && n <= 99);
        }
    }

    @Test
    @DisplayName("vị trí của số thật trong các lựa chọn được xáo trộn (không luôn ở một chỗ)")
    void realNumberPositionVaries() {
        Set<Integer> positions = new HashSet<>();
        for (int i = 0; i < 300; i++) {
            MatchChallenge challenge = MatchChallenge.random();
            positions.add(challenge.options().indexOf(challenge.number()));
        }
        assertThat(positions).containsExactlyInAnyOrder(0, 1, 2);
    }

    @Test
    @DisplayName("lưu rồi dựng lại cho đúng cùng thứ tự; chỉ số thật khớp, số nhiễu không khớp")
    void roundTripAndMatching() {
        MatchChallenge challenge = MatchChallenge.random();
        MatchChallenge restored = MatchChallenge.of(challenge.number(), challenge.optionsText());
        assertThat(restored).isEqualTo(challenge);
        assertThat(restored.matches(challenge.number())).isTrue();
        for (int decoy : challenge.options()) {
            if (decoy != challenge.number()) assertThat(restored.matches(decoy)).isFalse();
        }
        assertThat(restored.matches(7)).isFalse();
    }

    @Test
    @DisplayName("dữ liệu hỏng bị từ chối: số ngoài khoảng, lựa chọn trùng/thiếu/không chứa số thật, chuỗi lưu sai dạng")
    void invalidChallengesAreRejected() {
        assertThatThrownBy(() -> new MatchChallenge(9, List.of(9, 20, 30))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new MatchChallenge(100, List.of(100, 20, 30))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new MatchChallenge(50, List.of(50, 50, 30))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new MatchChallenge(50, List.of(50, 30))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new MatchChallenge(50, List.of(10, 20, 30))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> MatchChallenge.of(50, "50,abc,30")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> MatchChallenge.of(50, "")).isInstanceOf(IllegalArgumentException.class);
        assertThat(new MatchChallenge(50, List.of(30, 50, 99)).optionsText()).isEqualTo("30,50,99");
    }
}
