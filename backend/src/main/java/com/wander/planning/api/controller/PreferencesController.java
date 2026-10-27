package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.application.command.PlanningCommandHandler;
import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.application.query.PlanningQueries;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.web.request.JsonBody;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** API sở thích theo danh tính (BE-10): đọc và thay thế "Bạn mê gì?" của onboarding, gắn với danh tính chứ không với một chuyến. */
@RestController
@RequestMapping(PlanningApiConstants.PREFERENCES_PATH)
public class PreferencesController {

    private final PlanningCommandHandler commands;
    private final PlanningQueries queries;

    /** Nhận bộ xử lý lệnh (ghi) và phía đọc. */
    public PreferencesController(PlanningCommandHandler commands, PlanningQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** Sở thích hiện có của danh tính đang gọi (mã + nhãn, theo thứ tự cố định); chưa đặt thì rỗng. */
    @GetMapping
    public Map<String, Object> preferences(AuthenticatedPrincipal principal) {
        return Map.of(PlanningApiConstants.KEY_INTERESTS, queries.interestPreferences(principal.identityId()));
    }

    /** Thay toàn bộ sở thích (idempotent); danh sách rỗng hoặc null xóa; trả sở thích sau khi đặt. */
    @PutMapping(PlanningApiConstants.INTERESTS_PATH)
    public Map<String, Object> setInterests(AuthenticatedPrincipal principal, JsonBody body) {
        commands.setInterestPreferences(new PlanningCommands.SetInterestPreferences(principal.identityId(), body.asMap()));
        return Map.of(PlanningApiConstants.KEY_INTERESTS, queries.interestPreferences(principal.identityId()));
    }
}
