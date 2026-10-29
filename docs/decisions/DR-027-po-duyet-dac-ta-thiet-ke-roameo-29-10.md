# DR-027 — PO duyệt đặc tả thiết kế Roameo (29/10/2026)

- **Trạng thái:** `APPROVED` — PO viết "t duyệt docs/design/" (29/10/2026). Phạm vi duyệt: `docs/design/roameo-spec.md` làm **tài liệu tham chiếu thiết kế** cho look mới (chữ, kính, icon, bố cục, bản đồ), giữ bảng màu Nắng vàng (DR-013) và các quyết định ở DR-024. Các mục `UNVERIFIED` trong đặc tả (font gốc của Roameo, khúc xạ iOS 26, hiệu năng thiết bị thật) vẫn chưa được kiểm chứng.
- **Không commit ảnh:** ảnh cắt `docs/design/crops/` và `docs/design/glass-trial/` (khoảng 32 MB, nguồn là ảnh chụp app bên thứ ba ở `docs/UI-sample-2`, PO đã dặn không commit thư mục này) chỉ để trên máy; chỉ commit tài liệu và script.

## PO phản hồi cùng ngày (nguyên ý)
Nút còn nền màu, muốn trong suốt kiểu liquid glass iPhone; mở Lang Biang từ bản đồ thì chi tiết hiện cả 3 ảnh cùng lúc (không next/prev); bản đồ "nhô nhô lởm chởm rất xấu", muốn trong xanh thân thiện như mẫu; khoảng trống giữa các box section quá lớn.

## Hệ quả
- Bỏ lớp địa hình đổ bóng (hillshade AWS) khỏi bản đồ; ghi chú vào ADR-015 (PO đổi 29/10); tile vector OpenFreeMap giữ nguyên.
- Nút: chỉ giữ một CTA chính mỗi màn có màu thương hiệu, còn lại kính trong suốt.
