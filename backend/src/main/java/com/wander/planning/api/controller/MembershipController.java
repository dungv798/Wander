package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.api.request.RenameSelfRequest;
import com.wander.planning.api.response.PlanningResponses;
import com.wander.planning.application.command.MembershipCommandHandler;
import com.wander.planning.application.command.MembershipCommands;
import com.wander.planning.application.query.MembershipQueries;
import com.wander.planning.application.view.PlanningViews.CreatedInviteView;
import com.wander.planning.application.view.PlanningViews.MemberView;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** API thành viên và liên kết mời của MỘT chuyến (Lát 1b). Người ngoài ⇒ 404; thành viên thường gọi việc của Organizer ⇒ 403. */
@RestController
@RequestMapping(PlanningApiConstants.TRIPS_PATH)
public class MembershipController {

    private final MembershipCommandHandler commands;
    private final MembershipQueries queries;

    /** Nhận bộ xử lý lệnh và phía đọc. */
    public MembershipController(MembershipCommandHandler commands, MembershipQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** Organizer tạo liên kết mời mới; mã chỉ hiện đúng lần này. */
    @PostMapping(PlanningApiConstants.INVITES_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public PlanningResponses.CreatedInviteResponse createInvite(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        MembershipCommandHandler.CreatedInvite created = commands.createInvite(new MembershipCommands.CreateInvite(principal.identityId(), parseId(tripId)));
        return new PlanningResponses.CreatedInviteResponse(new CreatedInviteView(created.invite().id().toString(), created.code(), Timestamps.format(created.invite().expiresAt())));
    }

    /** Trạng thái liên kết mời hiện có (không có mã); chưa có thì null. */
    @GetMapping(PlanningApiConstants.INVITES_PATH)
    public PlanningResponses.InviteResponse invite(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return new PlanningResponses.InviteResponse(queries.invite(principal.identityId(), parseId(tripId)).orElse(null));
    }

    /** Thu hồi liên kết đang dùng. */
    @DeleteMapping(PlanningApiConstants.INVITE_ACTIVE_PATH)
    public ResponseEntity<Void> revokeInvite(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        commands.revokeInvite(new MembershipCommands.RevokeInvite(principal.identityId(), parseId(tripId)));
        return ResponseEntity.noContent().build();
    }

    /** Danh sách thành viên. */
    @GetMapping(PlanningApiConstants.MEMBERS_PATH)
    public PlanningResponses.MembersResponse members(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return new PlanningResponses.MembersResponse(queries.members(principal.identityId(), parseId(tripId)));
    }

    /** Organizer gỡ một thành viên. */
    @DeleteMapping(PlanningApiConstants.MEMBER_PATH)
    public ResponseEntity<Void> removeMember(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String memberId) {
        commands.removeMember(new MembershipCommands.RemoveMember(principal.identityId(), parseId(tripId), parseId(memberId)));
        return ResponseEntity.noContent().build();
    }

    /** Thành viên tự rời chuyến. */
    @DeleteMapping(PlanningApiConstants.MEMBER_ME_PATH)
    public ResponseEntity<Void> leave(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        commands.leave(new MembershipCommands.Leave(principal.identityId(), parseId(tripId)));
        return ResponseEntity.noContent().build();
    }

    /** Đổi tên hiển thị của chính mình. */
    @PatchMapping(PlanningApiConstants.MEMBER_ME_PATH)
    public PlanningResponses.MemberResponse renameSelf(AuthenticatedPrincipal principal, @PathVariable String tripId, @RequestBody RenameSelfRequest body) {
        UUID trip = parseId(tripId);
        commands.renameSelf(body.toCommand(principal.identityId(), trip));
        MemberView self = queries.members(principal.identityId(), trip).stream().filter(MemberView::self).findFirst().orElseThrow(WanderException::notFound);
        return new PlanningResponses.MemberResponse(self);
    }

    /** Mã trong URL; chuỗi không phải UUID coi như không tồn tại (404). */
    private static UUID parseId(String raw) {
        return Ids.parse(raw).orElseThrow(WanderException::notFound);
    }
}
