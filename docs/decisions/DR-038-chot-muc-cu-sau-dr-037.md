# DR-038 — Chốt các mục cũ sau DR-037 (12/11/2026)

**Trạng thái:** APPROVED (PO trả lời trực tiếp bằng `AskUserQuestion` trong phiên 12/11/2026; "Duyệt từng mục"). Master plan không đổi.
**Nguồn:** DR-037 mục "Còn mở" (cần PO xác nhận từng mục cũ là bỏ hay giữ).

## Quyết định
| Mục | Lựa chọn của PO | Hệ quả |
|---|---|---|
| RG-2 (G7 chưa kiểm), RG-5 (số hop proxy), RG-6 (bí mật phiên ở `localStorage`) | **"Kiểm tra và làm hoàn thiện"** (không đóng, không bỏ) | Rà an ninh hiện trạng rồi làm các việc nhỏ có thứ tự để hoàn thiện. Các cổng vẫn MỞ cho tới khi có bằng chứng; vẫn không phát hành cho người lạ (CLAUDE.md). Bước đầu: rà bằng `wander-security-reviewer` (12/11/2026), báo cáo lập danh sách việc. |
| RG-4 (replay chuyến thật 64 mục từ Excel) | **Bỏ** | Không còn nằm trên đường tới điểm dừng; e2e 125/125 (12/11/2026) phủ luồng chính. |
| AD-17 (trace OpenTelemetry/ADOT), AD-19 (Resilience4j, hàng đợi job), ADR-011 (Spring Modulith + outbox khi có module thứ tư) | **Giữ mở để học** | Không bị đóng. Vì STR-1 = C cấm mở rộng, mọi việc cho các mục này phải có trần thời gian do PO đặt trước khi làm (chưa đặt). ADR-011 vẫn APPROVED. |
| Q10 (thứ tự Lát 2/3) | **Bỏ** | Không còn ý nghĩa khi Wander đóng băng sau backlog. |
| Q15 (mạng yếu khi xem lịch) | **Đóng sau khi kiểm** | DR-019 đã trả lời (xem bản đã lưu); B-09 cài phần chuyến và điểm đến. Đóng khi kiểm với Render ngủ thật (cần triển khai bản mới). Chưa đóng. |

## Cùng ngày (không phải lựa chọn mới, ghi để khỏi mất)
- OPS-1: PO chọn ping bằng GitHub Actions (`.github/workflows/keep-warm.yml`, cron 10 phút); chỉ có tác dụng sau khi đẩy lên GitHub; rủi ro điều khoản Render còn đó (DR-037). Chưa push.
- Thư mục `tools/pages-proxy-probe/` đã xóa; dự án `wander-probe` trên Cloudflare Pages PO tự xóa trong dashboard.
- Commit (chưa push): B-01 `f7d6b9c`, test e2e `3fbc8b9`, B-09 `9f7174b`, keep-warm.
