package com.wander.planning.domain.port;

/** Generates and hashes invite-link codes. A code is a random 256-bit secret shown only once; the server keeps only the hash. */
public interface InviteCodeHasher {

    /** A new code (random enough, safe to use in a URL). */
    String newCode();

    /** Is the code well-formed? A wrong shape needs no hashing and counts as an invalid link. */
    boolean isWellFormed(String code);

    /** The hash of the code (hex), used for storing and matching. */
    String hash(String code);
}
