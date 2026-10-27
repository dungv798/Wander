---
paths:
  - web/**
  - e2e/**
  - docs/ux/prototype/**
---
# Front-end conventions (React 19 + Vite + TypeScript)

**Chuẩn đầy đủ (PO, 26/10/2026): `docs/architecture/frontend-standards.md`. Đọc trước khi viết hoặc rà mã FE.** Tóm tắt bắt buộc:

- **Cấu trúc:** `app/` · `features/<tên>/{components,hooks,api,model,index.ts}` · `shared/{ui,lib,const,types,api}` · `styles/tokens.css`. Phụ thuộc một chiều `app → features → shared`. Tên tệp có nghĩa: `PascalCase.tsx`, `useXxx.ts`, `xxx.api.ts`, `xxx.const.ts`, `Xxx.types.ts`.
- **Mọi hàm/phương thức/hook/thành phần có khối TSDoc trước nó** (một câu tiếng Việt nói LÀM GÌ + điều tên không nói: đơn vị, trường hợp biên). Quy tắc này thay cho "chú thích vừa phải" ở `web/`.
- **Không hard-code chuỗi hay số:** chữ hiển thị ở `shared/const/copy.vi.ts`; giới hạn, thời lượng, ngưỡng ở `*.const.ts` (khớp backend); màu/khoảng cách chỉ qua token CSS (`styles/tokens.css`, bộ màu thương hiệu duy nhất; không hex ngoài tệp đó).
- **SOLID** cho mọi mã; **OOP** cho lớp miền và dịch vụ (`Money`, `DateRange`, `RecoveryCode`, `ApiClient`); thành phần UI là hàm (idiom của React), tái sử dụng bằng ghép thành phần. Thành phần dùng chung ở `shared/ui`, không sao chép.
- **ACID** là thuộc tính của DB (backend đã có). Phía FE áp dụng bản dịch ở mục 6 của chuẩn (cập nhật lạc quan hoàn lại được, nguồn sự thật duy nhất, hủy yêu cầu cũ, không mất bản nháp).
- **Hiệu năng có ngân sách** (JS ban đầu ≤ 170 KB gzip, tải theo tuyến, ảnh có kích thước + lazy, chỉ `memo` khi đã đo).
- Công cụ ép buộc đã được PO duyệt (G3, DR-018) và đã cài ở `web/`: eslint, jsdoc, react, jsx-a11y, boundaries, stylelint.

## Giữ từ trước
- All server calls go through `web/src/api.ts` (sẽ thành `shared/api/ApiClient.ts`); it is the API contract with `backend/` — change both sides together and keep error codes in its `MESSAGES` map.
- UI copy is Vietnamese; money shows full VND (`1.500.000 ₫`, D17). Mobile-first (e2e uses a 390×844 viewport); **light mode first, dark mode later** (PO 26/10/2026).
- Session secret currently lives in `localStorage` (RG-6, decision AD-1 pending) — do not add other storage of secrets.
- E2E (`e2e/browser.test.ts`) runs against the Java backend via `WANDER_BASE_URL` (`tools/dev.ps1 e2e`). Wait for the DOM to reflect a change before asserting (toasts can appear before the list reloads).
- Framework or state-library changes (Next.js, TanStack Query…) are Tier A (AD-4).
- Prototype (`docs/ux/prototype/`): mã MỚI theo chuẩn trên (hằng số ở `app/consts.js`, màu chỉ qua `tokens.css`, CSS mới ở `app/screens.css`); không viết lại mã cũ chỉ để đúng chuẩn.
