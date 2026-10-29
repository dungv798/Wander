# Kết quả kiểm — style bản đồ 29/10/2026

| Lệnh thực chạy | Kết quả đã đọc | Log |
|---|---|---|
| `npm --prefix web run typecheck` | PASS, exit 0 | `.logs/typecheck-3.log` |
| `cd web; ./node_modules/.bin/eslint.cmd .` | PASS, exit 0 | `.logs/eslint-3.log` |
| `cd web; ./node_modules/.bin/stylelint.cmd "src/**/*.css"` | PASS, exit 0 | `.logs/stylelint-3.log` |
| `npm --prefix web test` | PASS, 228/228, exit 0; gồm 5 test mapStyle mới và các test native ghim/cụm/tuyến hiện có | `.logs/test-3.log` |
| `npm --prefix web run build` | PASS, exit 0; cảnh báo chunk >500 kB. Index 158,63 KB gzip; MapLibre tải động 298,14 KB gzip. Không dùng để khẳng định hiệu năng/GPU | `.logs/build-3.log` |
| `node docs/research/map/capture-offline.mjs` | PASS, exit 0; MapLibre render hình học giả, 0 lỗi map/page, 0 yêu cầu bên ngoài | `.logs/capture-offline.log` |
| `git diff --check -- web/src/shared/map docs/architecture/adr` | PASS, exit 0; chỉ có cảnh báo LF/CRLF | `.logs/diff-check.log` |
| E2E | NOT_RUN theo chỉ đạo | — |
| Liberty/tile thật, nhãn glyph thật, nghiệm thu đẹp/giống mẫu, GPU/băng thông | NOT_RUN do không mạng; Claude chụp thật sau | — |

Validator `validateStyleMin` chạy trong test trên fixture OpenMapTiles/Liberty mô phỏng sau biến đổi; không tải style thật. Test kiểm DEM/terrain/attribution bị bỏ, bất biến đầu vào, giữ thứ tự/filter/minzoom/maxzoom/độ dày casing, halo và ưu tiên tên Việt/tên gốc, format/ref/legacy name token, loader đọc token host và lỗi HTTP. Chưa xác minh độ phủ tên id/layer của Liberty hiện tại.

Ba vòng sửa–kiểm, không vòng thứ tư. Vòng 1: lỗi trong test do thiếu rootKey/zoom khi gọi createExpression. Vòng 2: các lệnh đều qua, 226 test. Vòng 3: bổ sung nhãn legacy và fill transportation, các lệnh đều qua, 228 test (workspace có worker khác thêm test). Log trước được giữ trong `.logs/`; không gán thay đổi ngoài phạm vi cho worker này.

Công cụ dùng: skill [wander-implement](../../../tools/codex-skills/wander-implement/SKILL.md), PowerShell/rg/git đọc diff, apply_patch, view_image, System.Drawing đọc pixel, Node test + style-spec validator, TypeScript, ESLint, Stylelint, Vite, Playwright-core/Chrome để chụp ngoại tuyến. Không delegate; không công cụ Claude Skill/graph callable; review chuyên gia NOT_RUN. Không có mục Tầng A mới cần PO duyệt trong gói này. Không sửa master plan, secrets, permissions, Git history; không commit/push/deploy.

Thay đổi ngoài phạm vi xuất hiện đồng thời trong workspace (features, shared/ui, styles, e2e, tài liệu khác) thuộc công việc khác và được giữ nguyên. Lệnh build sinh `web/dist` theo cấu hình hiện có, không sửa mã nguồn ngoài owned_paths.
