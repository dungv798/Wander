package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.CoverConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.error.WanderException;

/**
 * An immutable trip cover, keeping only the kind and the code (DR-031); null on a trip is the automatic cover.
 * Planning checks only the photo slug shape, and does not look up the catalog, to keep the module boundary.
 * Limitation: the front end is responsible for sending only photo ids that really exist in the catalog of the trip's destination.
 */
public record Cover(String kind, String ref) {
    /** Validates the cover as soon as it is built: a gradient belongs to a fixed set, a photo accepts only a bounded slug. */
    public Cover {
        boolean validRef = ref != null && ref.length() <= CoverConstants.MAX_REF_LENGTH;
        boolean photo = CoverConstants.PHOTO.equals(kind) && validRef && ref.matches(CoverConstants.PHOTO_REF_PATTERN);
        boolean gradient = CoverConstants.GRADIENT.equals(kind) && validRef && CoverConstants.GRADIENT_REFS.contains(ref);
        if (!photo && !gradient) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_COVER, PlanningMessages.INVALID_COVER, PlanningFields.COVER);
        }
    }
}
