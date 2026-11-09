# Chuẩn mã front-end của Wander (PO, 26/10/2026)

> **Trạng thái:** phần **PO nêu** (bảng §0: common hóa, SOLID, comment, không hard-code, tệp const, OOP, thành phần dùng lại, tổ chức lại source) = `APPROVED` (lời PO "bắt buộc áp dụng"). Phần **em cụ thể hóa** = `PROPOSED` (Tầng B, đảo ngược được): cấu trúc thư mục chi tiết §1, giới hạn ~250/~40 dòng, ngân sách hiệu năng §4 (các con số 170 KB, LCP 2,5 s là mặc định chưa đo, `UNVERIFIED`), bản dịch ACID §6, ví dụ thuật toán §10. **Công cụ ép buộc** §9 là Tầng A (thêm devDependency), chờ PO (G3).
> **Áp dụng cho:** `web/` (React 19 + TypeScript + Vite) ở **pha dựng FE** và mọi mã mới của prototype. Prototype `docs/ux/prototype/` là tài liệu thiết kế, không phải mã sản phẩm; mã cũ của nó không bị viết lại, nhưng mã mới/đã chạm vào theo chuẩn này (đã làm ở `app/consts.js`, `app/screens.css`, `tokens.css`).
> **Quy tắc ngắn cho agent:** `.claude/rules/frontend.md`.

## 0. Lời PO (nguyên văn, rồi cách hiểu)
| Yêu cầu của PO | Cách hiểu và áp dụng |
|---|---|
| Common hóa; áp dụng pattern hiện đại, hiệu quả | §2, §3 |
| Cải thiện hiệu năng | §4 (có ngân sách đo được) |
| Bắt buộc áp dụng SOLID và ACID | SOLID: §5. **ACID là thuộc tính giao dịch cơ sở dữ liệu**, nên không "áp dụng" nguyên văn cho FE; phần FE tương ứng ở §6 (đề nghị PO xác nhận cách hiểu). Phía backend đã có ACID thật (PostgreSQL, `@Transactional`, `@Version`) |
| Phải có comment trước mỗi method | §7 |
| Tổ chức lại source, đặt tên file có nghĩa, theo quy tắc chung | §1 |
| Không hard-code chuỗi hay số | §8 |
| Có file const cho điểm chung, tái sử dụng hiệu quả | §8 |
| Tập trung viết code base, áp dụng OOP dễ hiểu để dễ bảo trì | §5 (OOP trong React: nói rõ ranh giới) |
| Có component tái sử dụng, thuật toán và giải pháp hiệu quả | §2, §10 |

## 1. Cấu trúc thư mục và đặt tên
```
web/src/
  app/                    khởi tạo: main.tsx, App.tsx, router, providers (context)
  features/<tên-tính-năng>/   identity, trips, discover, planning, security …
    components/           chỉ dùng trong tính năng này
    hooks/                useTripDays.ts, useRecovery.ts …
    api/                  trips.api.ts (gọi máy chủ qua ApiClient)
    model/                kiểu + lớp miền: Trip.types.ts, TripDateRange.ts
    index.ts              cổng công khai của tính năng (chỉ export những gì bên ngoài được dùng)
  shared/
    ui/                   bộ thành phần dùng chung: Button, Chip, Sheet, Field, Toast (một thành phần = một thư mục)
    lib/                  hàm thuần: money.ts, dates.ts, geo.ts (kèm test)
    const/                *.const.ts (xem §8)
    types/                kiểu dùng chung
    api/                  ApiClient.ts, ApiError.ts, errorMessages.const.ts
  styles/                 tokens.css (nguồn màu duy nhất), reset.css, global.css
```
- **Tên tệp:** thành phần `PascalCase.tsx` (một thành phần chính mỗi tệp); hook `useXxx.ts`; hàm thuần `camelCase.ts`; kiểu `Xxx.types.ts`; hằng số `xxx.const.ts`; API `xxx.api.ts`; test `Xxx.test.tsx` cạnh tệp. Thư mục `kebab-case` (hoặc tên tính năng một từ).
- **Hướng phụ thuộc một chiều:** `app → features → shared`. `shared` không import `features`; tính năng này không import ruột của tính năng khác (chỉ qua `index.ts`). Kiểm bằng công cụ (§9), như `ArchitectureTest.java` ở backend.
- (`PROPOSED`) Một hàm không quá ~40 dòng (lint: 60); quá thì tách. (Con số này là hằng số của quy tắc lint, đặt ở cấu hình, không rải trong mã.) **PO bỏ giới hạn số dòng của TỆP (09/11/2026):** không còn quy tắc `max-lines`; vẫn nên tách tệp khi nó gánh nhiều trách nhiệm (SOLID), không phải vì đếm dòng.

## 2. Pattern (trong stack đã duyệt, không thêm thư viện)
- **Tách trình bày và logic:** thành phần chỉ dựng giao diện từ props/hook; logic nằm trong custom hook hoặc lớp dịch vụ. Thành phần "container" (nối dữ liệu) mỏng, thành phần "presentational" thuần.
- **Trạng thái:** hợp nhất kiểu (discriminated union) cho trạng thái tải: `{ status: 'loading' } | { status: 'error', error } | { status: 'ready', data }`; không dùng hai cờ `isLoading`/`isError` lệch nhau. Thư viện trạng thái (TanStack Query…) là **Tầng A (AD-4)**: chưa dùng; trong lúc chờ, một hook `useResource` của riêng dự án gói fetch + hủy + lỗi.
- **Biến thể bằng bảng, không chuỗi if:** `const VARIANTS: Record<ButtonKind, Style>`; thêm biến thể = thêm một dòng (mở rộng, không sửa).
- **Composition thay vì kế thừa:** thành phần ghép từ thành phần nhỏ (`Sheet` + `SheetHeader` + `SheetActions`).
- **Lỗi:** mọi lỗi API qua `ApiError` (mã máy chủ → thông điệp tiếng Việt ở `errorMessages.const.ts`); ranh giới lỗi (`ErrorBoundary`) ở cấp tính năng.
- **Truy cập:** `aria-*`, focus, vùng chạm 44 px là một phần của thành phần dùng chung, sửa một lần dùng mọi nơi (kết quả `a11y-scan.mjs`).

## 3. Thành phần dùng lại (bộ tối thiểu)
`Button`, `IconButton`, `Chip`, `Field` (nhãn + ô nhập + gợi ý + lỗi), `Sheet`/`Dialog` (bẫy focus, Esc), `Toast` (có Hoàn tác), `PhotoCard`, `Segmented`, `EmptyState`, `Skeleton`. Mỗi thành phần: props có kiểu, ví dụ trong `docs/ux/components.html` (nguồn thiết kế), test truy cập. Màu/khoảng cách **chỉ** qua token CSS.

## 4. Hiệu năng (có ngân sách, đo bằng công cụ, không đoán)
Các con số là **đề xuất mặc định (Tầng B)**, ghi ở `shared/const/performance.const.ts` và kiểm trong CI:
- JS ban đầu ≤ 170 KB gzip; tải tuyến theo trang bằng `React.lazy` + `Suspense`.
- LCP ≤ 2,5 s ở 4G giả lập; ảnh có `width/height` (không dịch chuyển bố cục), `loading="lazy"` dưới màn hình đầu, định dạng WebP/AVIF qua `srcset` khi có.
- Danh sách > 100 dòng thì ảo hóa; ô tìm kiếm debounce; không đo layout trong vòng lặp.
- `memo`/`useMemo`/`useCallback` **chỉ khi đã đo** có render thừa (không rải sẵn). Dữ liệu dẫn xuất tính một lần (selector), không tính lại trong render.
- Chuyển động chỉ `transform`/`opacity`; tôn trọng `prefers-reduced-motion`.

## 5. SOLID và OOP trong React + TypeScript
React hiện đại dùng **thành phần hàm**; ép lớp (class component) cho giao diện là đi ngược hệ sinh thái. Vì vậy: **OOP áp cho lớp miền và dịch vụ, nguyên lý SOLID áp cho toàn bộ mã.**
| Nguyên lý | Áp dụng cụ thể |
|---|---|
| **S** — một lý do để đổi | Thành phần chỉ dựng UI; tính toán nằm ở `shared/lib` hoặc lớp miền; gọi mạng nằm ở `*.api.ts` |
| **O** — mở để thêm, đóng để sửa | Biến thể/loại mục bằng bảng ánh xạ hoặc đối tượng chiến lược (`ItemKindStrategy`), thêm loại mới không sửa chỗ khác |
| **L** — thay thế được | Mọi cài đặt của một giao diện (`TripRepository`: HTTP và bản giả cho test) hoạt động như nhau |
| **I** — giao diện nhỏ | Props nhỏ, cụ thể; không truyền cả đối tượng `Trip` khi chỉ cần `title` |
| **D** — phụ thuộc vào trừu tượng | Thành phần nhận `TripRepository`/`Clock` qua context/props, không gọi `fetch` hay `Date.now()` trực tiếp (dễ test, đổi nguồn dễ) |
- **Lớp miền (OOP dễ hiểu):** đối tượng giá trị bất biến có hành vi: `Money` (nghìn đồng ↔ VND đầy đủ, định dạng `1.500.000 ₫`, chống số âm — D17/D18), `DateRange`, `RecoveryCode` (chuẩn hóa/so khớp). Lớp dịch vụ: `ApiClient`, `SessionStore`. Kiểu `private`/`readonly`, hàm tạo kiểm tra bất biến (quy tắc giống `Trip` ở backend).
- **Nhất quán với backend:** cùng tên khái niệm (Trip, Day, Item, Rest, Task), cùng mã lỗi (`docs/ux/error-codes.md`), cùng giới hạn (§8).

## 6. "ACID" phía FE (bản dịch sang việc làm được)
| Thuộc tính | Việc tương ứng ở FE |
|---|---|
| **A**tomic | Cập nhật lạc quan áp dụng trọn vẹn hoặc hoàn lại trọn vẹn khi lỗi (snapshot trước, khôi phục khi thất bại — mô hình đã có ở prototype `snapshot/restore` cho Hoàn tác) |
| **C**onsistent | Một nguồn sự thật cho mỗi loại dữ liệu; bất biến kiểm ở hàm tạo lớp miền; xung đột phiên bản (`@Version` → `409`) xử lý bằng màn "tải bản mới nhất" |
| **I**solated | Hai thao tác cùng lúc trên cùng đối tượng không trộn trạng thái: hủy yêu cầu cũ (`AbortController`), khóa nút khi đang gửi, gửi kèm `Idempotency-Key` cho thao tác tạo (cần backend hỗ trợ: ghi vào danh sách việc backend) |
| **D**urable | Không mất bản nháp: giữ form đang nhập khi đổi cỡ/đóng nhầm (đã có ở prototype), lưu nháp cục bộ có chủ đích; dữ liệu thật luôn ở máy chủ |
Phía **backend** ACID là thật và đã có (`docs/architecture/README.md`, ADR-003). Nếu PO muốn nghĩa khác của "ACID" cho FE, nói để chỉnh mục này.

## 7. Chú thích trước mỗi hàm/phương thức
- **Bắt buộc** một khối TSDoc `/** … */` trước **mọi** hàm, phương thức, hook, thành phần (kể cả hàm nhỏ). Nội dung: **một câu tiếng Việt nói hàm LÀM GÌ và vì sao khi không hiển nhiên**; `@param`/`@returns` khi kiểu chưa đủ nói rõ; `@throws` nếu có.
- Không viết chú thích lặp lại tên hàm ("hàm lấy chuyến đi"). Chú thích nói điều mà tên không nói (ràng buộc, đơn vị, trường hợp biên: ví dụ "tiền tính bằng nghìn đồng, null là chưa biết, 0 là biết bằng không").
- Lưu ý: quy ước chung của máy này ("chú thích vừa phải như mã xung quanh") **bị quy tắc này thay thế cho `web/`** vì PO nêu rõ.

## 8. Không hard-code chuỗi/số; tệp hằng số
- **Chuỗi hiển thị** (tiếng Việt) ở `shared/const/copy.vi.ts` theo nhóm (`COPY.trip.create.title`); thành phần nhận chuỗi từ đó (sẵn sàng cho i18n). Chuỗi kỹ thuật (tên sự kiện, khóa lưu trữ) ở `storage.const.ts`, `routes.const.ts`.
- **Số:** giới hạn nghiệp vụ (`MAX_TRIP_DAYS = 366`, `MAX_STYLES = 5`, `MAX_BUDGET_THOUSAND_VND = 1_000_000_000`), thời lượng, ngưỡng cử chỉ (`SWIPE_DISTANCE_PX`), điểm ngắt, kích thước tối thiểu (`TAP_TARGET_PX = 44`) ở `limits.const.ts`, `motion.const.ts`, `layout.const.ts`. Giới hạn nghiệp vụ **phải khớp backend** (cùng giá trị; có test đối chiếu hoặc sinh từ một hợp đồng).
- **Màu, khoảng cách, chữ:** chỉ qua token CSS ở `styles/tokens.css` (bộ màu thương hiệu duy nhất). Không hex trong TSX/CSS ngoài `tokens.css`.
- Hằng số `as const`/`Object.freeze`, tên `UPPER_SNAKE_CASE` cho giá trị đơn, `camelCase` cho nhóm. Không logic trong tệp hằng số.
- Ngoại lệ được ghi: `0`, `1`, `-1`, `100` (phần trăm), chuỗi rỗng; mọi ngoại lệ khác phải có hằng số có tên.

## 9. Ép buộc bằng công cụ (CHỜ PO: Tầng A vì thêm devDependency)
Đề xuất cấu hình ở pha dựng FE, để chuẩn này tự kiểm thay vì dựa vào trí nhớ:
| Quy tắc | Công cụ (devDependency) |
|---|---|
| Chú thích trước mọi hàm (§7) | `eslint-plugin-jsdoc` (`jsdoc/require-jsdoc`, `require-description`) |
| Không số ma thuật (§8) | ESLint `no-magic-numbers` (ngoại lệ 0, 1, -1) |
| Không chuỗi cứng trong JSX (§8) | `react/jsx-no-literals` (eslint-plugin-react) |
| Không hex ngoài token (§8) | `stylelint` + `color-no-hex` |
| Hướng phụ thuộc (§1) | `eslint-plugin-boundaries` hoặc `dependency-cruiser` |
| Kích thước hàm (§1) | ESLint `max-lines-per-function` (giới hạn dòng của tệp đã bỏ 09/11/2026) |
| Ngân sách JS (§4) | `size-limit` hoặc kiểm gói trong CI |
| Truy cập (§2) | `eslint-plugin-jsx-a11y` + `docs/ux/tools/a11y-scan.mjs` trên bản dựng |
Cho tới khi PO duyệt: cùng các quy tắc áp dụng bằng rà soát (`wander-code-reviewer` kiểm theo chuẩn này).

## 10. Thuật toán và giải pháp (những chỗ đã biết có thể sai về hiệu quả)
- **Sắp xếp thủ công trong ngày:** lưu thứ tự theo số nguyên `ord` thưa (bước 1024) hoặc chỉ mục phân số để chèn giữa không đánh số lại cả danh sách; hiện prototype dùng `ord` liền kề (O(n) mỗi lần chèn, đủ cho ≤ 50 mục/ngày, ghi lại để đổi khi cần).
- **Gán mục vào ngày / tổng chi phí:** gom một lần bằng `Map` theo ngày (O(n)), không lọc lặp theo từng ngày (O(n·d)).
- **Khoảng cách:** haversine × hệ số đường núi (ước tính, có nhãn) tính một lần cho mỗi cặp và nhớ lại.
- **Tìm kiếm điểm đến:** bỏ dấu một lần khi nạp dữ liệu, so khớp trên chuỗi đã chuẩn hóa; debounce nhập.
- **Danh sách dài:** ảo hóa; ảnh lazy; tránh render lại cả danh sách khi đổi một dòng (key ổn định, `memo` ở dòng sau khi đo).

## 11. Việc cần làm khi bắt đầu pha FE
1. PO chọn công cụ ép buộc ở §9 (Tầng A).
2. Dựng khung thư mục §1 và `shared/const`, `styles/tokens.css` (sao từ `docs/ux/prototype/tokens.css`).
3. Chuyển `web/src/*.tsx` hiện tại (≈2,3K dòng, chưa theo chuẩn này) sang cấu trúc tính năng khi dựng lại từ prototype đã duyệt; **không** sửa dần `web/` hiện tại trước đó (sẽ bị thay), trừ khi PO muốn khác.
4. `wander-code-reviewer` kiểm mọi PR FE theo chuẩn này.
