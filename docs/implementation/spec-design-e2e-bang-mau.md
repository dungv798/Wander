# Spec: Hoàn thiện thiết kế end-to-end và bộ màu hệ thống mới (DỰ THẢO, chờ PO duyệt)

> **Trạng thái: DRAFT.** Soạn 25/10/2026 theo lời PO: "hoàn thiện design trước … end to end luôn, từ đầu đến cuối, từ onboarding tới sử dụng thật … phối màu lên một bộ màu hệ thống … thích màu như Roameo (tươi sáng, vàng hoặc xanh nhạt, sặc sỡ tươi mới, không phải màu trầm như hiện tại)". Chưa dựng gì. Chưa có backend. Dừng chờ PO duyệt spec này (và trả lời mục Câu hỏi mở) rồi mới sang kế hoạch.
> Cổng DG-1 đã đóng ở `DR-010`; PO yêu cầu thêm một vòng thiết kế nên coi đây là **phụ lục thiết kế** (sẽ ghi `DR-012` khi PO duyệt). Backend vẫn chưa làm.

## Objective
Hai việc, cùng một đích: một người lạ mở Wander lần đầu và đi hết hành trình (khám phá → lưu chuyến → xếp ngày → chi phí → mời bạn → dùng trong chuyến đi) mà không bị cụt đường, trên một giao diện **tươi, sáng, nhiều màu** thay cho gam cam–kem hiện tại.

**Việc A. Phủ end-to-end.** Vẽ lại bản đồ hành trình từ lần mở đầu tiên tới lúc dùng thật, đối chiếu với khoảng 26 mã màn hiện có (S1–S13 gồm S7a/S7b, G1–G7, A0–A3 trong `screens.md`) và lấp các chỗ cụt. Lỗ hổng đã biết (đọc từ `screens.md`, `user-flows.md`, `PO-REVIEW.md`):
1. **Onboarding**: chưa có màn/luồng giới thiệu lần mở đầu; app mở thẳng vào Khám phá.
2. **Người dùng thường hết phiên**: chưa có màn (TTL còn "Đã gác lại" ở `open-decisions.md`).
3. **Lỗi máy chủ theo mã**: chưa có bảng mã lỗi → thông báo tiếng Việt.
4. **"Dùng thật" trong chuyến đi**: chưa có góc nhìn "hôm nay" khi đang đi (xem Câu hỏi Q1).
5. **Xuất/chia sẻ**: Ảnh/PDF/Lịch mới là nút khung; liên kết chỉ-đọc phụ thuộc Q6–Q9 (còn mở).
6. **Quản trị**: chưa có tải ảnh lên, tạo điểm đến mới; đăng nhập (Q-d) chưa chốt.
7. **Nhóm 1b**: chưa có màn gỡ thành viên.
8. **Chuyến tạo nhầm không xóa được ở 1a** (DR-004): chưa có chữ nói thẳng điều này cho người dùng.
9. **Màn Cài đặt/Giới thiệu**: chưa có chỗ xem tên thiết bị, "Về Wander" (nguồn dữ liệu, quyền riêng tư). `UNVERIFIED` còn cần hay không, xem Q3.

**Việc B. Bộ màu hệ thống mới.** Thay token màu bằng một bộ **tươi sáng, sặc sỡ, vàng hoặc xanh nhạt làm chủ đạo**; vẫn là bộ token duy nhất (sáng + tối), áp lên mọi màn bằng cách đổi token, không đổi bố cục. Các agent UX/UI đề xuất **3 phương án**, PO chọn 1 (hoặc trộn), rồi mới áp.

**Thành công** = (A) PO đi hết hành trình trên prototype từ lần mở đầu tới dùng thật mà không gặp ngõ cụt hay màn "chưa làm" ngoài danh sách đã nêu rõ; (B) PO chọn được một bộ màu và nhìn ảnh thật thấy đúng cảm giác "tươi, không trầm".

## Giả định đang dùng (sửa ngay nếu sai)
1. Vẫn là web app tiếng Việt, 390 px là chính, 1280 px có bố cục riêng (`design-spec.md` §2).
2. "Giống Roameo" là **gu thẩm mỹ** PO mô tả, không phải sao chép: không dùng logo, minh họa 3D, chữ, số liệu/đánh giá của họ (`design-spec.md` §7). PO đã đưa 50 ảnh chụp ở `docs/UI-sample/`; **em đã xem đủ 50/50 ảnh** (22 ảnh ở lượt đầu, 28 ảnh còn lại khi dựng `journey-map.md`) và đo màu bằng `docs/ux/tools/sample-colors.mjs`. Xem mục "Tham chiếu từ ảnh chụp" bên dưới.
3. Chỉ đổi **màu** và những gì đi theo màu (gradient nền, màu loại, màu ngày, huy hiệu). Giữ những thứ làm nên look đã duyệt ở DR-009 (gradient, bóng nhẹ, huy hiệu tròn, minh họa, chữ Baloo 2 + Be Vietnam Pro, biểu tượng Tabler). Nếu bộ màu mới buộc đổi một trong những thứ đó thì **hỏi PO trước** (bài học 25/10).
4. Màu hiện tại (đọc từ `prototype/app/app.css`): nút/nhấn `#f4511e` (cam), nền `#fff8f0` (kem), chữ `#12233d`, nền thẻ `#f6ece0`, vàng `#ffc93c`, xanh `#1b5fc4`; bản tối nền xanh đậm, nhấn `#ff8a5c`. **Phát hiện từ ảnh đo (xem dưới):** cam nút của Roameo gần như trùng cam của mình, nên cảm giác "trầm" nhiều khả năng đến từ **nền kem/be và thẻ phẳng**, không phải từ màu cam. Đây là suy luận, sẽ kiểm bằng ảnh so sánh.
5. Màu theo **loại địa điểm** và theo **ngày** (D1–D7) vẫn cần phân biệt được nhau và không là tín hiệu duy nhất (luôn kèm biểu tượng/nhãn).
6. Truy cập giữ nguyên chuẩn: tương phản chữ ≥ 4,5:1, thành phần UI ≥ 3:1, vùng chạm ≥ 44 px. Màu vàng sáng và xanh nhạt là rủi ro tương phản lớn nhất: chữ trên nền vàng/xanh nhạt phải dùng chữ đậm đủ tối, không dùng chữ trắng trên vàng.

## Tham chiếu từ ảnh chụp (`docs/UI-sample/`, đã xem đủ 50/50 ảnh; chỉ để hiểu gu, không sao chép)

**Màu đo được** (trung bình khối 9×9 px, `sample-colors.mjs`; mẫu trúng chữ/biểu tượng đã loại; nhãn "ngày" trên bản đồ có thể lẫn nền bản đồ nên chỉ là ước lượng):
| Vai trò thấy trong ảnh | Màu đo | So với Wander hiện tại |
|---|---|---|
| Nút chính (gradient ngang, hình viên thuốc) | `#fe661a` → `#f44b06` | `--brand #f4511e`: **gần như trùng** |
| Nhấn/chữ thương hiệu, chip chọn | `#fc6328`, `#fd6618` | cùng họ cam |
| Nền thẻ nhấn (đào, chuyển sang trắng) | `#ffe9d4`, `#fee4cd` | `--brand-soft #ffe9dc`: gần |
| **Nền trời xanh nhạt (gradient)** | `#b5d7f0` → `#e6f4fd`; tờ dưới `#daf2fc` | `--sky-1 #8ec9f5`, nhưng **nền chính của mình là kem `#fff8f0`** |
| Nền thẻ chia sẻ | `#cae2fc` | không có |
| Thẻ số liệu xanh lá | `#d1f3da` | `--like #0f8f4e` (đậm, không có nền nhạt) |
| Nhãn từng ngày trên bản đồ | vàng `#fcd280`, tím `#ca82e9`, lục `#b0e0c5`, lam `#a7ccf5`, ngọc `#74e2d5` (ước lượng) | `--d1…d7` đậm hơn và ngả trầm (`#6d3fd1`, `#0b7a55`…) |

**Kết luận về màu (suy luận, chưa phải quyết định):** gu "tươi" đến từ (1) nền **trắng + gradient xanh trời nhạt** thay vì kem, (2) **thẻ pastel nhiều màu** (đào, xanh lá, lam, tím nhạt) trên nền sáng, (3) **nút cam rực dạng gradient** hình viên thuốc, (4) **màu từng ngày sáng, nhiều sắc**, (5) bề mặt "kính" mờ ở tờ dưới và thanh điều hướng nổi, (6) biểu tượng 3D bóng. Vàng đúng nghĩa chỉ xuất hiện ở nhãn ngày, ngôi sao, huy hiệu pin; chủ đạo là **cam + xanh trời + trắng**. Điều này khác chữ "vàng hoặc xanh nhạt" của PO một chút: ba hướng màu ở mục Câu hỏi mở Q5 sẽ kiểm chéo với ảnh.

**Hành trình thấy trong ảnh** (để đối chiếu Việc A; không phải yêu cầu sao chép):
1. Onboarding nhiều bước có thanh tiến độ: lời giới thiệu giá trị, bằng chứng xã hội, nhập địa điểm đã lưu, "Sẵn sàng đi chưa?"; có bước dùng thử trả phí (**Wander: tiền hóa hoãn, không làm**).
2. Chia sẻ từ app khác vào ("Send to …") rồi màn "Import Spots" (**không có trong plan Wander; không thêm nếu PO không yêu cầu**).
3. Trang chủ: bản đồ + dải loại (Saved/Food/Culture/Nature) + "Your Collections" + "Trending in this area"; thanh dưới nổi 3 tab + nút +.
4. "Passport" (quả địa cầu, đã đến nơi nào); "Trips" có tab "Your Trips / Trip Ideas", lọc và sắp xếp.
5. **Tạo chuyến** nhiều thẻ: Where / When (lịch, "Flexible days", giờ hoạt động) / Who's going / Interests / Budget.
6. Tổng quan chuyến: thời tiết/"Before you go", thống kê, Memo, Checklist, mã giảm giá, "Saved", "Swipe to Discover", "Generate/Optimize itinerary", Edit; tab Day 1…n; **bản đồ tuyến đường theo ngày** với nhãn màu từng ngày; sắp xếp lại bằng kéo.
7. Chia sẻ dạng ảnh (IG Stories, WhatsApp, Photos); Trip Settings (ảnh bìa, tên, mô tả, ngày, ai được xem).

**Wander đã có / chưa có so với danh sách trên** (đọc từ `screens.md`): có khám phá + quẹt, tạo chuyến (tên, ngày, ngân sách), xếp ngày, sắp xếp thủ công, chi phí, chia sẻ (khung), cài đặt chuyến; **chưa có** onboarding, thanh tiến độ tạo chuyến theo bước (ai đi, sở thích), bản đồ tuyến theo ngày, "Hôm nay", ý tưởng chuyến mẫu, "Passport", thời tiết, Memo. Mỗi mục "chưa có" là **ứng viên**, quyết ở Q1–Q3 và Q8 (mới), không tự thêm.

## Commands
```
Máy chủ prototype:   node docs/ux/tools/serve.mjs                (http://127.0.0.1:4177/)
Luồng bấm thật:      node docs/ux/tools/flows.mjs [--only=F07,F08]
Chụp ảnh:            node docs/ux/tools/shots.mjs                (390/768/1280 × sáng/tối)
Tương phản:          node docs/ux/tools/contrast.mjs --css=docs/ux/prototype/app/app.css --pairs=docs/ux/tools/contrast-pairs-app.json
Quét truy cập:       node docs/ux/tools/a11y-scan.mjs --strict
Taste:               node ~/.claude/skills/design-taste-frontend/scripts/inspect.mjs <url> --app --widths 1280,768,390
```
(Lệnh đọc từ `design-spec.md` §3, `PO-REVIEW.md` §1–2 và `screens.md`, chưa chạy lại trong spec này.)

## Project Structure
```
docs/implementation/spec-design-e2e-bang-mau.md   spec này
docs/ux/journey-map.md                            (mới) bản đồ hành trình đầu–cuối, lỗ hổng, quyết định
docs/ux/palette-options.md                        (mới) 3 phương án màu: swatch, tỉ lệ tương phản, ảnh so sánh
docs/ux/palette-lab.html                          (mới) trang xem 3 bộ màu cạnh nhau trên cùng một màn thật
docs/ux/user-flows.md, screens.md, design-system.md   cập nhật (flow/màn mới, token mới sau khi PO chọn)
docs/ux/prototype/app/app.css (+ adaptive.css, admin.css)   đổi token sau khi PO chọn màu
docs/ux/tools/flow-defs/                          thêm luồng cho màn mới
docs/decisions/DR-012-...                         ghi lựa chọn của PO (sau khi PO duyệt)
```

## Code Style
Token đặt tên theo vai trò, mọi màu đi qua token, có bản tối; **không** viết mã màu trực tiếp trong thành phần. Bộ màu mới thay giá trị token, giữ tên:
```css
:root {
  --brand: …;   --on-brand: …;   --sun: …;   --sky: …;        /* nhấn chính / phụ */
  --bg: …;      --surface: …;    --ink: …;   --muted: …;      /* nền, chữ */
  --cat-*: …;   --d1: …; --d7: …;                              /* màu loại, màu ngày */
}
```
Mọi cặp chữ/nền đi qua `contrast-pairs-app.json`. Văn bản tiếng Việt thường ngày (thuật ngữ ở `design-system.md`).

## Testing Strategy
- **Màu:** mỗi phương án có bảng tỉ lệ tương phản tính bằng `contrast.mjs` (sáng + tối) trước khi đưa PO xem; không phương án nào có cặp < 4,5:1 cho chữ thường.
- **Ảnh thật:** 3 phương án × các màn đại diện (Khám phá, Bộ thẻ, Chuyến đi/Ngày, Chi phí, Thùng rác, Bảo mật) × 390 và 1280 × sáng và tối; xem từng ảnh. Sau khi PO chọn: chụp lại **toàn bộ** màn (`shots.mjs`).
- **Màn/luồng mới:** mỗi luồng mới có tệp `flow-defs/` chạy bằng playwright, không lỗi console; `a11y-scan --strict` sạch; Taste `--app` không thêm FAIL ngoài các FAIL PO đã giữ (DR-009).
- **Phản biện độc lập:** `wander-skeptic-qa` + `wander-product-analyst` (≤ 2 vòng, ≤ 6 lượt) trên bản đồ hành trình và màn mới.
- Chưa kiểm được: trình đọc màn hình, thiết bị thật, chữ phóng 200%, Firefox/Safari (RG-7) — vẫn nói thẳng như báo cáo trước.

## Boundaries
- **Luôn:** gọi kỹ năng bắt buộc theo `design-first.md` (`ui-ux-pro-max`, agent UX + UI có brief được ghi lại, `wander-skeptic-qa`, `systematic-debugging` khi lỗi chạy) và ghi "Công cụ đã dùng"; xem ảnh thật trước khi báo xong; hỏi PO bằng lựa chọn khi Tầng A.
- **Hỏi trước:** đổi nghĩa sản phẩm (ví dụ thêm chế độ "Hôm nay" là tính năng mới; xóa chuyến/chuyển giao thay DR-004; cơ chế đăng nhập quản trị Q-d); gỡ bất kỳ phần nào làm nên look DR-009; thêm thư viện giao diện.
- **Không bao giờ:** làm backend (migration/API/domain); sao chép thương hiệu Roameo; bịa số sao/giá/giờ mở cửa; sửa `docs/wander-master-plan.md`; commit khi PO chưa yêu cầu; báo "xong" khi chưa xem ảnh thật.

## Success Criteria
1. `journey-map.md` vẽ hành trình đầu–cuối (người mới → onboarding → khám phá → lưu → xếp ngày/chi phí → mời nhóm → dùng trong chuyến → thiết bị khác/khôi phục → hết phiên/lỗi); mỗi bước trỏ tới mã màn; **không còn bước trỏ vào màn "chưa có"** trừ mục PO đã chọn để lại (ghi rõ).
2. Mỗi lỗ hổng 1–9 ở Việc A được xử lý theo lựa chọn của PO: dựng màn, hoặc ghi rõ "ngoài 1a / để sau" ở `screens.md`.
3. `palette-options.md` + `palette-lab.html` có đúng 3 phương án (hướng ở Q5: **Trời xanh + cam**, **Nắng vàng**, **Lai**; tên và mã màu do agent UI đề xuất, mỗi bộ đối chiếu với các mã đo ở mục "Tham chiếu từ ảnh chụp"), mỗi phương án đủ token sáng + tối, bảng tương phản 0 lỗi, ảnh 5–6 màn đại diện.
4. PO chọn một bộ màu; áp xuống `app.css`/`admin.css`; `shots.mjs` chụp lại toàn bộ; `flows.mjs` 100% đạt; `contrast.mjs` + `a11y-scan --strict` sạch.
5. Phản biện độc lập không còn BLOCKER/MAJOR; PO duyệt bằng văn bản (`DR-012`).

## Open Questions (cần PO; mỗi câu có mặc định đề xuất, chưa phải quyết định)
| # | Câu hỏi | Mặc định đề xuất | Tầng |
|---|---|---|---|
| Q1 | **"Sử dụng thật" nghĩa là gì?** (a) chỉ tới lúc lập kế hoạch + chia sẻ xong; (b) cả lúc đang đi: có góc nhìn **"Hôm nay"** (kế hoạch ngày hiện tại, việc cần làm, chi phí đã tiêu, mở bản đồ) | (b) ở mức thiết kế khung: một màn "Hôm nay" đọc từ dữ liệu chuyến đã có, không thêm dữ liệu mới | **A** (thêm tính năng) |
| Q2 | **Onboarding lần mở đầu** | (a) 3 thẻ giới thiệu ngắn, bỏ qua được, hiện một lần; (b) vào thẳng Khám phá + vài gợi ý ngữ cảnh; (c) không có | **B** nếu chọn (a)/(b); tiêu chí của `design-spec.md`: người lạ làm được không cần hướng dẫn trong < 5 phút |
| Q3 | **Màn Cài đặt / Giới thiệu** (tên thiết bị, Về Wander, nguồn dữ liệu, quyền riêng tư, hỏi đáp) | Dựng khung gọn, gom từ Bảo mật + "Về dữ liệu" đã có, không thêm tùy chọn mới | B |
| Q4 | **Phạm vi quản trị** trong vòng này | Dựng khung tải ảnh + tạo điểm đến (nói thật là bản thử), không chốt Q-d | B (mức khung) / A (khi làm cơ chế) |
| Q5 | **Hướng màu chủ đạo** muốn thấy trước (sau khi đo ảnh: vàng đúng nghĩa ít xuất hiện ở Roameo, chủ đạo là cam + xanh trời + trắng) | 3 hướng để so ảnh thật: **(1) Trời xanh + cam** (nền trắng/xanh trời, nút cam, thẻ pastel; sát ảnh nhất), **(2) Nắng vàng** (vàng/hổ phách làm chủ đạo, xanh nhạt phụ), **(3) Lai** (xanh trời nền + vàng nhấn + cam nút) | B |
| Q6 | ~~Tham chiếu Roameo~~ | **Đã có** (`docs/UI-sample/`, 50 ảnh; em đã xem đủ 50) | — |
| Q7 | **Màu loại và màu ngày** (D1–D7) có đổi theo bộ màu mới không | Có, tính lại sáng/nhiều sắc hơn (mức "pastel đậm vừa" như ảnh đo) nhưng vẫn phân biệt được, kèm biểu tượng, chữ trên nền đạt ≥ 4,5:1 | B |
| Q8 | **Mở rộng tạo chuyến theo bước** (ai đi, sở thích, ngày linh hoạt) và **bản đồ tuyến theo ngày** như ảnh tham chiếu | Chỉ thiết kế khung nếu PO muốn; đổi nghĩa tạo chuyến (plan D16/R5, "Dự kiến N ngày" A3) nên **không tự làm** | **A** |
| Q9 | **Bước nhập địa điểm từ mạng xã hội/Google Maps** và **dùng thử trả phí** (có trong ảnh) | Không làm: không có trong plan, tiền hóa hoãn | A (nếu PO muốn) |

## Kế hoạch sau khi PO duyệt (chưa làm; lưu ý để PO biết khối lượng)
1. `planning-and-task-breakdown` → `plan.md`/`todo.md` (hai nhánh: A hành trình, B màu).
2. Nhánh B trước (nhanh, có thể xem sớm): brief cho agent UX + UI (ghi lại), 3 bộ màu, `palette-lab.html`, ảnh, PO chọn.
3. Nhánh A: `journey-map.md`, dựng các màn thiếu theo lựa chọn, luồng bấm thật, chụp ảnh, phản biện.
4. Áp bộ màu đã chọn lên toàn app, chụp lại, phản biện vòng cuối, `DR-012`.
