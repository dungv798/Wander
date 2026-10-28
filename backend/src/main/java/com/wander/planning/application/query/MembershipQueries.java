package com.wander.planning.application.query;

import com.wander.planning.application.view.PlanningViews.InvitePreviewView;
import com.wander.planning.application.view.PlanningViews.InviteView;
import com.wander.planning.application.view.PlanningViews.MemberView;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.port.InviteCodeHasher;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Phía đọc thành viên và liên kết mời. Mọi hàm kiểm quyền theo vai TRƯỚC khi đọc; người ngoài ⇒ 404. */
@Service
@Transactional(readOnly = true)
public class MembershipQueries {

    private final TripReadModel read;
    private final InviteCodeHasher hasher;
    private final Clock clock;

    /** Nhận cổng đọc, bộ băm mã mời và đồng hồ. */
    public MembershipQueries(TripReadModel read, InviteCodeHasher hasher, Clock clock) {
        this.read = read;
        this.hasher = hasher;
        this.clock = clock;
    }

    /** Thành viên của chuyến (mọi thành viên xem được); {@code self} đánh dấu chính người gọi. KHÔNG trả mã danh tính. */
    public List<MemberView> members(UUID identityId, UUID tripId) {
        requireTrip(identityId, tripId);
        return read.members(tripId).stream()
                .map(m -> new MemberView(m.id().toString(), m.displayName(), m.role(), Timestamps.format(m.joinedAt()), m.identityId().equals(identityId)))
                .toList();
    }

    /** Trạng thái liên kết mời đang có (chỉ Organizer); không trả mã. Chưa có thì trống. */
    public Optional<InviteView> invite(UUID identityId, UUID tripId) {
        TripRow trip = requireTrip(identityId, tripId);
        if (!MemberRole.ORGANIZER.code().equals(trip.role())) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_ORGANIZER, PlanningMessages.NOT_ORGANIZER);
        }
        return read.unrevokedInvite(tripId).map(row -> new InviteView(row.id().toString(), Timestamps.format(row.createdAt()),
                Timestamps.format(row.expiresAt()), Timestamps.now(clock).isBefore(row.expiresAt())));
    }

    /** Xem trước liên kết mời (công khai): sai dạng, sai, hết hạn, thu hồi, chuyến đã xóa ⇒ CÙNG MỘT lỗi INVALID_INVITE. */
    public InvitePreviewView preview(String code) {
        if (!hasher.isWellFormed(code)) throw invalidInvite();
        return read.previewInvite(hasher.hash(code), Timestamps.now(clock))
                .map(row -> new InvitePreviewView(row.tripName(), row.memberCount())).orElseThrow(MembershipQueries::invalidInvite);
    }

    /** Chuyến còn hiện mà người này là thành viên; người ngoài ⇒ 404. */
    private TripRow requireTrip(UUID identityId, UUID tripId) {
        return read.findTrip(tripId, identityId).orElseThrow(WanderException::notFound);
    }

    /** Lỗi chung cho mọi liên kết không dùng được. */
    private static WanderException invalidInvite() {
        return WanderException.invalid(PlanningErrorCodes.INVALID_INVITE, PlanningMessages.INVALID_INVITE, PlanningFields.INVITE_CODE);
    }
}
