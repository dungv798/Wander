package com.wander.identity.infrastructure.persistence.constant;

/** Storage constants of Identity (FEATURE tier): state values stored in lowercase in the database. */
public final class IdentityPersistenceConstants {

    /** The pending state (attempt, replacement code, pairing request, re-authentication request). */
    public static final String STATE_PENDING = "pending";

    /** The voided state of a replacement code. */
    public static final String STATE_VOID = "void";

    /** The approved state of a re-authentication request. */
    public static final String STATE_APPROVED = "approved";

    private IdentityPersistenceConstants() {
    }
}
