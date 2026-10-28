package com.wander.planning.application.query;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Cổng đọc (phía Query của CQRS): trả về dòng dữ liệu phẳng, không nạp aggregate.
 * Cài đặt bằng JPQL trong infrastructure. Phía đọc có thể tối ưu riêng (index, view, cache) mà không đụng domain.
 */
public interface TripReadModel {

    /** Chuyến theo mã của đúng chủ; chuyến của người khác coi như không có. */
    Optional<TripRow> findTrip(UUID tripId, UUID ownerId);

    /** Chuyến của chủ, mới nhất trước (ngày đi giảm dần, rồi thời điểm tạo giảm dần). */
    List<TripRow> listTrips(UUID ownerId);

    /** Vai của danh tính trong chuyến còn hiện; trống nếu không phải thành viên hoặc chuyến đã xóa. */
    Optional<String> roleIn(UUID tripId, UUID identityId);

    /** Mã thành viên của danh tính trong chuyến còn hiện. */
    Optional<UUID> memberIdIn(UUID tripId, UUID identityId);

    /** Hạng mục checklist của chuyến theo nhóm rồi vị trí. */
    List<ChecklistRow> checklist(UUID tripId);

    /** Mọi thành viên của chuyến, theo thứ tự vào. */
    List<MemberRow> members(UUID tripId);

    /** Mọi đề nghị xóa của chuyến, cũ trước. */
    List<RequestRow> deletionRequests(UUID tripId);

    /** Liên kết mời chưa thu hồi của chuyến, nếu có. */
    Optional<InviteRow> unrevokedInvite(UUID tripId);

    /** Xem trước liên kết mời còn dùng được tại {@code now}; mã sai/hết hạn/thu hồi/chuyến đã xóa đều trả trống. */
    Optional<InvitePreviewRow> previewInvite(String codeHash, java.time.Instant now);

    /** Chuyến đã xóa mềm của chủ, xóa gần nhất trước. */
    List<TripRow> listDeletedTrips(UUID ownerId);

    /** Mọi mục (kể cả đã xóa mềm), theo ngày rồi thứ tự thủ công. */
    List<ItemRow> items(UUID tripId);

    /** Một mục của chuyến theo mã (kể cả đã xóa mềm). */
    Optional<ItemRow> item(UUID tripId, UUID itemId);

    /** Mục đã xóa mềm, xóa gần nhất trước. */
    List<ItemRow> trash(UUID tripId);

    /** Sở thích theo danh tính dạng chuỗi mã cách nhau bằng dấu phẩy; chưa đặt thì chuỗi rỗng. */
    String interestPreferences(UUID ownerId);

    /** Hoàn thành theo mục: mã mục → mã danh tính những người đã xong (chỉ dùng nội bộ để đổi sang mã thành viên). */
    java.util.Map<UUID, List<UUID>> completions(UUID tripId);

    /** Mã các mục mà người này đã đánh dấu hoàn thành. */
    Set<UUID> doneItemIds(UUID tripId, UUID personId);
}
