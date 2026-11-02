package com.wander.rating.api.controller;

import com.wander.rating.api.constant.RatingApiConstants;
import com.wander.rating.application.service.RatingService;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.web.request.JsonBody;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Điểm cuối rating Wander. Mọi điểm cuối cần phiên hợp lệ; ngân sách ghi theo danh tính do bộ chặn chung áp dụng. */
@RestController
@RequestMapping(RatingApiConstants.PLACE_PATH)
public class RatingController {

    private final RatingService ratings;

    /** Nhận service rating. */
    public RatingController(RatingService ratings) {
        this.ratings = ratings;
    }

    /** Rating của quán cho người xem. */
    @GetMapping(RatingApiConstants.RATING_PATH)
    public Map<String, Object> view(AuthenticatedPrincipal principal, @PathVariable String placeRef) {
        return Map.of(RatingApiConstants.KEY_RATING, ratings.view(principal, placeRef));
    }

    /** Chấm hoặc sửa điểm của mình cho quán. */
    @PutMapping(RatingApiConstants.RATING_PATH)
    public Map<String, Object> rate(AuthenticatedPrincipal principal, @PathVariable String placeRef, JsonBody body) {
        return Map.of(RatingApiConstants.KEY_RATING, ratings.rate(principal, placeRef, body.asMap()));
    }

    /** Xóa điểm của mình cho quán. */
    @DeleteMapping(RatingApiConstants.RATING_PATH)
    public Map<String, Object> remove(AuthenticatedPrincipal principal, @PathVariable String placeRef) {
        return Map.of(RatingApiConstants.KEY_RATING, ratings.remove(principal, placeRef));
    }

    /** Báo cáo một lời bình. */
    @PostMapping(RatingApiConstants.REPORT_PATH)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void report(AuthenticatedPrincipal principal, @PathVariable String placeRef, @PathVariable String ratingId) {
        ratings.report(principal, placeRef, ratingId);
    }
}
