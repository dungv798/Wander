package com.wander.identity.api.request;

/**
 * Body of {@code POST /api/recovery-code/begin} (phase 1 of creating or regenerating the recovery code). The body may be empty
 * when the identity has no recovery code yet; otherwise {@code evidence} is required.
 *
 * @param evidence proof of re-authentication
 */
public record BeginReplacementRequest(
        EvidenceBody evidence) {
}
