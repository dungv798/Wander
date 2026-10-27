# Phản hồi của PO 26/10/2026 → việc đã làm

> Bản ghi quyết định: `docs/decisions/DR-015-phan-hoi-thiet-ke-26-10.md`. Chuẩn mã FE: `docs/architecture/frontend-standards.md`. Em **không** đóng DG-2, không commit, không đụng backend và không sửa `web/`.

## 1. Cách xem (5 phút)
`node docs/ux/tools/serve.mjs` rồi mở (DevTools → thiết bị 390 px):
- Người mới: http://127.0.0.1:4177/?fresh=1 (3 cảnh onboarding; cảnh 2 và 3 tự chạy, đợi vài giây)
- Trang chủ: http://127.0.0.1:4177/?fresh=1&intro=0 → cuộn xuống; chạm "Bạn đang mê gì?" → bộ thẻ riêng loại đó
- Hà Giang → Bắt đầu quẹt → chọn 1–2 nơi → Xem đã chọn → Lưu → **Để sau, lưu chuyến đi luôn**
Ảnh chụp: `docs/ux/screenshots/app-*--390-sang.png`, `--1280-sang.png`.

## 2. Từng ý của anh
| Ý của anh | Trước | Sau | Ảnh |
|---|---|---|---|
| Một bộ màu thương hiệu, tái dùng toàn hệ thống; sáng trước, tối sau | Hai bộ token song song (`tokens.css` và khối riêng trong `app.css`), 6 màu loại + 7 màu ngày + tím "chờ duyệt", ~190 màu hex rải trong CSS | `tokens.css` là nguồn duy nhất: 4 họ màu (nắng/bơ, hổ phách/cam, trời xanh, mực) + xanh lá/đỏ chỉ cho trạng thái. Loại địa điểm cùng một giá trị (phân biệt bằng biểu tượng), ngày xoay 3 màu, "chờ duyệt" dùng họ trời xanh, bản đồ cùng bộ. Tối giữ khung, chưa chỉnh | `app-dest`, `app-info`, `app-explore` |
| Onboarding chưa wow, hook chưa giữ người | 3 ảnh + chữ | Cảnh 1: ảnh thật + 3 sự thật từ kho biên tập nổi lên + máy bay; cảnh 2: **bộ bài mẫu tự quẹt** (✓/✕, đếm "Đã chọn"); cảnh 3: **lịch mẫu tự xếp** 2 ngày × 2 nơi. Tiêu đề hiện từng chữ | `app-onb-1/2/3` |
| Trang chủ 6/10, đơn điệu, ít animation | Trời + quạt thẻ + 3 mục | Thẻ giữa đổi ảnh luân phiên, ghim nổi, dải tên nơi chạy ngang, "Bạn đang mê gì?", "Nên đi tháng này" cuộn ngang, ảnh lớn chuyển động chậm, hiện dần khi cuộn | `app-explore` |
| Trang Hà Giang nửa trang ảnh trống, lạc với nội dung | Bìa 300 px, nửa trên là trời | Bìa 250 px lấy nét vào ruộng bậc thang, có vùng và khẩu hiệu, 3 số nhanh, dải "Xem trước các nơi" | `app-dest` |
| Thẻ quẹt nhỏ, bất đối xứng, chữ đè hết ảnh | Chữ phủ ~45% ảnh; ở 1280 px thẻ chỉ 304 px | Ảnh nửa trên sạch; khối thông tin trắng riêng; ở 1280 px thẻ 520 px | `app-deck` |
| Chi tiết: thêm đánh giá / thông tin ngoài một đoạn dài | Ô tím + sơ đồ trước, đoạn dài | Nhận định "Wander gợi ý" lên đầu + lưới 6 thông tin nhanh; đoạn dài xuống cuối. **Điểm sao: chưa làm** (không có nguồn, không bịa) → G1 | `app-info` |
| Tờ "Lưu địa điểm thành chuyến đi?": nền chói; bấm vào thì nền đen | Ô nhập vàng đặc; tấm mờ đen 58% | Cùng nền với màn quẹt; ô nhập trắng viền rõ; tấm mờ nâu ấm 34% + làm mờ | `app-create`, `app-id-intro` |
| "Để sau" thì vẫn cho đi tiếp, cảnh báo 1 dòng | Ở tờ đầu "Để sau" **hủy** việc lưu; ở bước mã phải qua hộp cảnh báo 5 dòng + 2 nút | "Để sau, lưu chuyến đi luôn" lưu ngay (danh tính chưa có mã) + MỘT dòng nhắc dưới nút + thông báo sau khi lưu. Hộp 2 bước bỏ | `app-id-intro`, `app-id-skip` |
| Chuẩn FE (SOLID, ACID, comment, const, cấu trúc…) | Chưa có văn bản | `frontend-standards.md` + `.claude/rules/frontend.md`; mã mới của prototype theo chuẩn (`app/consts.js`, `app/screens.css`, token) | |

## 2b. Rà soát độc lập (2 lượt, trong ngân sách) và đã sửa
`wander-skeptic-qa` và `wander-product-analyst` đọc mã/tài liệu (không chạy trình duyệt). Đã sửa: (1) nút "Để sau" xuất hiện sai chỗ (ở Bảo mật/xác thực lại) và toast sai; (2) cảnh báo chỉ hiện một lần: thêm một dòng nhắc còn lại ở đầu danh sách chuyến khi chưa có mã, câu chữ thêm "không lấy lại được"; (3) "Để sau" ghi đè mã của danh tính mẫu ở "máy chủ" giả; (4) `monthRange` sai với tháng không liền nhau và vỡ khi thiếu dữ liệu, mùa trong cẩm nang đọc từ kho thay vì chuỗi cứng; (5) id cứng trong `consts.js` làm trắng màn nếu kho thiếu → rơi về địa điểm đầu; (6) ghi "ước tính" ở khoảng cách trên thẻ; (7) cắt chữ dài ở nhãn. **Chưa sửa (nêu thẳng):** hex còn trong SVG `miniMap`/`mapSvg` (đã về màu thương hiệu nhưng vẫn là chuỗi cứng trong JS); chưa có ca test đơn vị cho `monthRange`; chưa chụp 320 px, chữ 200%, ảnh lỗi cho các thẻ mới.

## 3. Lỗi cũ tìm thấy khi làm
- Nút "Ảnh sau" ở chi tiết địa điểm bị nền trắng, mất mũi tên: trùng tên lớp `.next` với thẻ gợi ý ở Tổng quan. Đã sửa.
- Các hàng cuộn ngang bị cuộn lệch 16 px khi mở (scroll-snap không có `scroll-padding`). Đã sửa.

## 4. Nói thẳng về FE
- Anh nói đúng: mã prototype là một tệp `app.js` 190 KB, CSS chồng 4 lớp vá nhau, ~190 màu hex cứng. Em **không** viết lại cả khối vì nó là tài liệu thiết kế sẽ bị thay và đã có luồng kiểm; em dọn phần chạm vào (màu về token, hằng số ra `consts.js`, CSS mới ở `screens.css`, bỏ quy tắc cũ bị thay).
- **ACID** là thuộc tính giao dịch của cơ sở dữ liệu; backend đã có. Ở FE em dịch thành 4 việc làm được (chuẩn §6). Anh xác nhận giúp (G4).
- **OOP:** lớp cho miền/dịch vụ (`Money`, `DateRange`, `ApiClient`), thành phần giao diện vẫn là hàm vì đó là cách React làm; SOLID áp cho tất cả.
- Quy tắc "comment trước mỗi method" **thay** quy ước chung "chú thích vừa phải" cho `web/`.
- `web/` hiện tại (~2,3K dòng) chưa theo chuẩn; em chưa đụng vì nó sẽ dựng lại từ prototype đã duyệt (G4).
