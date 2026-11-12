package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.api.request.InvitePreviewRequest;
import com.wander.planning.api.request.JoinRequest;
import com.wander.planning.api.response.PlanningResponses;
import com.wander.planning.application.command.MembershipCommandHandler;
import com.wander.planning.application.query.MembershipQueries;
import com.wander.planning.application.view.PlanningViews.MemberView;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Timestamps;
import com.wander.shared.web.ratelimit.RateLimits;
import com.wander.shared.web.request.ClientAddress;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** API liên kết mời không gắn với chuyến: xem trước (công khai, có hạn mức) và vào chuyến (cần phiên, có hạn mức theo phiên). */
@RestController
@RequestMapping(PlanningApiConstants.INVITES_BASE_PATH)
public class InviteController {

    private final MembershipCommandHandler commands;
    private final MembershipQueries queries;
    private final RateLimits limits;
    private final ClientAddress clientAddress;

    /** Nhận bộ xử lý lệnh, phía đọc, hạn mức và bộ lấy địa chỉ người gọi. */
    public InviteController(MembershipCommandHandler commands, MembershipQueries queries, RateLimits limits, ClientAddress clientAddress) {
        this.commands = commands;
        this.queries = queries;
        this.limits = limits;
        this.clientAddress = clientAddress;
    }

    /** Xem trước liên kết: chỉ tên chuyến và số thành viên; mọi liên kết không dùng được trả cùng một lỗi. */
    @SecurityRequirements
    @PostMapping(PlanningApiConstants.INVITE_PREVIEW_PATH)
    public PlanningResponses.InvitePreviewResponse preview(HttpServletRequest request, @RequestBody InvitePreviewRequest body) {
        limits.catalog(clientAddress.of(request));
        return new PlanningResponses.InvitePreviewResponse(queries.preview(body.code()));
    }

    /** Vào chuyến bằng liên kết với tên hiển thị; trả mã chuyến và thành viên (không lộ mã danh tính). */
    @PostMapping(PlanningApiConstants.INVITE_JOIN_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public PlanningResponses.JoinedResponse join(AuthenticatedPrincipal principal, @RequestBody JoinRequest body) {
        limits.approval(principal.sessionId().toString());
        MembershipCommandHandler.Joined joined = commands.join(body.toCommand(principal.identityId()));
        MemberView member = new MemberView(joined.member().id().toString(), joined.member().displayName(), joined.member().role().code(),
                Timestamps.format(joined.member().joinedAt()), true);
        return new PlanningResponses.JoinedResponse(joined.tripId().toString(), member);
    }
}
