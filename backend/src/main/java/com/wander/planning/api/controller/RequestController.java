package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.application.command.RequestCommandHandler;
import com.wander.planning.application.command.RequestCommands;
import com.wander.planning.application.query.MembershipQueries;
import com.wander.planning.application.view.PlanningViews.DeletionRequestView;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.web.request.JsonBody;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** API đề nghị xóa của MỘT chuyến (H2): thành viên gửi/hủy, Organizer duyệt. Người ngoài ⇒ 404. */
@RestController
@RequestMapping(PlanningApiConstants.TRIPS_PATH)
public class RequestController {

    private final RequestCommandHandler commands;
    private final MembershipQueries queries;

    /** Nhận bộ xử lý lệnh và phía đọc. */
    public RequestController(RequestCommandHandler commands, MembershipQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** Danh sách đề nghị: Organizer thấy tất cả, thành viên chỉ của mình. */
    @GetMapping(PlanningApiConstants.REQUESTS_PATH)
    public Map<String, Object> list(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return Map.of(PlanningApiConstants.KEY_REQUESTS, queries.deletionRequests(principal.identityId(), parseId(tripId)));
    }

    /** Thành viên đề nghị xóa một mục của người khác. */
    @PostMapping(PlanningApiConstants.REQUESTS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> submit(AuthenticatedPrincipal principal, @PathVariable String tripId, JsonBody body) {
        UUID trip = parseId(tripId);
        UUID id = commands.submit(new RequestCommands.Submit(principal.identityId(), trip, body.asMap())).id();
        return Map.of(PlanningApiConstants.KEY_REQUEST, find(principal, trip, id));
    }

    /** Người đề nghị hủy đề nghị còn chờ. */
    @DeleteMapping(PlanningApiConstants.REQUEST_PATH)
    public ResponseEntity<Void> cancel(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String requestId) {
        commands.cancel(new RequestCommands.Cancel(principal.identityId(), parseId(tripId), parseId(requestId)));
        return ResponseEntity.noContent().build();
    }

    /** Organizer đồng ý: mục được xóa mềm. */
    @PostMapping(PlanningApiConstants.REQUEST_APPROVE_PATH)
    public Map<String, Object> approve(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String requestId) {
        return decide(principal, tripId, requestId, true);
    }

    /** Organizer từ chối. */
    @PostMapping(PlanningApiConstants.REQUEST_REJECT_PATH)
    public Map<String, Object> reject(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String requestId) {
        return decide(principal, tripId, requestId, false);
    }

    /** Quyết định một đề nghị rồi trả bản đã quyết định. */
    private Map<String, Object> decide(AuthenticatedPrincipal principal, String tripId, String requestId, boolean approve) {
        UUID trip = parseId(tripId);
        UUID id = commands.decide(new RequestCommands.Decide(principal.identityId(), trip, parseId(requestId), approve)).id();
        return Map.of(PlanningApiConstants.KEY_REQUEST, find(principal, trip, id));
    }

    /** Đọc lại một đề nghị theo mã (người gọi thấy được). */
    private DeletionRequestView find(AuthenticatedPrincipal principal, UUID trip, UUID id) {
        return queries.deletionRequests(principal.identityId(), trip).stream().filter(r -> r.id().equals(id.toString())).findFirst().orElseThrow(WanderException::notFound);
    }

    /** Mã trong URL; chuỗi không phải UUID coi như không tồn tại (404). */
    private static UUID parseId(String raw) {
        return Ids.parse(raw).orElseThrow(WanderException::notFound);
    }
}
