package com.wander.shared.web.request;

import com.wander.shared.kernel.constant.CommonConstants;
import com.wander.shared.web.constant.HttpConstants;
import jakarta.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The caller's address for rate limiting (AD-6, ADR-006). Behind CloudFront -> ALB the direct connection address is the
 * ALB's, so everyone shares one counter; and if the raw {@code X-Forwarded-For} were trusted an attacker could choose their own address.
 * <p>
 * The approach: trust only the entries our own infrastructure adds on the RIGHT of {@code X-Forwarded-For}. Each trusted proxy
 * (CloudFront, ALB) appends the address it sees to the end of the list, so with {@code trustedHops = N} the real caller is the Nth entry
 * from the right; every entry to its left was sent by the caller and is ignored.
 * <ul>
 *   <li>{@code trustedHops = 0} (the default, running directly without a proxy): {@code X-Forwarded-For} is ignored entirely.</li>
 *   <li>A list shorter than {@code trustedHops} (the request did not go through the whole proxy chain, for example a call straight to the ALB): not trusted,
 *       the direct connection address is used, so every request that bypasses the chain lands in one shared counter (closed by default).</li>
 *   <li>An entry that does not look like an IP address: not trusted, the direct connection address is used (so a counter cannot be locked by an arbitrary string).</li>
 * </ul>
 * It must be combined with only letting the ALB accept traffic from CloudFront (infrastructure); see ADR-006.
 */
public final class ClientAddress {

    private static final Pattern IPV4 = Pattern.compile(ClientAddressConstants.IPV4_REGEX);
    private static final Pattern IPV6 = Pattern.compile(ClientAddressConstants.IPV6_REGEX);

    private final int trustedHops;

    /** Creates the address resolver with the number of trusted proxies (not negative). */
    public ClientAddress(int trustedHops) {
        if (trustedHops < 0) throw new IllegalArgumentException(ClientAddressConstants.TRUSTED_HOPS_NEGATIVE_MESSAGE);
        this.trustedHops = trustedHops;
    }

    /** The most trustworthy address of the caller of the request; if none can be trusted the direct connection address is used. */
    public String of(HttpServletRequest request) {
        return groupIpv6Prefix(trustedAddress(request));
    }

    /** The most trustworthy address before folding the IPv6 prefix. */
    private String trustedAddress(HttpServletRequest request) {
        String direct = request.getRemoteAddr();
        if (trustedHops == 0) return direct;
        List<String> chain = forwardedChain(request);
        if (chain.size() < trustedHops) return direct;
        String candidate = chain.get(chain.size() - trustedHops);
        return isAddress(candidate) ? candidate : direct;
    }

    /**
     * Folds an IPv6 address to its /64 prefix (a subscriber is usually given a whole /64 so each address cannot be treated as one person);
     * IPv4, IPv4 embedded in IPv6 and strings that cannot be parsed are kept as they are.
     */
    static String groupIpv6Prefix(String address) {
        if (!address.contains(ClientAddressConstants.IPV6_SEPARATOR) || !IPV6.matcher(address).matches()) return address;
        try {
            // The string has already matched the pattern and has only hex, ':' and '.', so getByName does no DNS lookup.
            byte[] bytes = InetAddress.getByName(address).getAddress();
            if (bytes.length != ClientAddressConstants.IPV6_BYTE_COUNT) return address;
            return HexFormat.of().formatHex(bytes, 0, ClientAddressConstants.IPV6_PREFIX_BYTES) + ClientAddressConstants.IPV6_PREFIX_SUFFIX;
        } catch (UnknownHostException e) {
            return address;
        }
    }

    /** Whether the string has exactly the form of an IPv4 address (each group at most 255) or a textual IPv6 address. */
    private static boolean isAddress(String text) {
        Matcher v4 = IPV4.matcher(text);
        if (v4.matches()) return hasValidIpv4Groups(v4);
        return IPV6.matcher(text).matches();
    }

    /** Every group of an IPv4 address that matched the pattern does not exceed the largest value. */
    private static boolean hasValidIpv4Groups(Matcher ipv4) {
        for (int group = 1; group <= ClientAddressConstants.IPV4_GROUP_COUNT; group++) {
            if (Integer.parseInt(ipv4.group(group)) > ClientAddressConstants.IPV4_GROUP_MAX) return false;
        }
        return true;
    }

    /** The entries of X-Forwarded-For (across all headers with that name) from left to right, with empty entries removed. */
    private static List<String> forwardedChain(HttpServletRequest request) {
        List<String> chain = new ArrayList<>();
        Enumeration<String> headers = request.getHeaders(HttpConstants.HEADER_X_FORWARDED_FOR);
        while (headers != null && headers.hasMoreElements()) {
            addNonEmptyEntries(chain, headers.nextElement());
        }
        return chain;
    }

    /** Splits a header value on commas and adds the non-empty entries to the list. */
    private static void addNonEmptyEntries(List<String> chain, String headerValue) {
        for (String part : headerValue.split(CommonConstants.COMMA)) {
            String entry = part.trim();
            if (!entry.isEmpty()) chain.add(entry);
        }
    }
}
