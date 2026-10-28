package com.wander.planning.application.command;

import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.model.TripInvite;
import com.wander.planning.domain.model.TripMember;
import com.wander.planning.domain.port.InviteCodeHasher;
import com.wander.planning.domain.port.TripRepository;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Xử lý lệnh thành viên và liên kết mời. Mỗi phương thức một giao dịch; mọi quy tắc nằm trong {@link Trip}. */
@Service
@Transactional
public class MembershipCommandHandler {

    private final TripRepository trips;
    private final InviteCodeHasher hasher;
    private final Clock clock;

    /** Nhận cổng lưu chuyến, bộ băm mã mời và đồng hồ. */
    public MembershipCommandHandler(TripRepository trips, InviteCodeHasher hasher, Clock clock) {
        this.trips = trips;
        this.hasher = hasher;
        this.clock = clock;
    }

    /** Tạo liên kết mời mới và trả MÃ (chỉ hiện đúng lần này) cùng liên kết. */
    public CreatedInvite createInvite(MembershipCommands.CreateInvite command) {
        Trip trip = load(command.actor(), command.tripId());
        String code = hasher.newCode();
        TripInvite invite = trip.circle().createInvite(command.actor(), hasher.hash(code), Timestamps.now(clock));
        trips.save(trip);
        return new CreatedInvite(invite, code);
    }

    /** Thu hồi liên kết đang dùng. */
    public void revokeInvite(MembershipCommands.RevokeInvite command) {
        Trip trip = load(command.actor(), command.tripId());
        trip.circle().revokeInvite(command.actor(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Vào chuyến bằng mã; trả mã chuyến và thành viên. Mã sai dạng/không có chuyến ⇒ cùng một lỗi INVALID_INVITE. */
    public Joined join(MembershipCommands.Join command) {
        Object rawCode = command.input().get(PlanningFields.INVITE_CODE);
        String code = rawCode instanceof String text ? text : null;
        if (!hasher.isWellFormed(code)) throw invalidInvite();
        Trip trip = trips.findByInviteHash(hasher.hash(code)).orElseThrow(MembershipCommandHandler::invalidInvite);
        Object rawName = command.input().get(PlanningFields.DISPLAY_NAME);
        TripMember member = trip.joinWithInvite(command.actor(), rawName instanceof String name ? name : null, hasher.hash(code), Timestamps.now(clock));
        trips.save(trip);
        return new Joined(trip.id(), member);
    }

    /** Organizer gỡ một thành viên (thu hồi luôn liên kết đang dùng). */
    public void removeMember(MembershipCommands.RemoveMember command) {
        Trip trip = load(command.actor(), command.tripId());
        trip.circle().removeMember(command.actor(), command.memberId(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Thành viên rời chuyến. */
    public void leave(MembershipCommands.Leave command) {
        Trip trip = load(command.actor(), command.tripId());
        trip.circle().leave(command.actor(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Đổi tên hiển thị của chính mình. */
    public TripMember renameSelf(MembershipCommands.RenameSelf command) {
        Trip trip = load(command.actor(), command.tripId());
        Object rawName = command.input().get(PlanningFields.DISPLAY_NAME);
        TripMember renamed = trip.circle().renameMember(command.actor(), rawName instanceof String name ? name : null, Timestamps.now(clock));
        trips.save(trip);
        return renamed;
    }

    /** Nạp chuyến mà người gọi là thành viên; người ngoài và chuyến đã xóa ⇒ 404. */
    private Trip load(UUID actor, UUID tripId) {
        return trips.findAccessible(tripId, actor).orElseThrow(WanderException::notFound);
    }

    /** Lỗi chung cho mọi liên kết không dùng được. */
    private static WanderException invalidInvite() {
        return WanderException.invalid(PlanningErrorCodes.INVALID_INVITE, PlanningMessages.INVALID_INVITE, PlanningFields.INVITE_CODE);
    }

    /** Kết quả tạo liên kết: bản ghi và mã (bí mật, chỉ trả một lần). */
    public record CreatedInvite(TripInvite invite, String code) {
    }

    /** Kết quả vào chuyến. */
    public record Joined(UUID tripId, TripMember member) {
    }
}
