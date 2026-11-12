package com.wander.planning.api.request;

/**
 * Body of the "mark as done" endpoints (trip items and checklist items): ticks or unticks for the calling member only.
 *
 * @param done true to tick, false to untick; anything else is {@code MALFORMED}
 */
public record DoneRequest(Boolean done) {
}
