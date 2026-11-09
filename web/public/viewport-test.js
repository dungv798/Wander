// Đo viewport iOS Safari: chiều cao svh/dvh/lvh thực tế, visualViewport, safe-area, chế độ standalone, và có cuộn trang được không.
// Mở trên iPhone: /viewport-test.html — chụp ảnh màn hình (cả khi cuộn thử) rồi gửi lại.
const $ = (id) => document.getElementById(id);
const px = (n) => `${Math.round(n)} px`;

/** Chiều cao thật (px) của một phần tử đo đặt bằng đơn vị viewport. */
function heightOf(id) { return $(id).getBoundingClientRect().height; }

/** Cập nhật bảng số đo. */
function render() {
  const vv = window.visualViewport;
  const probe = getComputedStyle($('probe'));
  const rows = [
    ['innerHeight', px(window.innerHeight)],
    ['visualViewport', vv ? `${px(vv.height)} · lệch trên ${px(vv.offsetTop)}` : 'không có'],
    ['100svh / dvh / lvh', `${px(heightOf('h-svh'))} / ${px(heightOf('h-dvh'))} / ${px(heightOf('h-lvh'))}`],
    ['screen.height', px(screen.height)],
    ['safe-area T/B', `${probe.paddingTop} / ${probe.paddingBottom}`],
    ['standalone', `${matchMedia('(display-mode: standalone)').matches} (navigator: ${String(navigator.standalone)})`],
    ['scrollY / cuộn tối đa', `${px(window.scrollY)} / ${px(document.documentElement.scrollHeight - window.innerHeight)}`],
    ['chế độ', document.body.dataset.mode === 'app' ? 'A · như app (không cuộn trang)' : 'B · trang cuộn được'],
  ];
  $('readout').replaceChildren(...rows.flatMap(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    return [dt, dd];
  }));
}

/** Đổi giữa chế độ A (như app: body không cuộn) và B (trang cuộn được). */
function setMode(mode) {
  document.body.dataset.mode = mode;
  for (const b of document.querySelectorAll('[data-set-mode]')) b.setAttribute('aria-pressed', String(b.dataset.setMode === mode));
  window.scrollTo(0, 0);
  render();
}

for (const b of document.querySelectorAll('[data-set-mode]')) b.addEventListener('click', () => setMode(b.dataset.setMode));
for (const ev of ['resize', 'scroll']) window.addEventListener(ev, render);
window.visualViewport?.addEventListener('resize', render);
window.visualViewport?.addEventListener('scroll', render);
setMode('app');
