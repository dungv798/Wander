package com.wander.rating.application.service;

import com.wander.rating.application.input.RatingInput;
import com.wander.rating.application.view.RatingViews;
import com.wander.rating.domain.constant.RatingConstants;
import com.wander.rating.domain.constant.RatingErrorCodes;
import com.wander.rating.domain.constant.RatingMessages;
import com.wander.rating.domain.model.PlaceComment;
import com.wander.rating.domain.model.PlaceRating;
import com.wander.rating.domain.model.RatingSummary;
import com.wander.rating.domain.port.RatingStore;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The use cases of Wander rating: view, rate (add or edit), delete one's own score, and report a comment. */
@Service
@Transactional
public class RatingService {

    private final RatingStore store;
    private final Clock clock;

    /** Takes the storage port and the clock. */
    public RatingService(RatingStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /** The rating of a venue: the aggregate score, the viewer's own score and the newest comments that are not hidden. */
    @Transactional(readOnly = true)
    public RatingViews.PlaceRatingView view(AuthenticatedPrincipal principal, String placeRefRaw) {
        String placeRef = RatingInput.placeRef(placeRefRaw);
        return buildView(principal.identityId(), placeRef);
    }

    /** Rates or edits the caller's score for a venue; each identity has at most one score per venue. */
    public RatingViews.PlaceRatingView rate(AuthenticatedPrincipal principal, String placeRefRaw, Integer starsRaw, String commentRaw) {
        String placeRef = RatingInput.placeRef(placeRefRaw);
        int stars = RatingInput.stars(starsRaw);
        String comment = RatingInput.comment(commentRaw);
        UUID identityId = principal.identityId();
        if (!store.exists(identityId, placeRef) && store.countByIdentity(identityId) >= RatingConstants.MAX_RATINGS_PER_IDENTITY) {
            throw WanderException.conflict(RatingErrorCodes.RATING_LIMIT_REACHED, RatingMessages.RATING_LIMIT_REACHED);
        }
        store.upsert(identityId, placeRef, stars, comment, Timestamps.now(clock));
        return buildView(identityId, placeRef);
    }

    /** Deletes the caller's score for a venue (nothing happens if there is no score). */
    public RatingViews.PlaceRatingView remove(AuthenticatedPrincipal principal, String placeRefRaw) {
        String placeRef = RatingInput.placeRef(placeRefRaw);
        store.delete(principal.identityId(), placeRef);
        return buildView(principal.identityId(), placeRef);
    }

    /**
     * Reports a comment. Once {@value RatingConstants#REPORT_HIDE_THRESHOLD} different people have reported it, the comment is hidden (the star score
     * still counts). An id that does not exist, or belongs to another venue => 404; reporting one's own comment => error.
     */
    public void report(AuthenticatedPrincipal principal, String placeRefRaw, String ratingIdRaw) {
        String placeRef = RatingInput.placeRef(placeRefRaw);
        PlaceRating rating = Ids.parse(ratingIdRaw).flatMap(store::findById)
                .filter(found -> found.placeRef().equals(placeRef) && found.comment() != null)
                .orElseThrow(WanderException::notFound);
        if (rating.identityId().equals(principal.identityId())) {
            throw WanderException.conflict(RatingErrorCodes.CANNOT_REPORT_OWN, RatingMessages.CANNOT_REPORT_OWN);
        }
        store.addReport(rating.id(), principal.identityId(), Timestamps.now(clock));
    }

    /** Combines the aggregate score, the viewer's score and the comments into one read model. */
    private RatingViews.PlaceRatingView buildView(UUID identityId, String placeRef) {
        RatingSummary summary = store.summary(placeRef);
        RatingViews.Mine mine = store.findMine(identityId, placeRef)
                .map(own -> new RatingViews.Mine(own.stars(), own.comment(), Timestamps.format(own.updatedAt()))).orElse(null);
        List<RatingViews.CommentView> comments = store.latestComments(placeRef, RatingConstants.COMMENTS_PAGE_SIZE).stream()
                .map(comment -> toCommentView(comment, identityId)).toList();
        return new RatingViews.PlaceRatingView(new RatingViews.Summary(roundAverage(summary.average()), summary.count()), mine, comments);
    }

    /** One comment from the viewer's point of view; the author's identity is not exposed. */
    private static RatingViews.CommentView toCommentView(PlaceComment comment, UUID viewerId) {
        return new RatingViews.CommentView(comment.ratingId().toString(), comment.stars(), comment.comment(),
                Timestamps.format(comment.updatedAt()), comment.identityId().equals(viewerId));
    }

    /** Rounds to one decimal place; null stays null. */
    private static Double roundAverage(Double average) {
        return average == null ? null : Math.round(average * RatingConstants.AVERAGE_ROUNDING_FACTOR) / RatingConstants.AVERAGE_ROUNDING_FACTOR;
    }
}
