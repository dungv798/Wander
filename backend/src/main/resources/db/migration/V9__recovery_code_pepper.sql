-- DR-018 B3: mã khôi phục đổi từ SHA-256 không khóa sang HMAC-SHA-256 có khóa (pepper). Băm cũ không còn khớp với bất kỳ mã nào.
-- Không phân biệt được băm cũ với băm mới, nên vô hiệu hóa MỌI mã đang hiệu lực: trạng thái rõ ràng "chưa có mã" (người dùng
-- tạo lại ở màn Bảo mật bằng phiên đang có) tốt hơn một mã "còn hiệu lực" mà không bao giờ khớp. Mã đã vô hiệu từ trước giữ nguyên lý do.
UPDATE recovery_codes
   SET invalidated_at = now(), invalidated_reason = 'pepper_migration'
 WHERE invalidated_at IS NULL;

-- Các lần khôi phục / thay mã đang chờ cũng mang băm cũ và không bao giờ hoàn tất được: đóng lại để người dùng nhận lời báo
-- "hết hạn" đúng thay vì "mã thay thế sai".
UPDATE recovery_attempts SET state = 'expired' WHERE state = 'pending';
UPDATE code_replacements SET state = 'void' WHERE state = 'pending';
