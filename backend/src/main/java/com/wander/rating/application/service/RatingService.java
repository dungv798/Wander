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

/** Các use case của rating Wander: xem, chấm (thêm hoặc sửa), xóa điểm của mình và báo cáo lời bình. */
@Service
@Transactional
public class RatingService {

    private final RatingStore store;
    private final Clock clock;

    /** Nhận cổng lưu trữ và đồng hồ. */
    public RatingService(RatingStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /** Rating của quán: điểm tổng hợp, điểm của người xem và các lời bình mới nhất chưa bị ẩn. */
    @Transactional(readOnly = true)
    public RatingViews.PlaceRatingView view(AuthenticatedPrincipal principal, String placeRefRaw) {
        String placeRef = RatingInput.placeRef(placeRefRaw);
        return buildView(principal.identityId(), placeRef);
    }

    /** Chấm hoặc sửa điểm của người gọi cho quán; mỗi danh tính tối đa một điểm cho mỗi quán. */
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

    /** Xóa điểm của người gọi cho quán (không có điểm thì không làm gì). */
    public RatingViews.PlaceRatingView remove(AuthenticatedPrincipal principal, String placeRefRaw) {
        String placeRef = RatingInput.placeRef(placeRefRaw);
        store.delete(principal.identityId(), placeRef);
        return buildView(principal.identityId(), placeRef);
    }

    /**
     * Báo cáo một lời bình. Đủ {@value RatingConstants#REPORT_HIDE_THRESHOLD} người báo cáo khác nhau thì lời bình bị ẩn (điểm sao
     * vẫn tính). Mã không tồn tại, hoặc thuộc quán khác ⇒ 404; lời bình của chính mình ⇒ lỗi.
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

    /** Ghép điểm tổng hợp, điểm của người xem và lời bình thành một read model. */
    private RatingViews.PlaceRatingView buildView(UUID identityId, String placeRef) {
        RatingSummary summary = store.summary(placeRef);
        RatingViews.Mine mine = store.findMine(identityId, placeRef)
                .map(own -> new RatingViews.Mine(own.stars(), own.comment(), Timestamps.format(own.updatedAt()))).orElse(null);
        List<RatingViews.CommentView> comments = store.latestComments(placeRef, RatingConstants.COMMENTS_PAGE_SIZE).stream()
                .map(comment -> toCommentView(comment, identityId)).toList();
        return new RatingViews.PlaceRatingView(new RatingViews.Summary(roundAverage(summary.average()), summary.count()), mine, comments);
    }

    /** Một lời bình dưới góc nhìn của người xem; không lộ danh tính tác giả. */
    private static RatingViews.CommentView toCommentView(PlaceComment comment, UUID viewerId) {
        return new RatingViews.CommentView(comment.ratingId().toString(), comment.stars(), comment.comment(),
                Timestamps.format(comment.updatedAt()), comment.identityId().equals(viewerId));
    }

    /** Làm tròn đến một chữ số thập phân; null giữ nguyên null. */
    private static Double roundAverage(Double average) {
        return average == null ? null : Math.round(average * RatingConstants.AVERAGE_ROUNDING_FACTOR) / RatingConstants.AVERAGE_ROUNDING_FACTOR;
    }
}
