import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('web/src');
const rows = [];
/** Duyệt mọi TSX để không bỏ sót điều khiển cục bộ hoặc màn tải lười. */
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (file.endsWith('.tsx')) {
      const source = fs.readFileSync(file, 'utf8');
      const matches = [...source.matchAll(/<(Button|IconButton|ChipToggle|Chip|CheckRow|button|a|input|summary)\b([^>]*(?:\{[^}]*\}[^>]*)?)>/g)];
      for (const match of matches) {
        const line = source.slice(0, match.index).split('\n').length;
        const cls = match[2].match(/className=("[^"]*"|'[^']*'|\{[^}]*\})/)?.[1] ?? 'mặc định/thành phần';
        const state = [...match[2].matchAll(/(?:aria-(?:pressed|selected|current|expanded|disabled)|disabled|checked|pressed|kind|tone)=("[^"]*"|\{[^}]*\})/g)].map(x => x[0]).join('; ') || 'mặc định';
        if (match[1] === 'input' && !/checkbox|radio|switch/.test(match[2])) continue;
        rows.push(`| ${path.relative(process.cwd(), file).replaceAll('\\', '/')}:${line} | ${match[1]} | ${cls.replaceAll('|', '\\|').replaceAll('\n', ' ')} | ${state.replaceAll('|', '\\|').replaceAll('\n', ' ')} | Theo vật liệu chung bên trên; kiểm runtime ở audit.json |`);
      }
    }
  }
}
walk(root);
const content = `# Kiểm kê nút/chip — PO 30/10/2026

Phạm vi: mọi TSX trong web/src, gồm cả native button/link, checkbox/radio, các thành phần dùng chung và features. ${rows.length} vị trí sử dụng được liệt kê dưới đây; dữ liệu runtime 8 màn nằm ở before/audit.json và after/audit.json (nền, viền, shadow, kích thước, trạng thái, tương phản).

## Loại, vật liệu, trạng thái và vấn đề

| Loại / nơi định nghĩa | Nền / viền sau sửa | Trạng thái / nơi dùng | Vấn đề trước sửa / xử lý |
|---|---|---|---|
| Button primary / shared/ui/Button.tsx | Nắng vàng --sun; viền --control-accent | CTA chính home, deck, trip, form; disabled vẫn đọc rõ | Gradient cam/vàng lẫn nền vàng nhạt → một màu CTA |
| Button secondary, ghost, sun, danger | Kính --control-surface; --control-edge đều bốn cạnh; danger chữ/viền --skip | Form, xác nhận phụ, hủy, khôi phục, xóa | .sun nền vàng đặc → kính; thêm kind secondary |
| IconButton / shared/ui/IconButton.tsx | Kính trung tính; icon trên ảnh có scrim tối | Đóng Sheet, Back, sửa, gallery | Saturate 2 và bóng inset đáy gây nhòe xanh/gạch tối → saturate .8; bỏ inset |
| Chip / shared/ui/Chip.tsx; mchip | Kính trung tính; chip glass trên ảnh giữ scrim tối | Nhãn chỉ đọc, metadata Đã đặt, category, mùa | Nền vàng nhạt theo loại → kính; nhãn đọc không áp vùng chạm |
| ChipToggle / shared/ui/Controls.tsx | Kính; chọn = lớp Nắng vàng .18 + viền nhấn | Bộ lọc, sở thích, booking Chờ xác nhận/Đã đặt | Gạch chân, chữ tăng 600→800 làm rộng hộp; nay 700 cố định, check có chỗ sẵn và fade 120ms |
| Native fchip, pack, dchip, dtab, opt | Cùng kính/viền; chọn nền .18 | Deck filters, packing, ngày chuyến, lựa chọn form | Native fchip/pack có check CSS giữ sẵn chỗ; không cần sửa markup features |
| Controls CheckRow / checkbox | Nền input hệ điều hành; nhãn bấm cả hàng | Đã bao gồm, xác nhận bảo mật | Giữ checked native; nhãn chứa vùng chạm |
| Toast Hoàn tác / shared/ui/Toast.tsx | Kính trung tính; chữ --ink-fixed | Thông báo Undo; cùng hệ .undo-control | base.css .toast button text-decoration underline → none; không bóng đáy |
| Sheet / shared/ui/Sheet.tsx | Sheet là container; button con theo hệ chung | Close, CTA, lựa chọn, cancel | Không sửa vòng đời/focus Sheet; bỏ xung đột màu từ overlay.css bằng cascade chung |
| Linkbtn / a có class / button link | Không gạch chân; kính cho .linkbtn | Recover, settings, navigation, Undo nơi khác | Bỏ gạch chân điều khiển; liên kết văn xuôi không class giữ gạch chân |
| Round, gnav, credit, search, tab | Kính trung tính, scrim ảnh; tab chọn vàng trong | Bộ thẻ, gallery, home, tabbar | Giảm bão hòa; icon có đệm tương phản; CTA chọn giữ Nắng vàng |
| Native card/row/ghead/grow/resume/brand | Giữ bề mặt nội dung hiện hữu; vật liệu kính chung khi có | Home, destinations, trip, guide, onboarding, collaboration | Không biến thẻ nội dung thành CTA; font trạng thái chung kế thừa để không tăng kích thước nút map |

## Nguyên nhân xác nhận từ mã

- glass.css từng gạch chân tất cả aria-pressed/selected/current; base.css gạch chân toast button.
- --glass-shadow có inset đáy tối và --glass-rim có đoạn mực tối: đã bỏ bóng inset và tắt rim giả trên nhóm nút chung.
- --glass-saturation = 2; nay .8, thêm --control-surface trắng .94 để giảm màu xanh xuyên nền.
- Chờ xác nhận và Đã đặt đã dùng ChipToggle trong ItemEditorSheet.tsx: không cần đề xuất đổi markup booking cho job khác. Check trang trí ở shared/ui/Controls.tsx, aria-pressed giữ nguyên.
- Không thêm logic trộn class: không phát sinh unit test mới cho join class.

## Tất cả nơi dùng

| Tệp:dòng | Loại | Lớp | Trạng thái khai báo | Nền/viền/vấn đề |
|---|---|---|---|---|
${rows.join('\n')}
`;
fs.mkdirSync('.logs/ux-buttons', { recursive: true });
fs.writeFileSync('.logs/ux-buttons/audit.md', content);
console.log(`PASS inventory: ${rows.length} vị trí TSX; .logs/ux-buttons/audit.md`);
