/* Cổng quản trị nội dung (F12, T14): BẢN THỬ mức khung. Cơ chế đăng nhập CHƯA CHỐT (Q-d, Tầng A): màn đăng nhập chỉ là khung.
   Dữ liệu gốc là kho biên tập thật (/data/catalog/ha-giang.json); mọi thay đổi chỉ nằm trong localStorage của trình duyệt này. */
(function () {
  "use strict";
  var SKEY = "wander-admin-proto";
  var CATS = { canh: "Cảnh quan", van: "Văn hóa", am: "Ẩm thực", leo: "Leo núi", luu: "Lưu trú", cho: "Chợ" };
  var VERDICT = { must: "Nên ghé", worth: "Đáng đi", ifconv: "Chỉ ghé nếu tiện" };
  var SLOTS = { sang: "Sáng", chieu: "Chiều", toi: "Tối" };
  var LEVELS = ["Dễ", "Vừa", "Khó"];
  var LAYOUT = { MONTHS: "Theo tháng", CHECKLIST: "Danh sách việc", CARDS: "Thẻ món", PLACES: "Địa điểm", ROWS: "Dòng thông tin" };
  var OTHERS = ["Sa Pa", "Hội An", "Đà Lạt", "Ninh Bình", "Phú Quốc", "Đà Nẵng"];
  var MAX_HOOK = 140, MIN_HOOK = 20, MAX_NAME = 120, MAX_TIP = 200;
  var root = document.getElementById("adm"), sheet = document.getElementById("sheet"), panel = document.getElementById("panel"), toastEl = document.getElementById("toast"), live = document.getElementById("live");
  var toastTimer = 0, cat = null, form = null, formDirty = false, tried = false;   // tried: đã bấm Lưu/Xuất bản ít nhất một lần, lúc đó mới hiện lỗi từng ô

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ic(n, c) { return '<svg class="ic' + (c ? " " + c : "") + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function announce(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); }
  function toast(t) { toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3200); }

  /* ---------- trạng thái ---------- */
  var TABS = ["places", "guide", "quality"];
  (function () { var th = window.__WANDER_THEME; if (!th) { try { var a = JSON.parse(localStorage.getItem("wander-kham-pha-proto-v8") || "null"); th = a && a.theme; } catch (e) { /* bỏ qua */ } } th = th || "light"; if (th === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", th === "dark" ? "dark" : "light"); })();   // giao diện chọn ở Cài đặt của app, mặc định sáng
  var S = load();
  function load() { var d = { in: false, route: "login", tab: "places", placeId: null, expired: false, places: {}, guide: {}, published: true, restored: false }; try { var r = JSON.parse(localStorage.getItem(SKEY) || "null"); if (r && r.v === 1) for (var k in r.s) d[k] = r.s[k]; } catch (e) { /* bỏ qua */ } if (TABS.indexOf(d.tab) < 0) d.tab = "places"; if (["login", "dests", "dest", "place"].indexOf(d.route) < 0) d.route = "login"; return d; }
  function save() { try { localStorage.setItem(SKEY, JSON.stringify({ v: 1, s: S })); } catch (e) { /* bỏ qua */ } }

  /* ---------- mô hình địa điểm + luật chất lượng ---------- */
  function base(p) { return JSON.parse(JSON.stringify({ id: p.id, name: p.name, category: p.category, area: p.area, hook: p.hook, summary: p.summary || "", lat: p.lat, lon: p.lon, bestMonths: p.bestMonths || [], duration: p.duration || "", difficulty: p.difficulty || "", highlights: p.highlights || [], verdict: p.verdict || "", verdictReason: p.verdictReason || "", bestSlots: p.bestSlots || [], slotReason: p.slotReason || "", tips: p.tips || [], photos: p.photos || [], reviewed: false })); }
  function entry(id) { return S.places[id] || (S.places[id] = { draft: null, live: true, isNew: false }); }
  function working(id) { var e = S.places[id]; if (e && e.draft) return e.draft; var p = cat.places.filter(function (x) { return x.id === id; })[0]; return p ? base(p) : null; }
  function allIds() { var ids = cat.places.map(function (p) { return p.id; }); Object.keys(S.places).forEach(function (id) { if (S.places[id].added && ids.indexOf(id) < 0) ids.push(id); }); return ids.filter(function (id) { return !(S.places[id] && S.places[id].removed); }); }
  function status(id) { var e = S.places[id] || { live: true, draft: null }; return !e.live ? "Bản nháp" : e.draft ? "Có thay đổi chưa xuất bản" : "Đã xuất bản"; }
  function monthsLabel(m) {
    var a = (m || []).map(Number).filter(function (x) { return isFinite(x) && x >= 1 && x <= 12; }).sort(function (x, y) { return x - y; }), out = [], i = 0;
    while (i < a.length) { var j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(j > i ? a[i] + "–" + a[j] : String(a[i])); i = j + 1; }
    return a.length ? "Tháng " + out.join(", ") : "";
  }
  function check(p) {
    var ph = p.photos || [], bad = ph.filter(function (x) { return !(x.author && x.license && /^https?:\/\/\S+$/i.test(x.sourceUrl || "")); }).length, nofile = ph.filter(function (x) { return !x.file; }).length;
    var lat = Number(p.lat), lon = Number(p.lon), hl = len(p.hook);
    return [
      { id: "cat", block: true, ok: !!CATS[p.category], label: "Đã chọn loại địa điểm", fix: "Chọn một loại." },
      { id: "area", block: true, ok: !!(p.area || "").trim(), label: "Có khu vực", fix: "Điền khu vực, ví dụ Đồng Văn." },
      { id: "photo", block: true, ok: ph.length >= 1, label: "Có ít nhất 1 ảnh", fix: "Thêm ảnh có nguồn và giấy phép." },
      { id: "credit", block: true, ok: bad === 0 && ph.length >= 1, label: "Mọi ảnh có tác giả, giấy phép và đường dẫn nguồn (http hoặc https)", fix: bad ? bad + " ảnh còn thiếu hoặc sai thông tin ghi công." : "Chưa có ảnh để kiểm." },
      { id: "hook", block: true, ok: hl >= MIN_HOOK && hl <= MAX_HOOK, label: "Câu giới thiệu dài " + MIN_HOOK + "–" + MAX_HOOK + " ký tự", fix: "Hiện " + hl + " ký tự." },
      { id: "geo", block: true, ok: isFinite(lat) && isFinite(lon) && p.lat !== "" && p.lon !== "" && lat >= 8 && lat <= 23.5 && lon >= 102 && lon <= 110, label: "Có tọa độ nằm trong lãnh thổ Việt Nam", fix: "Nhập vĩ độ 8–23,5 và kinh độ 102–110." },
      { id: "tip", block: true, ok: (p.tips || []).filter(Boolean).length >= 1, label: "Có ít nhất 1 mẹo", fix: "Thêm một mẹo hữu ích." },
      { id: "why", block: true, ok: !!p.verdict && !!(p.verdictReason || "").trim(), label: "Nhãn biên tập có lý do", fix: "Chọn nhãn và ghi lý do." },
      { id: "month", block: true, ok: (p.bestMonths || []).length >= 1, label: "Có tháng đẹp để đi", fix: "Chọn ít nhất một tháng." },
      { id: "file", block: false, ok: nofile === 0, label: "Mọi ảnh đã có tệp tải lên", fix: nofile + " ảnh mới chỉ có thông tin ghi công, chưa tải lên máy chủ (bản thử chỉ chọn và kiểm tệp; tải lên làm sau khi duyệt thiết kế)." },
      { id: "review", block: false, ok: !!p.reviewed, label: "Nội dung biên tập đã được người kiểm chứng", fix: "Đang là bản nháp do AI viết (ADR-009), chưa ai kiểm chứng." }
    ];
  }
  function blockers(p) { return check(p).filter(function (r) { return r.block && !r.ok; }); }
  function warns(p) { return check(p).filter(function (r) { return !r.block && !r.ok; }); }
  function badge(p) { var b = blockers(p).length, w = warns(p).length; return b ? '<span class="badge bad">' + ic("alert-triangle", "s") + b + " lỗi chặn</span>" : w ? '<span class="badge warn">' + ic("info-circle", "s") + "Đủ chuẩn, " + w + " cảnh báo</span>" : '<span class="badge ok">' + ic("check", "s") + "Đủ chuẩn</span>"; }
  function stBadge(id) { var s = status(id); return '<span class="badge ' + (s === "Đã xuất bản" ? "ok" : s === "Bản nháp" ? "draft" : "warn") + '">' + s + "</span>"; }

  /* ---------- khung trang ---------- */
  function topbar(crumbs) {
    return '<header class="atop"><div class="abrand"><span class="logo">Wander</span><span>Quản trị nội dung</span></div><span class="proto" role="note">BẢN THỬ · đăng nhập chưa chốt (Q-d)</span>' +
      '<div class="aright"><button class="btn ghost" type="button" data-act="expire">Giả lập: hết phiên</button><button class="btn ghost" type="button" data-act="logout">Đăng xuất</button></div></header>' +
      '<nav class="crumbs" aria-label="Vị trí">' + crumbs.map(function (c, i) { return i === crumbs.length - 1 ? '<span aria-current="page">' + esc(c[0]) + "</span>" : '<button class="linkbtn" type="button" data-go="' + c[1] + '">' + esc(c[0]) + "</button>"; }).join(ic("chevron-down", "sep")) + "</nav>";
  }
  function render() {
    if (!S.in && S.route !== "login") S.route = "login";
    var h = "";
    if (S.route === "login") h = renderLogin();
    else if (S.route === "dests") h = renderDests();
    else if (S.route === "dest") h = renderDest();
    else if (S.route === "place") h = renderPlace();
    root.innerHTML = h; save();
    var t = root.querySelector("h1"); if (t) { t.setAttribute("tabindex", "-1"); }
    document.title = (t ? t.textContent + " · " : "") + "Quản trị Wander";
  }
  function go(route, extra) {
    if (S.route === "place" && route !== "place" && S.placeId) { var pe = S.places[S.placeId]; if (pe && pe.added && !pe.live && !pe.override && pe.draft && !(pe.draft.name || "").trim() && !formDirty) delete S.places[S.placeId]; }   // mở form mới rồi thoát khi chưa gõ gì: không để lại bản ghi trống
    if (route === "login") S.in = false; for (var k in extra || {}) S[k] = extra[k]; S.route = route; form = null; formDirty = false; tried = false; render(); var t = root.querySelector("h1"); if (t) t.focus({ preventScroll: false }); window.scrollTo(0, 0); }

  /* ---------- A0 đăng nhập (khung) ---------- */
  function renderLogin() {
    var msg = S.expired ? '<div class="warnbox" role="alert"><b>Phiên quản trị đã hết.</b> Đăng nhập lại để tiếp tục.' + (S.restored ? " Bản nháp bạn đang sửa đã được giữ tạm trên máy này." : "") + "</div>" : "";
    return '<main class="alogin"><div class="acard"><span class="logo">Wander</span><h1>Cổng quản trị nội dung</h1><p class="note">Chỉ dành cho người quản trị nội dung. Người dùng thường không cần vào đây.</p>' + msg +
      '<div class="field"><label for="a-user">Tên đăng nhập</label><input id="a-user" disabled placeholder="Chưa chốt cơ chế" aria-describedby="a-why"></div>' +
      '<button class="btn block" type="button" disabled aria-describedby="a-why">Đăng nhập</button>' +
      '<p class="note" id="a-why">Cơ chế đăng nhập quản trị chưa được chốt (Q-d). Sẽ hỏi lại với các phương án khi làm phần quản trị ở backend. Màn này chỉ là khung.</p>' +
      '<div class="protobox"><b>BẢN THỬ</b><button class="btn" type="button" data-act="enter">Vào bản thử, không kiểm tra gì</button></div></div></main>';
  }

  /* ---------- A1 danh sách điểm đến ---------- */
  function destStat() { var ids = allIds(), ok = ids.filter(function (id) { return !blockers(working(id)).length; }).length; return { n: ids.length, ok: ok }; }
  function renderDests() {
    var st = destStat();
    var h = topbar([["Điểm đến", "dests"]]) + '<main class="amain"><div class="ahead"><h1>Điểm đến</h1><p class="note">Điểm đến nào đã xuất bản thì người dùng thấy ở màn Khám phá.</p></div><ul class="alist" aria-label="Danh sách điểm đến">';
    h += '<li class="arow"><div class="acell main"><b>' + esc(cat.name) + '</b><span class="note">' + esc(cat.region) + " · " + esc(cat.tagline) + "</span></div><div class=\"acell\"><span>" + st.n + ' địa điểm</span><span class="note">' + st.ok + "/" + st.n + ' đủ chuẩn xuất bản</span></div><div class="acell"><span class="badge ' + (S.published ? "ok" : "draft") + '">' + (S.published ? "Đã xuất bản" : "Đã gỡ") + '</span></div><div class="acell act"><button class="btn" type="button" data-open-dest="1">Mở</button></div></li>';
    S.newDests = S.newDests || {};
    var drafts = Object.keys(S.newDests).filter(function (n) { return OTHERS.indexOf(n) < 0; }).concat(OTHERS.filter(function (n) { return S.newDests[n]; }));
    drafts.forEach(function (n) { h += '<li class="arow"><div class="acell main"><b>' + esc(n) + '</b><span class="note">Bản nháp, chưa có địa điểm. Để xuất bản cần: ít nhất một địa điểm đủ chuẩn, cẩm nang, ảnh có ghi công.</span></div><div class="acell"><span>0 địa điểm</span></div><div class="acell"><span class="badge draft">Bản nháp</span></div><div class="acell act"><button class="btn" type="button" disabled aria-describedby="nd-why">Xuất bản</button><button class="btn ghost" type="button" data-act="dropDest" data-what="' + esc(n) + '">Bỏ bản nháp</button></div></li>'; });
    OTHERS.filter(function (o) { return !S.newDests[o]; }).forEach(function (o) { h += '<li class="arow muted"><div class="acell main"><b>' + esc(o) + '</b><span class="note">Chưa có dữ liệu</span></div><div class="acell"><span>0 địa điểm</span></div><div class="acell"><span class="badge draft">Sắp ra mắt</span></div><div class="acell act"><button class="btn ghost" type="button" data-act="newDest" data-what="' + esc(o) + '">Tạo bản nháp</button></div></li>'; });
    h += '</ul><form class="ndform" data-act-form="newDestCustom"><label for="nd-name">Tên điểm đến mới</label><input id="nd-name" maxlength="80" autocomplete="off" aria-describedby="nd-why nd-err"><button class="btn" type="submit">Tạo bản nháp</button></form><p class="ferr" id="nd-err" role="alert"></p><p class="note" id="nd-why"><b>BẢN THỬ (khung):</b> bản nháp chỉ lưu ở máy này. Nút Xuất bản bị khóa vì điểm đến mới chưa có địa điểm, cẩm nang và ảnh có ghi công; quy tắc kiểm "thẻ đủ chuẩn" giống điểm đến đã có.</p>';
    return h + "</main>";
  }

  /* ---------- A2 chi tiết điểm đến ---------- */
  function renderDest() {
    var tabs = [["places", "Địa điểm"], ["guide", "Cẩm nang"], ["quality", "Chất lượng"]], st = destStat();
    var h = topbar([["Điểm đến", "dests"], [cat.name, "dest"]]) + '<main class="amain"><div class="ahead"><h1>' + esc(cat.name) + '</h1><p class="note">' + esc(cat.region) + " · " + esc(cat.tagline) + '</p><div class="arow2"><span class="badge ' + (S.published ? "ok" : "draft") + '">' + (S.published ? "Đã xuất bản" : "Đã gỡ") + '</span><button class="btn ghost" type="button" data-act="togglePub">' + (S.published ? "Gỡ xuất bản" : "Xuất bản điểm đến") + "</button></div></div>";
    h += '<div class="tabs" role="tablist" aria-label="Phần của điểm đến">' + tabs.map(function (t) { return '<button class="tab" role="tab" type="button" id="tab-' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '" aria-controls="tp" data-tab="' + t[0] + '" tabindex="' + (S.tab === t[0] ? 0 : -1) + '">' + t[1] + (t[0] === "quality" && st.ok < st.n ? ' <span class="count">' + (st.n - st.ok) + "</span>" : "") + "</button>"; }).join("") + '</div><section id="tp" role="tabpanel" aria-labelledby="tab-' + S.tab + '">';
    if (S.tab === "places") {
      h += '<div class="abar"><span class="note">' + st.n + ' địa điểm</span><button class="btn" type="button" data-act="newPlace">' + ic("plus") + 'Thêm địa điểm</button></div><ul class="alist" aria-label="Danh sách địa điểm">';
      allIds().forEach(function (id) {
        var p = working(id), img = p.photos && p.photos[0] && p.photos[0].file ? '<img alt="" src="/catalog/photos/' + esc(p.photos[0].file) + '">' : '<span class="noimg">' + ic("map-pin") + "</span>";
        h += '<li class="arow"><div class="acell thumb">' + img + '</div><div class="acell main"><b>' + esc(p.name || "(chưa đặt tên)") + '</b><span class="note">' + esc(CATS[p.category] || "Chưa chọn loại") + " · " + esc(p.area || "chưa có khu vực") + '</span></div><div class="acell">' + (p.verdict ? '<span class="chip">' + VERDICT[p.verdict] + "</span>" : '<span class="note">Chưa có nhãn</span>') + '</div><div class="acell">' + stBadge(id) + badge(p) + '</div><div class="acell act"><button class="btn ghost" type="button" data-edit="' + esc(id) + '" aria-label="Sửa ' + esc(p.name || "địa điểm mới") + '">' + ic("pencil") + "Sửa</button></div></li>";
      });
      h += "</ul>";
    } else if (S.tab === "guide") {
      h += '<p class="note">Cẩm nang hiện ở trang điểm đến và tab Tổng quan của chuyến đi. Chỉ sửa chữ ở đây; thay đổi nặng hơn làm sau.</p><ul class="alist" aria-label="Các phần của cẩm nang">';
      cat.guide.forEach(function (g) { var o = S.guide[g.id] || {}; h += '<li class="arow"><div class="acell main"><b>' + esc(o.title || g.title) + '</b><span class="note">' + esc(o.summary || g.summary) + '</span></div><div class="acell"><span class="chip">' + esc(LAYOUT[g.layout] || g.layout) + '</span></div><div class="acell">' + (o.title || o.summary ? '<span class="badge warn">Có thay đổi chưa xuất bản</span>' : '<span class="badge ok">Đã xuất bản</span>') + '</div><div class="acell act"><button class="btn ghost" type="button" data-guide="' + esc(g.id) + '" aria-label="Sửa phần ' + esc(g.title) + '">' + ic("pencil") + "Sửa</button></div></li>"; });
      h += "</ul>";
    } else {
      h += '<p class="note">Một địa điểm chỉ xuất bản được khi không còn lỗi chặn. Cảnh báo không chặn nhưng nên xử lý.</p>';
      var any = false; h += '<div class="qlist">';
      allIds().forEach(function (id) {
        var p = working(id), b = blockers(p), w = warns(p); if (!b.length && !w.length) return; any = true;
        h += '<section class="acard q"><div class="qhead"><h2>' + esc(p.name || "(chưa đặt tên)") + '</h2><button class="btn ghost" type="button" data-edit="' + esc(id) + '">' + ic("pencil") + "Sửa</button></div><ul>" +
          b.map(function (r) { return '<li class="bad">' + ic("alert-triangle", "s") + "<span><b>Chặn:</b> " + esc(r.label) + '. <span class="note">' + esc(r.fix) + "</span></span></li>"; }).join("") +
          w.map(function (r) { return '<li class="warn">' + ic("info-circle", "s") + "<span><b>Cảnh báo:</b> " + esc(r.label) + '. <span class="note">' + esc(r.fix) + "</span></span></li>"; }).join("") + "</ul></section>";
      });
      if (!any) h += '<div class="empty" role="status"><span class="ib">' + ic("check", "l") + "</span><h2 class=\"h2\">Mọi địa điểm đều đủ chuẩn</h2><p>Không có lỗi hay cảnh báo nào.</p></div>";
      h += "</div>";
    }
    return h + "</section></main>";
  }

  /* ---------- A3 biểu mẫu địa điểm ---------- */
  /* tải ảnh lên (DG-2 A4, KHUNG): kiểm kiểu và dung lượng ngay ở trình duyệt; CHƯA gửi lên máy chủ; ghi công vẫn bắt buộc để xuất bản */
  var PH_TYPES = ["image/jpeg", "image/png", "image/webp"], PH_MAX = 5 * 1024 * 1024;
  function upl(ph, i) {
    return '<div class="field"><label for="ph-f' + i + '">Tệp ảnh (JPG, PNG hoặc WebP, tối đa 5 MB)</label><input id="ph-f' + i + '" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="ph-n' + i + '"><p class="note" id="ph-n' + i + '">' +
      (ph.pendingName ? "Đã chọn: " + esc(ph.pendingName) + " (" + Math.max(1, Math.round(ph.pendingSize / 1024)) + " KB). " : "") + 'Khi làm thật, Wander sẽ gỡ thông tin vị trí (EXIF) khỏi ảnh lúc tải lên. <b>Bản thử: chưa tải lên máy chủ, nên chưa xuất bản được.</b></p><p class="ferr" id="ph-fe' + i + '" role="alert"></p></div>';
  }
  function nk(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]/g, ""); }   // so tên không phân biệt dấu và hoa thường
  function blankPlace() { return { id: "dia-diem-moi-" + Date.now().toString(36), name: "", category: "", area: "", hook: "", summary: "", lat: "", lon: "", bestMonths: [], duration: "", difficulty: "", highlights: [], verdict: "", verdictReason: "", bestSlots: [], slotReason: "", tips: [], photos: [], reviewed: false }; }
  function openPlace(id) { var p = working(id); form = JSON.parse(JSON.stringify(p)); formDirty = false; S.placeId = id; go("place", { placeId: id }); }
  function len(s) { return Array.from(String(s || "").normalize("NFC").trim()).length; }   // đếm theo điểm mã, sau chuẩn hóa và bỏ khoảng trắng hai đầu
  function lines(v) { return String(v || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function readForm() {
    if (!form || !$("p-name")) return;
    form.name = $("p-name").value; form.category = $("p-cat").value; form.area = $("p-area").value; form.hook = $("p-hook").value; form.lat = $("p-lat").value.trim().replace(/,/g, "."); form.lon = $("p-lon").value.trim().replace(/,/g, ".");
    form.duration = $("p-dur").value; form.difficulty = $("p-dif").value; form.highlights = lines($("p-hl").value); form.verdict = $("p-verdict").value; form.verdictReason = $("p-why").value; form.slotReason = $("p-slotwhy").value; form.tips = lines($("p-tips").value);
    form.reviewed = $("p-rev").checked;
    form.photos.forEach(function (ph, i) { var a = $("ph-a" + i), l = $("ph-l" + i), s = $("ph-s" + i); if (a) { ph.author = a.value; ph.license = l.value; ph.sourceUrl = s.value; } });
  }
  function fieldErr(f) {
    var e = {}; var nm = (f.name || "").trim();
    if (!nm) e.name = "Hãy đặt tên cho địa điểm."; else if (len(nm) > MAX_NAME) e.name = "Tên tối đa " + MAX_NAME + " ký tự.";
    if (f.lat !== "" && !/^-?\d+(\.\d+)?$/.test(String(f.lat))) e.lat = "Vĩ độ phải là một số, ví dụ 23,36.";
    if (f.lon !== "" && !/^-?\d+(\.\d+)?$/.test(String(f.lon))) e.lon = "Kinh độ phải là một số, ví dụ 105,31.";
    if (len(f.hook) > MAX_HOOK) e.hook = "Tối đa " + MAX_HOOK + " ký tự (đang " + len(f.hook) + ").";
    if ((f.highlights || []).length > 4) e.hl = "Tối đa 4 điểm nổi bật (đang " + f.highlights.length + ").";
    if ((f.tips || []).some(function (t) { return len(t) > MAX_TIP; })) e.tips = "Mỗi mẹo tối đa " + MAX_TIP + " ký tự.";
    return e;
  }
  function err(e, k) { return e[k] ? '<p class="ferr" id="e-' + k + '" role="alert">' + esc(e[k]) + "</p>" : ""; }
  function dropAll(id) { var e = entry(id); return !!e.added && !e.live && !e.override; }   // địa điểm do quản trị thêm mà chưa xuất bản: bỏ là xóa hẳn
  function renderPlace() {
    if (!form) { var p0 = working(S.placeId); if (!p0) { S.route = "dest"; return renderDest(); } form = JSON.parse(JSON.stringify(p0)); }
    var f = form, id = S.placeId, e = tried ? fieldErr(f) : {}, rs = check(f), isNew = entry(id).isNew, st = status(id);
    var h = topbar([["Điểm đến", "dests"], [cat.name, "dest"], [f.name || "Địa điểm mới", "place"]]) + '<main class="amain"><div class="ahead"><h1>' + (isNew ? "Địa điểm mới" : esc(f.name || "Địa điểm")) + '</h1><div class="arow2">' + stBadge(id) + (formDirty ? '<span class="badge warn" role="status">Chưa lưu</span>' : "") + "</div></div>";
    h += '<div class="aform"><form id="pf" novalidate onsubmit="return false"><section class="acard"><h2>Thông tin chính</h2>' +
      '<div class="field"><label for="p-name">Tên địa điểm</label><input id="p-name" maxlength="' + (MAX_NAME + 20) + '" value="' + esc(f.name) + '"' + (e.name ? ' aria-invalid="true" aria-describedby="e-name"' : "") + ">" + err(e, "name") + "</div>" +
      '<div class="two"><div class="field"><label for="p-cat">Loại</label><select id="p-cat"><option value="">Chưa chọn</option>' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + (f.category === k ? " selected" : "") + ">" + CATS[k] + "</option>"; }).join("") + '</select></div><div class="field"><label for="p-area">Khu vực</label><input id="p-area" value="' + esc(f.area) + '" placeholder="Ví dụ Đồng Văn"></div></div>' +
      '<div class="field"><label for="p-hook">Câu giới thiệu <span class="note">(' + MIN_HOOK + "–" + MAX_HOOK + " ký tự)</span></label><textarea id=\"p-hook\" rows=\"2\"" + (e.hook ? ' aria-invalid="true" aria-describedby="e-hook"' : "") + ">" + esc(f.hook) + "</textarea>" + err(e, "hook") + "</div>" +
      (f.summary ? '<div class="field"><span class="lbl">Mô tả</span><p class="ro">' + esc(f.summary) + '</p><p class="note">Lấy từ Wikipedia tiếng Việt theo giấy phép CC BY-SA, không sửa tay ở đây. Muốn đổi thì sửa nguồn.</p></div>' : "") + "</section>" +
      '<section class="acard"><h2>Vị trí và thời điểm</h2><div class="two"><div class="field"><label for="p-lat">Vĩ độ</label><input id="p-lat" inputmode="decimal" value="' + esc(f.lat) + '"' + (e.lat ? ' aria-invalid="true" aria-describedby="e-lat"' : "") + ">" + err(e, "lat") + '</div><div class="field"><label for="p-lon">Kinh độ</label><input id="p-lon" inputmode="decimal" value="' + esc(f.lon) + '"' + (e.lon ? ' aria-invalid="true" aria-describedby="e-lon"' : "") + ">" + err(e, "lon") + "</div></div>" +
      '<div class="field"><span class="lbl" id="l-months">Tháng đẹp để đi' + (f.bestMonths.length ? " · <b>" + monthsLabel(f.bestMonths) + "</b>" : "") + '</span><div class="chips" role="group" aria-labelledby="l-months">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return '<button class="fchip" type="button" data-month="' + m + '" aria-pressed="' + (f.bestMonths.indexOf(m) >= 0) + '" aria-label="Tháng ' + m + '">T' + m + "</button>"; }).join("") + "</div></div>" +
      '<div class="two"><div class="field"><label for="p-dur">Thời gian ghé</label><input id="p-dur" value="' + esc(f.duration) + '" placeholder="Ví dụ 1–2 giờ"></div><div class="field"><label for="p-dif">Độ khó</label><select id="p-dif"><option value="">Chưa chọn</option>' + LEVELS.map(function (l) { return '<option' + (f.difficulty === l ? " selected" : "") + ">" + l + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="field"><span class="lbl" id="l-slots">Buổi nên đi</span><div class="chips" role="group" aria-labelledby="l-slots">' + Object.keys(SLOTS).map(function (k) { return '<button class="fchip" type="button" data-slot="' + k + '" aria-pressed="' + (f.bestSlots.indexOf(k) >= 0) + '">' + SLOTS[k] + "</button>"; }).join("") + '</div></div><div class="field"><label for="p-slotwhy">Vì sao buổi đó</label><input id="p-slotwhy" value="' + esc(f.slotReason) + '"></div></section>' +
      '<section class="acard"><h2>Nhãn biên tập và mẹo</h2><div class="field"><label for="p-verdict">Nhãn</label><select id="p-verdict"><option value="">Chưa chọn</option>' + Object.keys(VERDICT).map(function (k) { return '<option value="' + k + '"' + (f.verdict === k ? " selected" : "") + ">" + VERDICT[k] + "</option>"; }).join("") + '</select></div><div class="field"><label for="p-why">Lý do cho nhãn</label><textarea id="p-why" rows="2">' + esc(f.verdictReason) + "</textarea></div>" +
      '<div class="field"><label for="p-hl">Điểm nổi bật <span class="note">(mỗi dòng một ý, tối đa 4)</span></label><textarea id="p-hl" rows="3"' + (e.hl ? ' aria-invalid="true" aria-describedby="e-hl"' : "") + '>' + esc(f.highlights.join("\n")) + '</textarea>' + err(e, "hl") + '</div><div class="field"><label for="p-tips">Mẹo <span class="note">(mỗi dòng một mẹo)</span></label><textarea id="p-tips" rows="3"' + (e.tips ? ' aria-invalid="true" aria-describedby="e-tips"' : "") + ">" + esc(f.tips.join("\n")) + "</textarea>" + err(e, "tips") + "</div>" +
      '<label class="checkrow"><input id="p-rev" type="checkbox"' + (f.reviewed ? " checked" : "") + '><span>Tôi đã đọc và kiểm chứng nội dung biên tập này</span></label><p class="note">Nội dung hiện có là bản nháp do AI viết (ADR-009). Chỉ tích khi bạn đã kiểm chứng thật.</p></section>' +
      '<section class="acard"><h2>Ảnh và ghi công</h2><p class="note">Ảnh phải có tác giả, giấy phép và đường dẫn nguồn. Chọn tệp kiểm được kiểu và dung lượng; tải lên máy chủ làm sau khi duyệt thiết kế.</p>' +
      f.photos.map(function (ph, i) { return '<fieldset class="photo"><legend>Ảnh ' + (i + 1) + (ph.file ? " · " + esc(ph.file) : " · chưa tải lên") + '</legend>' + (ph.file ? '<img alt="" src="/catalog/photos/' + esc(ph.file) + '">' : upl(ph, i)) + '<div class="field"><label for="ph-a' + i + '">Tác giả</label><input id="ph-a' + i + '" value="' + esc(ph.author || "") + '"></div><div class="field"><label for="ph-l' + i + '">Giấy phép</label><input id="ph-l' + i + '" value="' + esc(ph.license || "") + '"></div><div class="field"><label for="ph-s' + i + '">Đường dẫn nguồn</label><input id="ph-s' + i + '" inputmode="url" value="' + esc(ph.sourceUrl || "") + '"></div><button class="btn ghost" type="button" data-rmphoto="' + i + '">' + ic("trash") + "Bỏ ảnh " + (i + 1) + "</button></fieldset>"; }).join("") +
      '<button class="btn ghost" type="button" data-act="addPhoto">' + ic("plus") + "Thêm ảnh</button></section></form>";
    // cột phải: xem trước + chất lượng + hành động
    var bl = rs.filter(function (r) { return r.block && !r.ok; }), pv = f.photos[0] && f.photos[0].file ? '<img alt="" src="/catalog/photos/' + esc(f.photos[0].file) + '">' : '<span class="noimg big">' + ic("map-pin", "l") + "<span>Chưa có ảnh</span></span>";
    h += '<aside class="aside" aria-label="Xem trước và kiểm tra"><section class="acard"><h2>Xem trước thẻ</h2><div class="pv">' + pv + '<div class="pvin"><b>' + esc(f.name || "Tên địa điểm") + '</b><span>' + esc(f.area || "Khu vực") + (f.bestMonths.length ? " · " + monthsLabel(f.bestMonths) : "") + "</span><p>" + esc(f.hook || "Câu giới thiệu sẽ hiện ở đây.") + "</p>" + (f.verdict ? '<span class="chip">' + VERDICT[f.verdict] + "</span>" : "") + "</div></div></section>" +
      '<section class="acard"><h2>Kiểm tra chất lượng</h2><ul class="rules">' + rs.map(function (r) { return '<li class="' + (r.ok ? "ok" : r.block ? "bad" : "warn") + '">' + ic(r.ok ? "check" : r.block ? "alert-triangle" : "info-circle", "s") + "<span>" + esc(r.label) + (r.ok ? "" : '<br><span class="note">' + esc(r.fix) + "</span>") + "</span></li>"; }).join("") + "</ul></section>" +
      '<div class="stack"><button class="btn" type="button" data-act="saveDraft">Lưu bản nháp</button><button class="btn" type="button" data-act="publishPlace" aria-describedby="pubwhy"' + (bl.length ? ' aria-disabled="true"' : "") + ">Xuất bản địa điểm</button>" +
      '<p class="note" id="pubwhy">' + (bl.length ? "Chưa xuất bản được: còn " + bl.length + " lỗi chặn ở bảng kiểm tra." : "Xuất bản làm thay đổi hiện ra với mọi người dùng ngay.") + "</p>" +
      (st !== "Bản nháp" ? '<button class="btn ghost" type="button" data-act="unpublishPlace">Gỡ xuất bản</button>' : "") +
      (entry(id).draft || isNew ? '<button class="btn ghost" type="button" data-act="discardDraft">' + (dropAll(id) ? "Xóa bản nháp này" : "Bỏ thay đổi chưa xuất bản") + "</button>" : "") + '<button class="btn ghost" type="button" data-go="dest">Quay lại danh sách</button></div></aside></div></main>';
    return h;
  }

  /* ---------- tờ phủ ---------- */
  function showSheet() { sheet.hidden = false; var f = panel.querySelector("input,textarea,button,select"); if (f) f.focus(); }
  function closeSheet() { sheet.hidden = true; panel.innerHTML = ""; }
  function confirmSheet(title, text, yesLabel, yesAct, danger) {
    panel.innerHTML = '<div class="pp"><h2 style="font-size:26px">' + esc(title) + '</h2><p class="note">' + esc(text) + '</p><div class="stack"><button class="btn ' + (danger ? "danger" : "") + ' block" type="button" data-act="' + yesAct + '">' + esc(yesLabel) + '</button><button class="btn ghost block" type="button" data-act="closeSheet">Thôi</button></div></div>'; showSheet();
  }
  function openGuide(id) {
    var g = cat.guide.filter(function (x) { return x.id === id; })[0], o = S.guide[id] || {};
    panel.innerHTML = '<div class="pp"><h2 style="font-size:26px">Sửa «' + esc(g.title) + '»</h2><div class="field"><label for="g-title">Tiêu đề</label><input id="g-title" maxlength="80" value="' + esc(o.title || g.title) + '"></div><div class="field"><label for="g-sum">Tóm tắt</label><textarea id="g-sum" rows="3" maxlength="240">' + esc(o.summary || g.summary) + '</textarea></div><div id="g-warn" aria-live="polite"></div><div class="stack"><button class="btn block" type="button" data-act="saveGuide:' + esc(id) + '">Lưu bản nháp</button><button class="btn ghost block" type="button" data-act="closeSheet">Thôi</button>' + (S.guide[id] ? '<button class="btn ghost block" type="button" data-act="revertGuide:' + esc(id) + '">Bỏ thay đổi, về bản đang xuất bản</button>' : "") + "</div></div>"; showSheet();
  }

  /* ---------- hành động ---------- */
  function expire() {
    readForm(); S.restored = false;
    if (S.route === "place" && form && formDirty) { var e = entry(S.placeId); e.draft = JSON.parse(JSON.stringify(form)); S.restored = true; }
    S.in = false; S.expired = true; S.route = "login"; closeSheet(); render(); var h = root.querySelector("h1"); if (h) h.focus();
  }
  function saveDraft(quiet) {
    readForm(); var e = fieldErr(form), bad = Object.keys(e); if (bad.length) { tried = true; keep(render); var el = $("p-" + ({ name: "name", lat: "lat", lon: "lon", hook: "hook", tips: "tips", hl: "hl" })[bad[0]]); if (el) el.focus(); announce("Chưa lưu được: " + e[bad[0]]); return false; }
    var en = entry(S.placeId); en.draft = JSON.parse(JSON.stringify(form)); if (en.isNew) en.live = false; formDirty = false; save();
    if (!quiet) { render(); toast("Đã lưu bản nháp."); announce("Đã lưu bản nháp."); } return true;
  }
  function act(a, el) {
    var p = a.split(":"), k = p[0];
    if (k === "enter") { S.in = true; S.expired = false; S.restored = false; go("dests"); return; }
    if (k === "logout") { S.expired = false; navigate("login"); return; }
    if (k === "expire") { expire(); return; }
    if (k === "closeSheet") { closeSheet(); return; }
    if (k === "newDest") { S.newDests = S.newDests || {}; S.newDests[el.dataset.what] = { at: Date.now() }; save(); render(); toast("Đã tạo bản nháp «" + el.dataset.what + "». Chưa xuất bản."); return; }
    if (k === "dropDest") { S.newDests = S.newDests || {}; delete S.newDests[el.dataset.what]; save(); render(); toast("Đã bỏ bản nháp."); return; }
    if (k === "stub") { toast("Bản thử: " + el.dataset.what.toLowerCase() + " sẽ làm sau khi duyệt thiết kế."); return; }
    if (k === "togglePub") { var on = S.published; if (!on && destStat().ok < destStat().n) { S.tab = "quality"; render(); toast("Chưa xuất bản được điểm đến: còn địa điểm có lỗi chặn."); return; } confirmSheet(on ? "Gỡ điểm đến khỏi màn Khám phá?" : "Xuất bản điểm đến?", on ? "Người dùng sẽ không thấy " + cat.name + " ở màn Khám phá nữa. Chuyến đi đã lưu của họ vẫn giữ nguyên." : "Người dùng sẽ thấy " + cat.name + " ngay ở màn Khám phá.", on ? "Gỡ xuất bản" : "Xuất bản", "doTogglePub", on); return; }
    if (k === "doTogglePub") { S.published = !S.published; closeSheet(); render(); toast(S.published ? "Đã xuất bản điểm đến." : "Đã gỡ điểm đến."); return; }
    if (k === "newPlace") { var np = blankPlace(); S.places[np.id] = { draft: np, live: false, isNew: true, added: true }; form = JSON.parse(JSON.stringify(np)); S.placeId = np.id; go("place", { placeId: np.id }); return; }
    if (k === "revertGuide") { delete S.guide[p[1]]; closeSheet(); render(); toast("Đã bỏ thay đổi cẩm nang."); return; }
    if (k === "saveGuide") { var t = ($("g-title").value || "").trim(), s = ($("g-sum").value || "").trim(); if (!t) { $("g-warn").innerHTML = '<div class="warnbox" role="alert">Tiêu đề không được để trống.</div>'; $("g-title").focus(); return; } S.guide[p[1]] = { title: t, summary: s }; closeSheet(); render(); toast("Đã lưu bản nháp cẩm nang."); return; }
    if (k === "saveDraft") { saveDraft(); return; }
    if (k === "addPhoto") { readForm(); form.photos.push({ file: "", author: "", license: "", sourceUrl: "" }); formDirty = true; keep(function () { render(); }); var ni = $("ph-a" + (form.photos.length - 1)); if (ni) ni.focus(); return; }
    if (k === "publishPlace") {
      readForm(); var bl = blockers(form), fe = fieldErr(form);
      if (bl.length || Object.keys(fe).length) { tried = true; announce("Chưa xuất bản được: còn " + bl.length + " lỗi chặn."); toast("Chưa xuất bản được: còn " + bl.length + " lỗi chặn."); keep(function () { render(); }); $("pubwhy") && $("pubwhy").scrollIntoView({ block: "nearest" }); return; }
      confirmSheet("Xuất bản «" + (form.name || "địa điểm") + "»?", "Thay đổi hiện ra với mọi người dùng ngay. Nhớ rằng nội dung biên tập " + (form.reviewed ? "đã" : "CHƯA") + " được người kiểm chứng.", "Xuất bản", "doPublish"); return;
    }
    if (k === "doPublish") { var en = entry(S.placeId); en.draft = null; en.live = true; en.isNew = false; en.override = JSON.parse(JSON.stringify(form)); closeSheet(); formDirty = false; save(); go("dest", { tab: "places" }); toast("Đã xuất bản."); return; }
    if (k === "unpublishPlace") { confirmSheet("Gỡ xuất bản địa điểm này?", "Người dùng sẽ không thấy nó nữa. Địa điểm đã nằm trong chuyến đi của họ vẫn giữ nguyên.", "Gỡ xuất bản", "doUnpublish", true); return; }
    if (k === "doUnpublish") { readForm(); var e2 = entry(S.placeId); e2.draft = JSON.parse(JSON.stringify(form)); e2.live = false; closeSheet(); formDirty = false; save(); go("dest", { tab: "places" }); toast("Đã gỡ xuất bản. Địa điểm thành bản nháp."); return; }
    if (k === "discardDraft") { var isn = dropAll(S.placeId); confirmSheet(isn ? "Xóa bản nháp này?" : "Bỏ thay đổi chưa xuất bản?", isn ? "Địa điểm mới sẽ bị xóa hẳn." : (entry(S.placeId).live ? "Quay về nội dung đang xuất bản." : "Quay về bản đã lưu gần nhất. Địa điểm vẫn là bản nháp."), isn ? "Xóa bản nháp" : "Bỏ thay đổi", "doDiscard", true); return; }
    if (k === "doDiscard") { var e3 = entry(S.placeId); if (dropAll(S.placeId)) { delete S.places[S.placeId]; } else e3.draft = null; closeSheet(); formDirty = false; save(); go("dest", { tab: "places" }); toast("Đã bỏ."); return; }
    if (k === "leaveSave") { var ok = saveDraft(true); if (ok) { closeSheet(); go(leaveTo); } return; }
    if (k === "leaveDrop") { closeSheet(); formDirty = false; go(leaveTo); return; }
  }
  var leaveTo = "dest";
  function keep(fn) { var y = window.scrollY; fn(); window.scrollTo(0, y); }
  function navigate(to) {
    if (S.route === "place" && formDirty) { readForm(); leaveTo = to; panel.innerHTML = '<div class="pp"><h2 style="font-size:26px">Bạn có thay đổi chưa lưu</h2><p class="note">Lưu bản nháp trước khi rời đi, hoặc bỏ thay đổi.</p><div class="stack"><button class="btn block" type="button" data-act="leaveSave">Lưu bản nháp rồi rời đi</button><button class="btn danger block" type="button" data-act="leaveDrop">Bỏ thay đổi</button><button class="btn ghost block" type="button" data-act="closeSheet">Ở lại</button></div></div>'; showSheet(); return; }
    go(to);
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-act],[data-go],[data-open-dest],[data-edit],[data-tab],[data-guide],[data-month],[data-slot],[data-rmphoto]");
    if (!t) { if (ev.target === sheet) closeSheet(); return; }
    var d = t.dataset;
    if (d.act) { act(d.act, t); return; }
    if (d.go) { navigate(d.go); return; }
    if (d.openDest) { go("dest", { tab: "places" }); return; }
    if (d.tab) { S.tab = d.tab; render(); var tb = $("tab-" + d.tab); if (tb) tb.focus(); return; }
    if (d.edit) { openPlace(d.edit); return; }
    if (d.guide) { openGuide(d.guide); return; }
    if (d.month) { readForm(); var m = Number(d.month), i = form.bestMonths.indexOf(m); if (i >= 0) form.bestMonths.splice(i, 1); else form.bestMonths.push(m); form.bestMonths.sort(function (a, b) { return a - b; }); formDirty = true; keep(render); var nb = root.querySelector('[data-month="' + m + '"]'); if (nb) nb.focus(); return; }
    if (d.slot) { readForm(); var j = form.bestSlots.indexOf(d.slot); if (j >= 0) form.bestSlots.splice(j, 1); else form.bestSlots.push(d.slot); formDirty = true; keep(render); var sb = root.querySelector('[data-slot="' + d.slot + '"]'); if (sb) sb.focus(); return; }
    if (d.rmphoto) { readForm(); form.photos.splice(Number(d.rmphoto), 1); formDirty = true; keep(render); toast("Đã bỏ ảnh. Lưu bản nháp để giữ thay đổi."); return; }
  });
  var asideTimer = 0;
  function refreshAside() {   // bảng kiểm tra và nút Xuất bản phải khớp với những gì đang gõ, không đợi bấm Lưu
    if (S.route !== "place" || !form || !$("p-name")) return;
    readForm(); var old = root.querySelector(".aside"), m = renderPlace().match(/<aside[\s\S]*<\/aside>/); if (old && m) old.outerHTML = m[0];
  }
  document.addEventListener("submit", function (e) {
    if (!e.target.matches || !e.target.matches(".ndform")) return; e.preventDefault();
    var inp = $("nd-name"), er = $("nd-err"), v = len(inp.value) ? Array.from(inp.value.normalize("NFC").trim()).join("") : "";
    var all = allIds().length ? [cat.name].concat(OTHERS).concat(Object.keys(S.newDests || {})) : OTHERS;
    if (!v) { er.textContent = "Hãy nhập tên điểm đến."; inp.focus(); return; }
    if (len(v) > 80) { er.textContent = "Tên tối đa 80 ký tự."; inp.focus(); return; }
    if (all.some(function (n) { return nk(n) === nk(v); })) { er.textContent = "Điểm đến này đã có (hoặc đã có bản nháp)."; inp.focus(); return; }
    er.textContent = ""; S.newDests = S.newDests || {}; S.newDests[v] = { at: Date.now() }; save(); render(); toast("Đã tạo bản nháp «" + v + "». Chưa xuất bản.");
  });
  document.addEventListener("change", function (e) {
    var m = /^ph-f(\d+)$/.exec(e.target.id || ""); if (!m || S.route !== "place") return;
    var i = Number(m[1]), file = e.target.files && e.target.files[0], er = $("ph-fe" + i); if (!file || !er) return;
    if (PH_TYPES.indexOf(file.type) < 0) { er.textContent = "Chỉ nhận JPG, PNG hoặc WebP."; e.target.value = ""; return; }
    if (file.size > PH_MAX) { er.textContent = "Ảnh quá lớn (" + (file.size / 1048576).toFixed(1).replace(".", ",") + " MB). Tối đa 5 MB."; e.target.value = ""; return; }
    er.textContent = ""; readForm(); form.photos[i].pendingName = file.name; form.photos[i].pendingSize = file.size; formDirty = true; keep(render); announce("Đã chọn ảnh " + file.name + ". Chưa tải lên máy chủ trong bản thử.");
  });
  document.addEventListener("input", function (e) { if (S.route === "place" && e.target.closest("#pf")) { clearTimeout(asideTimer); asideTimer = setTimeout(refreshAside, 150); if (!formDirty) { formDirty = true; var h = root.querySelector(".ahead .arow2"); if (h && !h.querySelector('[role="status"]')) h.insertAdjacentHTML("beforeend", '<span class="badge warn" role="status">Chưa lưu</span>'); } } });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) { closeSheet(); return; }
    var tab = e.target.closest && e.target.closest('[role="tab"]');
    if (tab && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { var ids = ["places", "guide", "quality"], i = ids.indexOf(tab.dataset.tab), n = ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]; S.tab = n; render(); $("tab-" + n).focus(); e.preventDefault(); }
  });
  window.addEventListener("beforeunload", function (e) { if (formDirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- khởi động ---------- */
  fetch("/data/catalog/ha-giang.json").then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (c) {
    cat = c;
    // địa điểm đã xuất bản lại: working() lấy `override` làm gốc
    var orig = working; working = function (id) { var e = S.places[id]; if (e && e.draft) return e.draft; if (e && e.override) return e.override; return orig(id); };
    render();
  }).catch(function (e) { root.innerHTML = '<main class="amain"><div class="empty" role="alert"><h1 class="h2">Không đọc được kho biên tập</h1><p>' + esc(e.message) + '</p><button class="btn" type="button" onclick="location.reload()">Thử lại</button></div></main>'; });
})();
