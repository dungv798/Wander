package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.application.command.PlanningCommandHandler;
import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.application.query.PlanningQueries;
import com.wander.planning.application.view.PlanningViews;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.web.request.JsonBody;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * API của Planning. Mẫu CQRS ở mức controller: lệnh ghi qua {@link PlanningCommandHandler} (trả id),
 * rồi đọc lại qua {@link PlanningQueries} để trả read model. Chuyến của người khác ⇒ 404 như không tồn tại (INV-6).
 */
@RestController
@RequestMapping(PlanningApiConstants.TRIPS_PATH)
public class TripController {

    private final PlanningCommandHandler commands;
    private final PlanningQueries queries;

    /** Nhận bộ xử lý lệnh (ghi) và phía đọc. */
    public TripController(PlanningCommandHandler commands, PlanningQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** Danh sách chuyến của chủ. */
    @GetMapping
    public Map<String, Object> listTrips(AuthenticatedPrincipal principal) {
        return Map.of(PlanningApiConstants.KEY_TRIPS, queries.listTrips(principal.identityId()));
    }

    /** Chuyến đã xóa mềm ("Chuyến đã xóa gần đây"), xóa gần nhất trước. */
    @GetMapping(PlanningApiConstants.DELETED_TRIPS_PATH)
    public Map<String, Object> deletedTrips(AuthenticatedPrincipal principal) {
        return Map.of(PlanningApiConstants.KEY_TRIPS, queries.deletedTrips(principal.identityId()));
    }

    /** Xóa mềm cả chuyến. */
    @DeleteMapping(PlanningApiConstants.TRIP_PATH)
    public ResponseEntity<Void> deleteTrip(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        commands.deleteTrip(new PlanningCommands.DeleteTrip(principal.identityId(), parseId(tripId)));
        return ResponseEntity.noContent().build();
    }

    /** Khôi phục chuyến đã xóa mềm. */
    @PostMapping(PlanningApiConstants.TRIP_RESTORE_PATH)
    public Map<String, Object> restoreTrip(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        UUID trip = parseId(tripId);
        commands.restoreTrip(new PlanningCommands.RestoreTrip(principal.identityId(), trip));
        return tripResponse(principal, trip);
    }

    /** Tạo chuyến mới. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createTrip(AuthenticatedPrincipal principal, JsonBody body) {
        UUID tripId = commands.createTrip(new PlanningCommands.CreateTrip(principal.identityId(), body.asMap()));
        return tripResponse(principal, tripId);
    }

    /** Chi tiết chuyến: lịch theo ngày, tổng, ngân sách, việc cần làm chưa xong. */
    @GetMapping(PlanningApiConstants.TRIP_PATH)
    public PlanningViews.TripDetail getTripDetail(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return queries.detail(principal.identityId(), parseId(tripId));
    }

    /** Sửa chuyến (trường không nêu thì giữ nguyên). */
    @PatchMapping(PlanningApiConstants.TRIP_PATH)
    public Map<String, Object> updateTrip(AuthenticatedPrincipal principal, @PathVariable String tripId, JsonBody body) {
        UUID trip = parseId(tripId);
        commands.updateTrip(new PlanningCommands.UpdateTrip(principal.identityId(), trip, body.asMap()));
        return tripResponse(principal, trip);
    }

    /** Thêm mục vào một ngày của chuyến. */
    @PostMapping(PlanningApiConstants.ITEMS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addItem(AuthenticatedPrincipal principal, @PathVariable String tripId, JsonBody body) {
        UUID trip = parseId(tripId);
        UUID item = commands.addItem(new PlanningCommands.AddItem(principal.identityId(), trip, body.asMap()));
        return itemResponse(principal, trip, item);
    }

    /** Một mục của chuyến. */
    @GetMapping(PlanningApiConstants.ITEM_PATH)
    public Map<String, Object> getItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        return itemResponse(principal, parseId(tripId), parseId(itemId));
    }

    /** Sửa một mục (trường không nêu thì giữ nguyên). */
    @PatchMapping(PlanningApiConstants.ITEM_PATH)
    public Map<String, Object> editItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId,
                                        JsonBody body) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.editItem(new PlanningCommands.EditItem(principal.identityId(), trip, item, body.asMap()));
        return itemResponse(principal, trip, item);
    }

    /** Xóa mềm một mục (vào "Đã xóa gần đây"). */
    @DeleteMapping(PlanningApiConstants.ITEM_PATH)
    public Map<String, Object> softDeleteItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.softDeleteItem(new PlanningCommands.SoftDeleteItem(principal.identityId(), trip, item));
        return itemResponse(principal, trip, item);
    }

    /** Khôi phục một mục đã xóa mềm. */
    @PostMapping(PlanningApiConstants.ITEM_RESTORE_PATH)
    public Map<String, Object> restoreItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.restoreItem(new PlanningCommands.RestoreItem(principal.identityId(), trip, item));
        return itemResponse(principal, trip, item);
    }

    /** Xóa vĩnh viễn một mục đã nằm trong "Đã xóa gần đây". */
    @DeleteMapping(PlanningApiConstants.ITEM_PERMANENT_PATH)
    public ResponseEntity<Void> purgeItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        commands.purgeItem(new PlanningCommands.PurgeItem(principal.identityId(), parseId(tripId), parseId(itemId)));
        return ResponseEntity.noContent().build();
    }

    /** Đánh dấu hoặc bỏ đánh dấu hoàn thành một việc cần làm. */
    @PutMapping(PlanningApiConstants.ITEM_DONE_PATH)
    public Map<String, Object> setTaskDone(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId,
                                           JsonBody body) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.setTaskDone(new PlanningCommands.SetTaskDone(principal.identityId(), trip, item, body.get(PlanningFields.DONE)));
        return itemResponse(principal, trip, item);
    }

    /** Sắp xếp lại các mục đang hiện trong một ngày; trả danh sách mục của ngày đó theo thứ tự mới. */
    @PostMapping(PlanningApiConstants.DAY_REORDER_PATH)
    public Map<String, Object> reorderDay(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String day,
                                          JsonBody body) {
        UUID trip = parseId(tripId);
        LocalDate reorderedDay = commands.reorderDay(
                new PlanningCommands.ReorderDay(principal.identityId(), trip, day, body.get(PlanningFields.ORDERED_IDS)));
        return Map.of(PlanningApiConstants.KEY_ITEMS, queries.dayItems(principal.identityId(), trip, reorderedDay));
    }

    /**
     * Lệnh lịch nguyên tử: tùy chọn đổi khoảng ngày và gán ngày hàng loạt cho các mục trong một giao dịch; trả chi tiết chuyến
     * sau khi áp dụng. Gửi lại trạng thái cũ là cách Hoàn tác.
     */
    @PostMapping(PlanningApiConstants.SCHEDULE_PATH)
    public PlanningViews.TripDetail applySchedule(AuthenticatedPrincipal principal, @PathVariable String tripId, JsonBody body) {
        UUID trip = parseId(tripId);
        commands.applySchedule(new PlanningCommands.ApplySchedule(principal.identityId(), trip, body.asMap()));
        return queries.detail(principal.identityId(), trip);
    }

    /** Các mục trong "Đã xóa gần đây". */
    @GetMapping(PlanningApiConstants.TRASH_PATH)
    public Map<String, Object> getTrash(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return Map.of(PlanningApiConstants.KEY_ITEMS, queries.trash(principal.identityId(), parseId(tripId)));
    }

    /** Phản hồi chứa một chuyến, đọc lại sau khi ghi. */
    private Map<String, Object> tripResponse(AuthenticatedPrincipal principal, UUID tripId) {
        return Map.of(PlanningApiConstants.KEY_TRIP, queries.trip(principal.identityId(), tripId));
    }

    /** Phản hồi chứa một mục, đọc lại sau khi ghi. */
    private Map<String, Object> itemResponse(AuthenticatedPrincipal principal, UUID tripId, UUID itemId) {
        return Map.of(PlanningApiConstants.KEY_ITEM, queries.item(principal.identityId(), tripId, itemId));
    }

    /** Mã trong URL; chuỗi không phải UUID coi như không tồn tại (404). */
    private static UUID parseId(String raw) {
        return Ids.parse(raw).orElseThrow(WanderException::notFound);
    }
}
