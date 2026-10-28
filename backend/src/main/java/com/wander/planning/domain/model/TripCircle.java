package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Vòng người của một chuyến (Lát 1b, DR-021): thành viên và liên kết mời cùng bất biến — đúng một Organizer, tối đa
 * {@value PlanningConstants#MAX_MEMBERS} thành viên, tên hiển thị không trùng, tối đa một liên kết chưa thu hồi. Là một phần của aggregate
 * {@link Trip}: chỉ truy cập qua {@code trip.circle()}, và lưu cùng chuyến (cùng khóa lạc quan) nên vào chuyến đồng thời không vượt trần.
 */
public final class TripCircle {

    private final List<TripMember> members;
    private final List<TripInvite> invites;

    /** Dựng từ dữ liệu đã lưu. */
    TripCircle(List<TripMember> members, List<TripInvite> invites) {
        this.members = new ArrayList<>(members);
        this.invites = new ArrayList<>(invites);
    }

    /** Thành viên (kể cả Organizer), thứ tự vào chuyến. */
    public List<TripMember> members() {
        return List.copyOf(members);
    }

    /** Mọi liên kết mời (kể cả đã thu hồi/hết hạn). */
    public List<TripInvite> invites() {
        return List.copyOf(invites);
    }

    /** Thành viên ứng với một danh tính, nếu có. */
    public Optional<TripMember> memberOf(UUID identityId) {
        return members.stream().filter(m -> m.identityId().equals(identityId)).findFirst();
    }

    /** Vai của một danh tính trong chuyến; người ngoài thì trống. */
    public Optional<MemberRole> roleOf(UUID identityId) {
        return memberOf(identityId).map(TripMember::role);
    }

    /** Thành viên của danh tính này; người ngoài ⇒ 404 (không lộ chuyến tồn tại, INV-6). */
    public TripMember requireMember(UUID identityId) {
        return memberOf(identityId).orElseThrow(WanderException::notFound);
    }

    /** Chỉ Organizer: người ngoài ⇒ 404, thành viên thường ⇒ 403 NOT_ORGANIZER. */
    public void requireOrganizer(UUID identityId) {
        if (requireMember(identityId).role() != MemberRole.ORGANIZER) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_ORGANIZER, PlanningMessages.NOT_ORGANIZER);
        }
    }

    /** Quyền sửa/xóa/khôi phục một mục (H3): Organizer mọi mục; thành viên chỉ mục do mình thêm (403 NOT_YOUR_ITEM); người ngoài 404. */
    public void requireMayChange(UUID identityId, UUID itemAddedByMemberId) {
        TripMember member = requireMember(identityId);
        if (member.role() == MemberRole.ORGANIZER) return;
        if (!member.id().equals(itemAddedByMemberId)) {
            throw WanderException.forbidden(PlanningErrorCodes.NOT_YOUR_ITEM, PlanningMessages.NOT_YOUR_ITEM);
        }
    }

    /** Liên kết đang dùng được tại {@code now}, nếu có. */
    public Optional<TripInvite> activeInvite(Instant now) {
        return invites.stream().filter(i -> i.isActiveAt(now)).findFirst();
    }

    /** Organizer tạo liên kết mời mới (hết hạn sau INVITE_TTL_DAYS); mọi liên kết chưa thu hồi trước đó bị thu hồi để chỉ còn một. */
    public TripInvite createInvite(UUID actor, String codeHash, Instant now) {
        requireOrganizer(actor);
        revokeAllInvites(now);
        TripInvite invite = new TripInvite(UUID.randomUUID(), codeHash, now, now.plus(PlanningConstants.INVITE_TTL_DAYS, ChronoUnit.DAYS), null);
        invites.add(invite);
        return invite;
    }

    /** Organizer thu hồi liên kết đang dùng; không có liên kết đang dùng thì 404. */
    public void revokeInvite(UUID actor, Instant now) {
        requireOrganizer(actor);
        if (activeInvite(now).isEmpty()) throw WanderException.notFound();
        revokeAllInvites(now);
    }

    /** Thu hồi mọi liên kết chưa thu hồi (kể cả đã hết hạn). */
    private void revokeAllInvites(Instant now) {
        invites.replaceAll(i -> i.revoked(now));
    }

    /**
     * Vào chuyến bằng liên kết: mã phải khớp liên kết đang dùng (sai/hết hạn/thu hồi/chuyến đã xóa ⇒ MỘT lỗi INVALID_INVITE). Đã là
     * thành viên thì trả đúng người đó (idempotent). Đủ MAX_MEMBERS ⇒ TRIP_FULL.
     */
    public TripMember joinWithInvite(UUID identityId, String rawDisplayName, String codeHash, Instant now, boolean tripDeleted) {
        boolean valid = !tripDeleted && activeInvite(now).map(i -> i.codeHash().equals(codeHash)).orElse(false);
        if (!valid) throw WanderException.invalid(PlanningErrorCodes.INVALID_INVITE, PlanningMessages.INVALID_INVITE, PlanningFields.INVITE_CODE);
        Optional<TripMember> existing = memberOf(identityId);
        if (existing.isPresent()) return existing.get();
        if (members.size() >= PlanningConstants.MAX_MEMBERS) {
            throw WanderException.conflict(PlanningErrorCodes.TRIP_FULL, PlanningMessages.TRIP_FULL);
        }
        TripMember member = new TripMember(UUID.randomUUID(), identityId, MemberRole.MEMBER, uniqueDisplayName(rawDisplayName, null, MemberRole.MEMBER), now);
        members.add(member);
        return member;
    }

    /** Organizer gỡ một thành viên; không gỡ được Organizer; gỡ xong thu hồi liên kết đang dùng (người bị gỡ không vào lại bằng mã cũ). */
    public void removeMember(UUID actor, UUID memberId, Instant now) {
        requireOrganizer(actor);
        TripMember target = members.stream().filter(m -> m.id().equals(memberId)).findFirst().orElseThrow(WanderException::notFound);
        if (target.role() == MemberRole.ORGANIZER) {
            throw WanderException.conflict(PlanningErrorCodes.ORGANIZER_CANNOT_LEAVE, PlanningMessages.ORGANIZER_CANNOT_LEAVE);
        }
        members.remove(target);
        revokeAllInvites(now);
    }

    /** Thành viên tự rời chuyến; Organizer không rời được; người ngoài 404. */
    public void leave(UUID identityId, Instant now) {
        TripMember member = requireMember(identityId);
        if (member.role() == MemberRole.ORGANIZER) {
            throw WanderException.conflict(PlanningErrorCodes.ORGANIZER_CANNOT_LEAVE, PlanningMessages.ORGANIZER_CANNOT_LEAVE);
        }
        members.remove(member);
    }

    /** Đổi tên hiển thị của chính mình theo cùng quy tắc (không tính trùng với chính mình). */
    public TripMember renameMember(UUID identityId, String rawDisplayName, Instant now) {
        TripMember member = requireMember(identityId);
        TripMember renamed = member.withDisplayName(uniqueDisplayName(rawDisplayName, member.id(), member.role()));
        members.replaceAll(m -> m.id().equals(member.id()) ? renamed : m);
        return renamed;
    }

    /**
     * Chuẩn hóa tên hiển thị (NFC, cấm ký tự điều khiển/vô hình, ≤ MAX_DISPLAY_NAME điểm mã; trống ⇒ REQUIRED) và làm cho không trùng
     * trong chuyến (không phân biệt hoa thường): trùng thì thêm hậu tố " - 2", " - 3"… sau khi cắt tên gốc cho vừa giới hạn. "Organizer"
     * là tên dành riêng cho Organizer.
     */
    private String uniqueDisplayName(String raw, UUID exceptMemberId, MemberRole role) {
        String text = Labels.normalize(raw == null ? "" : raw, PlanningConstants.MAX_DISPLAY_NAME, PlanningFields.DISPLAY_NAME);
        if (text.isEmpty()) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.DISPLAY_NAME_REQUIRED, PlanningFields.DISPLAY_NAME);
        }
        String candidate = text;
        for (int n = 2; isDisplayNameTaken(candidate, exceptMemberId, role); n++) {
            String suffix = PlanningConstants.NAME_SUFFIX_SEPARATOR + n;
            int room = PlanningConstants.MAX_DISPLAY_NAME - suffix.length();
            int keep = Math.min(text.codePointCount(0, text.length()), room);
            candidate = text.substring(0, text.offsetByCodePoints(0, keep)) + suffix;
        }
        return candidate;
    }

    /** Tên đã có người khác dùng (không phân biệt hoa thường) hoặc là tên dành riêng của Organizer. */
    private boolean isDisplayNameTaken(String candidate, UUID exceptMemberId, MemberRole role) {
        boolean reserved = role != MemberRole.ORGANIZER && PlanningConstants.ORGANIZER_DISPLAY_NAME.equalsIgnoreCase(candidate);
        return reserved || members.stream().anyMatch(m -> !m.id().equals(exceptMemberId) && m.displayName().equalsIgnoreCase(candidate));
    }

}
