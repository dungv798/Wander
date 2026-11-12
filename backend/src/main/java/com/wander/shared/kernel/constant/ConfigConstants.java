package com.wander.shared.kernel.constant;

/**
 * Application configuration keys (SYSTEM tier). The {@code ${...}} expressions are used with {@code @Value}; the default after the colon
 * must match {@code application.yml}. A single place to rename a key.
 */
public final class ConfigConstants {

    /** The profile for the free cloud container, with a key-metadata check before it accepts traffic. */
    public static final String FREE_PROFILE = "free";

    /** Configuration prefix of the rate limits. */
    public static final String LIMITS_PREFIX = "wander.limits";

    /** The built UI directory; empty = API only. */
    public static final String WEB_DIR_EXPRESSION = "${wander.web.dir:}";

    /** The number of trusted proxies in front of the application; 0 = ignore X-Forwarded-For. */
    public static final String TRUSTED_PROXY_HOPS_EXPRESSION = "${wander.web.trusted-proxy-hops:0}";

    private ConfigConstants() {
    }
}
