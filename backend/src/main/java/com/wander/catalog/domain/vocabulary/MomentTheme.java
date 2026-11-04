package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Chủ đề của một "khoảnh khắc" trong thư viện ảnh điểm đến (DR-034): ảnh minh họa không khí (chợ, món ăn, con người...),
 * không khẳng định đúng một địa điểm cụ thể. Mã lạ KHÔNG được chấp nhận: {@link #fromCode} trả rỗng và adapter từ chối tệp.
 */
public enum MomentTheme implements CodedValue {
    MARKET("cho", "Chợ & phố"),
    FOOD("mon-an", "Món ăn"),
    PEOPLE("nguoi", "Con người"),
    FESTIVAL("le-hoi", "Lễ hội & văn hóa"),
    CRAFT("nghe", "Nghề & đời sống");

    private final String code;
    private final String label;

    MomentTheme(String code, String label) {
        this.code = code;
        this.label = label;
    }

    @Override
    public String code() {
        return code;
    }

    /** Nhãn tiếng Việt hiển thị cho người dùng. */
    public String label() {
        return label;
    }

    /** Chủ đề theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<MomentTheme> fromCode(String code) {
        return CodedValue.find(MomentTheme.class, code);
    }
}
