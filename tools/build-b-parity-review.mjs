import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const design = path.join(root, 'docs/design/liquid-review-2026-11-05');
const shotSet = process.argv.find(argument => argument.startsWith('--shots='))?.slice('--shots='.length) ?? 'b-parity-review-final';
const shots = path.join(root, '.logs/claude-handoff/screens', shotSet);
const output = path.join(design, 'app-b-current');
const screens = [
  ['home', '01-home', 'Khám phá Việt Nam'],
  ['dest', '02-destination', 'Một điểm đến: chọn cách khám phá', 'Đã đưa lại 4 trải nghiệm Hà Giang và ảnh gốc của demo vào catalog: chợ Đồng Văn, bữa sáng, Lũng Cẩm, khoảng dừng Mã Pì Lèng. Chọn và lưu vào lịch được; ghim ghi rõ là mốc khu vực.'],
  ['deck', '12-swipe', 'Quẹt trên bản đồ'],
  ['place-portrait', '03-detail-portrait', 'Chi tiết · ảnh dọc'],
  ['place-landscape', '04-detail-landscape', 'Chi tiết · ảnh ngang'],
  ['picked', '@picked', 'Đã chọn', 'Đã dùng danh sách như B; lưu vào chuyến vẫn giữ bộ sưu tập cho lần sau.'],
  ['create-sheet', '@create', 'Tạo chuyến'],
  ['trip-unassigned', '04-plan', 'Chưa xếp ngày'],
  ['trip-day1', '13-day', 'Lịch ngày'],
  ['trip-suggestion', '14-suggestion', 'Xem trước gợi ý'],
  ['trip-cost', '@cost', 'Chi phí'],
  ['trips-list', '15-trips', 'Chuyến đi của mình'],
  ['trip-share', '05-share', 'Chọn cách chia sẻ', 'B có link chỉ xem và sao chép chuyến mô phỏng; app hiện có mời nhóm và gửi PNG. Hai flow này chưa được chuyển.'],
  ['trip-people', '07-members', 'Người đi cùng'],
  ['trip-checklist', '08-checklist', 'Chuẩn bị cùng nhau'],
  ['trip-requests', '09-requests', 'Đề nghị và duyệt', 'App hiện hỗ trợ đề nghị xóa theo quyền của máy chủ.'],
  ['export-image', '10-export', 'Xem trước xuất lịch', 'PNG hoạt động; PDF và Calendar chưa triển khai.'],
  ['security', '11-security', 'Bảo mật và thiết bị'],
];

/** Chuỗi nội bộ vẫn được escape để tên/chú thích không trở thành HTML. */
function escape(text) { return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'); }

fs.mkdirSync(output, { recursive: true });
let copies = 0;
const sections = screens.map(([id, reference, title, note]) => {
  const devices = [390, 1440].map(width => {
    const filename = `${id}--${width}x${width === 390 ? 844 : 1000}.png`;
    const source = path.join(shots, filename);
    if (!fs.existsSync(source)) throw new Error(`Chưa có ảnh app thật: ${filename}`);
    fs.copyFileSync(source, path.join(output, filename));
    copies++;
    const approved = reference.startsWith('@') ? `app-b-reference/${reference.slice(1)}-${width}.png` : `harmony-review/${reference}-${width}.png`;
    if (!fs.existsSync(path.join(design, approved))) throw new Error(`Thiếu ảnh B nguyên gốc: ${approved}`);
    return `<div class="pair" data-width="${width}"><figure><figcaption>B tham chiếu</figcaption><a href="${approved}" target="_blank"><img loading="lazy" src="${approved}" alt="${escape(title)} · B"></a></figure><figure><figcaption>App thật · cùng kích thước</figcaption><a href="app-b-current/${filename}" target="_blank"><img loading="lazy" src="app-b-current/${filename}" alt="${escape(title)} · app"></a></figure></div>`;
  }).join('');
  return `<section id="${id}"><h2>${escape(title)}</h2>${note ? `<p class="gap">${escape(note)}</p>` : ''}${devices}</section>`;
}).join('\n');
const nav = screens.map(([id, , title]) => `<a href="#${id}">${escape(title)}</a>`).join('');
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wander · B và app thật</title><style>
:root{font:15px/1.6 system-ui,sans-serif;color:#243740;background:#eaf2f3}*{box-sizing:border-box}body{margin:0}header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:14px 24px;background:#f4faf5f2;border-bottom:1px solid white;backdrop-filter:blur(20px)}header strong{font-size:19px}a{color:inherit;text-underline-offset:4px}button{font:inherit;cursor:pointer;padding:8px 18px;background:#ffffffb8;border:1px solid #dbe5e3;border-radius:99px;color:inherit}button[aria-pressed=true]{background:white;border-color:#e5baa0}main{max-width:1500px;margin:auto;padding:24px}.intro{max-width:900px}.intro p{margin:8px 0 18px}.flow-nav{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px}section{scroll-margin-top:110px;margin:42px 0;padding:20px;background:#ffffff70;border:1px solid white;border-radius:24px}h1,h2{line-height:1.3}h1{margin:0;font-size:27px}h2{font-size:21px}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;justify-content:center}.pair[data-width="390"]{max-width:800px;margin:auto}.pair[data-width="1440"]{display:none}body[data-device=desktop] .pair[data-width="390"]{display:none}body[data-device=desktop] .pair[data-width="1440"]{display:grid}figure{margin:0;min-width:0}figcaption{padding:6px 0 12px;font-size:13px;color:#637b84}img{display:block;width:100%;height:auto;border-radius:16px;box-shadow:0 8px 30px #2437400c}.gap{padding:12px 16px;border-left:3px solid #f57932;background:#fff9f3;border-radius:8px}footer{padding:12px 0 30px;color:#637b84;font-size:13px}@media(max-width:700px){header{padding:12px;gap:10px}main{padding:14px}section{padding:12px}.pair{gap:10px}h1{font-size:23px}figcaption{font-size:11px}}
</style></head><body data-device="mobile"><header><strong>Wander · B / app thật</strong><a href="http://127.0.0.1:8787/" target="_blank">Mở app</a><a href="panorama.html" target="_blank">Mở demo B</a><button data-device="mobile" aria-pressed="true">Điện thoại</button><button data-device="desktop" aria-pressed="false">Desktop</button></header><main><div class="intro"><h1>Đối chiếu từng màn và điểm chuyển flow</h1><p>Bên trái là ảnh từ prototype B nguyên gốc, bên phải là app React chạy với backend thật. Dữ liệu/ảnh có thể khác; các flow chưa chuyển được ghi rõ. Đây là tài liệu rà soát, không phải tuyên bố đã giống 100% hay đã được duyệt lại.</p><nav class="flow-nav">${nav}</nav></div>${sections}<footer>36 ảnh app thật ở 390×844 và 1440×1000. Bấm ảnh để xem nguyên kích thước. Ảnh không thay kiểm thử thao tác hoặc đánh giá trực tiếp trên iPhone.</footer></main><script>for(const button of document.querySelectorAll('button[data-device]'))button.addEventListener('click',()=>{document.body.dataset.device=button.dataset.device;for(const item of document.querySelectorAll('button[data-device]'))item.setAttribute('aria-pressed',String(item===button));});</script></body></html>`;
fs.writeFileSync(path.join(design, 'app-b-compare.html'), html);
console.log(`Đã tạo app-b-compare.html với ${screens.length} màn, ${copies} ảnh app thật.`);
