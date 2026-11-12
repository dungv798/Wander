package com.wander.identity.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Kind of event in 'Recent activity' (BE-11). {@link #raisesAlert()} says whether the event raises the 'unseen' flag: only when a NEW device
 * is added (pairing or recovery), because that is what the owner needs to know in order to revoke it if it was not them.
 */
public enum EventKind implements CodedValue {
    CREATED("created", false),
    CODE("code", false),
    PAIRED("paired", true),
    REVOKED("revoked", false),
    RECOVERED("recovered", true);

    private final String code;
    private final boolean raisesAlert;

    EventKind(String code, boolean raisesAlert) {
        this.code = code;
        this.raisesAlert = raisesAlert;
    }

    @Override
    public String code() {
        return code;
    }

    /** Whether this event raises the 'unseen' flag. */
    public boolean raisesAlert() {
        return raisesAlert;
    }

    /** The kind by its code in the data; an unknown code returns empty. */
    public static Optional<EventKind> fromCode(String code) {
        return CodedValue.find(EventKind.class, code);
    }
}
