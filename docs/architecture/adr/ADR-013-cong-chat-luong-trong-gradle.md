# ADR-013 — Cổng chất lượng viết thành tác vụ Gradle; CI viết sẵn nhưng chưa bật (AD-18)

- **Trạng thái:** `APPROVED` — PO chọn "B. Cổng trong Gradle, workflow viết sẵn chưa bật (Recommended)" ngày 27/10/2026, sau khi xem trang kế hoạch `Wander Backend Blueprint` (mục AD-18). Khuyến nghị của agent trùng lựa chọn của PO.
- **Phạm vi:** quyết định hướng. **Không tạo pipeline triển khai, không secret, không tài nguyên cloud** (`planning-safety.md` mục 5). Repo chưa có remote (`git remote -v` rỗng, kiểm tra 27/10/2026): việc đẩy mã lên nơi nào là quyết định riêng của PO, em không làm khi chưa được nói.

## Quyết định
| Mục | Chọn |
|---|---|
| Nguyên tắc | Cổng chất lượng là **tác vụ Gradle**: `./gradlew check` gồm test, ArchUnit, ngưỡng JaCoCo, định dạng (Spotless), quét phụ thuộc, quét bí mật (gitleaks). CI chỉ là người chạy lệnh đó |
| CI | Viết sẵn tệp workflow (ví dụ GitHub Actions) nhưng **chưa bật** cho tới khi PO có remote và nói bật. Chỉ build/test, **không secret, không thông tin xác thực AWS, không deploy** |
| Cục bộ | Tùy chọn hook `pre-push` chạy cổng nhanh; `tools\dev.ps1 verify` vẫn là lệnh đầy đủ (kèm e2e) |
| CD tới AWS | **Chưa**: cần vai trò IAM, secret, tạo tài nguyên; bị chặn tới RG-5 và duyệt riêng |

## Ràng buộc khi thực hiện (Tầng B, ghi vào `decisions.md` §2)
- Ngưỡng JaCoCo đặt theo mức **đo hiện tại** của `domain` và `application`, không đặt số trước khi đo.
- Plugin dev (Spotless, quét phụ thuộc) là phụ thuộc lúc build, không vào image chạy; chọn phiên bản ổn định tương thích Gradle/Java 21 tại thời điểm làm.
- Testcontainers cần Docker trên runner/máy: ghi rõ trong tài liệu và tách tác vụ nhanh (không Docker) khỏi tác vụ chậm.
- Đọc kết quả từ log hoặc `backend/build/test-results/`, không từ trí nhớ.

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| A. Giữ chạy tay `dev.ps1 verify` | Không chọn: dễ quên, không chặn thay đổi hỏng |
| **B. Cổng trong Gradle + CI viết sẵn chưa bật** | **Chọn** |
| C. CI + CD tới AWS | Không chọn: chưa được phép (RG-5), khó đảo ngược |

## Hệ quả
- Chạy y hệt trên máy PO và trên bất kỳ CI nào về sau (GitHub Actions, CodeBuild...): đổi CI chỉ là đổi một tệp.
- Đảo ngược dễ.
- Học: cổng chất lượng, quét chuỗi cung ứng, tách "việc kiểm" khỏi "nơi chạy".

## Ghi chú thực hiện (27/10/2026, Tầng B; PO chưa duyệt riêng các lệch này)
| Mục ADR | Thực tế | Lý do |
|---|---|---|
| Định dạng bằng Spotless | **Không dùng.** Thay bằng các luật hygiene của Checkstyle (xuống dòng cuối tệp, không tab, không khoảng trắng thừa, thứ tự import, import thừa) | Spotless với google-java-format sẽ định dạng lại toàn bộ mã (thụt lề, ngắt dòng) và xung đột với phong cách hiện có; Checkstyle đã là cổng duy nhất và không cần thêm plugin |
| Ngưỡng JaCoCo theo `domain` và `application` | Đo trước rồi đặt: toàn bộ ≥ 90% dòng / 70% nhánh; **từng gói** domain và application ≥ 90% dòng / 50% nhánh. Mức đo: toàn bộ 98,0% / 82,8%; gói thấp nhất 94,1% dòng (`identity.domain.rule`) và 50,0% nhánh (`catalog.application.query`) | Ngưỡng nhánh 50% là sàn theo gói thấp nhất hiện có, không phải mục tiêu; nâng khi mức đo tăng. Đã thử cổng đỏ thật bằng ngưỡng 0,999 |
| Quét phụ thuộc và bí mật trong `check` | Chạy bằng `toolsquality.ps1` (Docker), **chưa** nằm trong `check` | Cần Docker và mạng; `check` giữ chạy được offline |
| Hook `pre-push` | Chưa cài | Tùy chọn trong ADR; repo chưa có remote |
| Workflow CI | `docs/ci/backend-ci.workflow.yml`, ngoài `.github` nên không chạy | Đúng phương án B |
