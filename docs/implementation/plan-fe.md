# Kế hoạch pha FE: dựng `web/` từ prototype v6 (PO chọn 26/10/2026, `DR-019`)

> Ghi ở tệp riêng vì `plan.md`/`todo.md` là kế hoạch thiết kế DG-1 còn việc dở (không ghi đè). Danh sách việc: `todo-fe.md`. Chuẩn mã: `docs/architecture/frontend-standards.md` (bắt buộc). Nguồn thiết kế: `docs/ux/prototype/` (hành vi `app/app.js`, màu `tokens.css`, ảnh `docs/ux/screenshots/`). Quyết định: `DR-017/018/019`.

## Tổng quan
Thay `web/` (≈2,3K dòng, chưa theo chuẩn) bằng ứng dụng React 19 + TypeScript dựng từ prototype đã duyệt, cấu trúc theo tính năng, **API giả** (kho biên tập thật + lưu cục bộ) cho tới khi backend nối. Bản cũ còn trong git (`b6bd606`).

## Quyết định kỹ thuật (Tầng B, đảo ngược được; ghi ở `decisions.md`)
- **Không thêm thư viện chạy** (AD-4 giữ nguyên: không TanStack Query, không thư viện router): định tuyến hash tự viết nhỏ (`shared/router`), `useResource` tự viết.
- **devDependency ép chuẩn đã được PO duyệt (G3)**: ESLint + `eslint-plugin-jsdoc`, `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-boundaries`, `typescript-eslint`, `stylelint`. Chưa thêm `size-limit` (dùng kiểm kích thước gói bằng script).
- **Kiểm thử**: `node --test` (Node 24 chạy TypeScript trực tiếp) cho lớp miền và hàm thuần, không thêm Vitest; kiểm giao diện bằng Playwright sẵn có (`docs/ux/tools`), vì dự án đã dùng.
- **Kho API giả**: `TripRepository`/`CatalogRepository` là giao diện (D trong SOLID); bản `Local*` (localStorage + `/data/catalog/*.json`) bây giờ, bản `Http*` khi backend nối.
- **Màu**: `styles/tokens.css` sao nguyên từ prototype (nguồn duy nhất); CSS theo tính năng, không hex.

## Đồ thị phụ thuộc
```
FE-0 khung + hằng số + token + lint ─ FE-1 miền (Money, DateRange, kho API giả) ─ FE-2 bộ thành phần dùng chung
FE-2 ─ FE-3 khám phá (trang chủ, điểm đến, thẻ quẹt, Đã chọn, chi tiết địa điểm) ─ FE-4 bản đồ (TerrainMap)
FE-1,2 ─ FE-5 chuyến đi (tạo, ngày, mục, chi phí) ─ FE-6 xóa/Hoàn tác/Đã xóa ─ FE-7 danh tính + mã + thiết bị + khôi phục
FE-3 ─ FE-8 giới thiệu lần đầu + lịch mẫu ; FE-5..7 ─ FE-9 hôm nay/cài đặt/lỗi/xuất ; FE-10 nối backend (sau)
```
## Cổng kiểm mỗi lát
`npm run typecheck && npm run lint && npm test && npm run build`; ảnh chụp 390 và 1280 px của đúng màn đó và **xem ảnh**; `a11y-scan` cho màn mới; `wander-code-reviewer` theo chuẩn FE ở cuối mỗi cụm.

## Rủi ro
| Rủi ro | Mức | Giảm |
|---|---|---|
| Prototype ~210 KB JS thuần, nhiều hành vi ngầm; port sót | Cao | Mỗi lát đối chiếu ảnh chụp và luồng `flows.mjs` tương ứng; giữ prototype làm chuẩn so sánh cạnh nhau |
| TypeScript 7 + ESLint plugin chưa tương thích | Trung | Thử cài ở FE-0; nếu lỗi, ghi và dùng phiên bản gần nhất chạy được |
| e2e cũ (`e2e/browser.test.ts`) hỏng vì `web/` thay | Cao, đã biết | Ghi trong todo FE-10; viết lại theo giao diện mới khi nối backend |
| Số lượng việc quá lớn một phiên | Cao | Làm theo lát, dừng ở cổng kiểm, báo phần còn lại |

## Còn mở (không chặn FE-0…FE-3)
Nền tối; minh họa 3D thật; sao đánh giá (cấm bịa); câu Tầng A riêng của N-1/N-3/N-4 (DR-018 §5).
