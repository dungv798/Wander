// Chạy: /autoscroll-test.html?v=<a|b|c|d|e|f>. Mỗi biến thể là một cách tự cuộn trang lúc tải; kết quả hiện ở bảng (innerHeight so với lvh).
const $ = (id) => document.getElementById(id);
const variant = new URLSearchParams(location.search).get('v') ?? 'f';
const TARGET_PX = 60;
const LABELS = {
  a: 'scrollTo(0, 60) ngay lúc DOMContentLoaded',
  b: 'scrollTo(0, 60) sau sự kiện load + 800 ms',
  c: 'scrollTo({top: 60, behavior: "smooth"}) sau 800 ms',
  d: 'documentElement.scrollTop = 60 sau 800 ms',
  e: 'cuộn từng bước 4 px mỗi khung hình tới 80 px (giả lập cuộn mượt)',
  f: 'đối chứng: không làm gì',
};

/** Đo và hiện trạng thái: thanh đã thu khi innerHeight bằng chiều cao khung lớn (lvh). */
function render(note) {
  const inner = window.innerHeight;
  const lvh = $('h-lvh').getBoundingClientRect().height;
  const svh = $('h-svh').getBoundingClientRect().height;
  const collapsed = inner >= lvh - 1 && lvh > svh + 1;
  const rows = [['biến thể', `${variant}: ${LABELS[variant] ?? '?'}`], ['innerHeight', `${Math.round(inner)} px`], ['svh / lvh', `${Math.round(svh)} / ${Math.round(lvh)} px`], ['scrollY', `${Math.round(window.scrollY)} px`], ['lúc đo', note]];
  $('readout').replaceChildren(...rows.flatMap(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; return [dt, dd]; }));
  const verdict = $('verdict');
  verdict.dataset.state = collapsed ? 'collapsed' : 'expanded';
  verdict.textContent = collapsed ? 'THANH ĐÃ THU (innerHeight = lvh)' : 'thanh CHƯA thu';
}

/** Cuộn từng bước nhỏ mỗi khung hình tới `to` px. */
function stepScroll(to) {
  const tick = () => { if (window.scrollY < to) { window.scrollBy(0, 4); requestAnimationFrame(tick); } };
  requestAnimationFrame(tick);
}

/** Chạy biến thể được chọn. */
function run() {
  if (variant === 'a') window.scrollTo(0, TARGET_PX);
  if (variant === 'b') window.addEventListener('load', () => setTimeout(() => window.scrollTo(0, TARGET_PX), 800));
  if (variant === 'c') setTimeout(() => window.scrollTo({ top: TARGET_PX, behavior: 'smooth' }), 800);
  if (variant === 'd') setTimeout(() => { document.documentElement.scrollTop = TARGET_PX; }, 800);
  if (variant === 'e') setTimeout(() => stepScroll(80), 800);
}

render('lúc vừa tải');
run();
for (const delay of [1500, 3000, 5000]) setTimeout(() => render(`sau ${delay / 1000} giây`), delay);
window.addEventListener('scroll', () => render('khi cuộn'), { passive: true });
window.addEventListener('resize', () => render('khi đổi cỡ'));
