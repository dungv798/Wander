/* Cấp dữ liệu cho app: đọc kho biên tập THẬT (/data/catalog/ha-giang.json) và đổi sang hình dạng mà app.js dùng.
   Trạng thái thử: ?state=loading|error|empty|offline (xem docs/ux/screens.md). Không dùng cho sản phẩm thật. */
(function () {
  var RATE = { must: 'Nên ghé', worth: 'Đáng đi', ifconv: 'Chỉ ghé nếu tiện' };
  var params = new URLSearchParams(location.search);
  var mode = params.get('state') || 'ok';
  var screen = document.getElementById('screen');

  function box(title, text, button, role) {
    return '<div class="empty pad-x"' + (role ? ' role="' + role + '"' : '') + '><h1 class="h2">' + title + '</h1><p>' + text + '</p>' + (button || '') + '</div>';
  }
  /** Tháng đẹp nhất của điểm đến, lấy từ khối "Mùa nên đi" của cẩm nang (không viết cứng ở app). */
  function bestMonths(c) {
    var g = (c.guide || []).filter(function (x) { return x.id === "mua"; })[0];
    return g && g.bestMonths ? g.bestMonths : [];
  }
  /** Tháng mưa nhiều của điểm đến, cùng khối "Mùa nên đi". */
  function rainyMonths(c) {
    var g = (c.guide || []).filter(function (x) { return x.id === "mua"; })[0];
    return g && g.rainyMonths ? g.rainyMonths : [];
  }
  function adapt(c) {
    return {
      destination: { id: c.id, name: c.name, region: c.region, tagline: c.tagline, coverPlaceId: c.coverPlaceId, bestMonths: bestMonths(c), rainyMonths: rainyMonths(c) },
      places: c.places.map(function (p) {
        return {
          id: p.id, name: p.name, cat: p.category, area: p.area, hook: p.hook, best: p.bestLabel, months: p.bestMonths,
          dur: p.duration, level: p.difficulty, feat: p.highlights, rate: { label: RATE[p.verdict], why: p.verdictReason },
          tod: { slots: p.bestSlots, why: p.slotReason }, tips: p.tips, wikipedia: p.wikipediaTitle, extract: p.summary, lat: p.lat, lon: p.lon,
          photos: p.photos.map(function (ph) { return { src: '/catalog/photos/' + ph.file, artist: ph.author, license: ph.license, source: ph.sourceUrl }; })
        };
      })
    };
  }
  function start(data) {
    window.WANDER_DATA = data;
    var s = document.createElement('script');
    s.src = 'app/app.js';   // tương đối so với trang (index.html), không phải so với adapt.js
    document.body.appendChild(s);
  }
  function fail() {
    screen.innerHTML = box('Không tải được dữ liệu', 'Kiểm tra kết nối rồi thử lại. Những gì bạn đã chọn vẫn được giữ.', '<button class="btn" type="button" id="retry">Thử lại</button>', 'alert');
    document.getElementById('retry').addEventListener('click', function () { location.href = location.pathname; });
  }

  if (mode === 'loading') { screen.innerHTML = '<h1 class="sr">Wander</h1><div class="pad-x" aria-busy="true" aria-label="Đang tải" style="padding-block:24px;display:grid;gap:16px"><div class="skeleton" style="height:240px"></div><div class="skeleton" style="height:56px"></div><div class="skeleton" style="height:180px"></div></div>'; return; }
  if (mode === 'error') { fail(); return; }
  if (mode === 'offline') { var bar = document.createElement('div'); bar.className = 'offline-bar'; bar.setAttribute('role', 'status'); bar.textContent = 'Bạn đang ngoại tuyến. Xem được nội dung đã tải; lưu thay đổi cần có mạng.'; document.body.insertBefore(bar, document.body.firstChild); }

  fetch('/data/catalog/ha-giang.json').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (c) { start(adapt(c)); })
    .catch(fail);
})();
