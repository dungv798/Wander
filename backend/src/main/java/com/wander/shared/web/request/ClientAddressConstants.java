package com.wander.shared.web.request;

/** Constants specific to the feature that gets the caller's address ({@link ClientAddress}). */
final class ClientAddressConstants {

    /** IPv4 as four decimal groups, each 1-3 digits. */
    static final String IPV4_REGEX = "^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$";

    /** Textual IPv6: at least two colons, only hex, ':' and '.' (embedded IPv4); no port or brackets. */
    static final String IPV6_REGEX = "^(?=(?:[^:]*:){2})[0-9a-fA-F:.]{3,45}$";

    /** The number of groups of an IPv4 address. */
    static final int IPV4_GROUP_COUNT = 4;

    /** The largest value of an IPv4 group. */
    static final int IPV4_GROUP_MAX = 255;

    /** The group separator of a textual IPv6. */
    static final String IPV6_SEPARATOR = ":";

    /** The number of bytes of an IPv6 address. */
    static final int IPV6_BYTE_COUNT = 16;

    /** The number of leading bytes kept when folding IPv6 to its /64 prefix. */
    static final int IPV6_PREFIX_BYTES = 8;

    /** The suffix that marks a folded key, so it does not clash with an IPv4 or a full IPv6 address. */
    static final String IPV6_PREFIX_SUFFIX = "/64";

    /** Programming error: a negative number of trusted proxies. */
    static final String TRUSTED_HOPS_NEGATIVE_MESSAGE = "trustedHops phải >= 0";

    private ClientAddressConstants() {
    }
}
