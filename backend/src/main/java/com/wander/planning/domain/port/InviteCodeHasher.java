package com.wander.planning.domain.port;

/** Sinh và băm mã liên kết mời. Mã là bí mật 256 bit ngẫu nhiên chỉ hiện một lần; máy chủ chỉ giữ băm. */
public interface InviteCodeHasher {

    /** Mã mới (đủ ngẫu nhiên, an toàn dùng trong URL). */
    String newCode();

    /** Mã đúng dạng? Sai dạng thì khỏi băm và coi như liên kết không hợp lệ. */
    boolean isWellFormed(String code);

    /** Băm của mã (hex), dùng để lưu và so khớp. */
    String hash(String code);
}
