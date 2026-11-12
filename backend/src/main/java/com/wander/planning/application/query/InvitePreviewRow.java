package com.wander.planning.application.query;

/** Preview of an invite link that is still usable: only the trip name and the member count (a deliberate acceptance, T13). */
public record InvitePreviewRow(String tripName, long memberCount) {
}
