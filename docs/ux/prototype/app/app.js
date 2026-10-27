(function () {
  "use strict";
  var DATA = window.WANDER_DATA;   // do adapt.js cấp từ kho biên tập thật
  var UI = window.WANDER_UI;   // hằng số giao diện (app/consts.js)
  var DEST = DATA.destination, PLACES = DATA.places, BY = {};
  PLACES.forEach(function (p) { BY[p.id] = p; });
  /** Địa điểm theo id; id không có trong kho (consts.js lệch kho) thì dùng địa điểm đầu tiên thay vì làm trắng màn. */
  function P(id) { return BY[id] || PLACES[0]; }
  var CATS = { canh: { name: "Cảnh quan", icon: "trees" }, van: { name: "Văn hóa", icon: "columns" }, am: { name: "Ẩm thực", icon: "tools-kitchen-2" }, leo: { name: "Leo núi", icon: "mountain" }, luu: { name: "Lưu trú", icon: "bed" }, cho: { name: "Chợ", icon: "building-store" } };
  var DAYC = ["var(--day-accent)"];   // một màu nhấn cho mọi ngày (PO 26/10/2026: nhiều màu gây rối khi chuyến dài); số ngày mới là thứ phân biệt
  var HUB = { name: "TP Hà Giang", lat: 22.8233, lon: 104.9836 };            // tọa độ gần đúng, cần kiểm chứng
  var DV = (BY["pho-co-dong-van"] || {}); var HUB2 = { name: "thị trấn Đồng Văn", lat: DV.lat, lon: DV.lon };
  var STYLES = ["Nghỉ dưỡng", "Khám phá", "Ẩm thực", "Biển", "Núi", "Thành phố", "Gia đình", "Bạn bè"], PACES = ["Thoải mái", "Vừa", "Dày"];
  var TOD = [["sang", "Sáng", "sunrise"], ["trua", "Trưa", "sun"], ["chieu", "Chiều", "sunset-2"], ["toi", "Tối", "moon-stars"]];
  function tok(name, fallback) { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fallback; }   // màu bản đồ đọc từ token để đổi bộ màu không lệch
  var NAMES = { "Bạn": "#b84c00", "Bình": "#0b58b8" };   // màu người dùng: chỉ hai tông thương hiệu (cam, trời)

  function ic(n, c) { return '<svg class="ic' + (c ? " " + c : "") + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  /* ---------- trạng thái ---------- */
  var KEY = "wander-kham-pha-proto-v8";
  var FRESH = /[?&]fresh=1(&|$)/.test(location.search);   // người mới hoàn toàn: không chuyến mẫu, chưa có danh tính (F1→F2)
  if (FRESH) { try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ } }
  var state = { sheetSnap: "half", theme: "light", exportKind: "Ảnh", expiredBranch: null, todaySim: null, onboarded: false, identity: null, pairing: null, recovered: false, sortMode: false, decisions: {}, history: [], trips: [], view: "explore", tripId: null, role: "owner", addTripId: null, photo: {}, skipped: [], seeded: false, dayTab: "ov", cat: "all", guide: "mua", pack: {} };
  try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s === "object") for (var k in state) if (k in s) state[k] = s[k]; } catch (e) { /* chạy không lưu */ }
  if (FRESH) state.seeded = true;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* bỏ qua */ } }
  /* giao diện: mặc định SÁNG (PO 25/10/2026), không theo hệ thống trừ khi chọn "Theo hệ thống"; công cụ kiểm đặt window.__WANDER_THEME = "system" để mô phỏng chế độ tối */
  function applyTheme() { var th = window.__WANDER_THEME || state.theme || "light", root = document.documentElement; if (th === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", th === "dark" ? "dark" : "light"); }
  applyTheme();
  var $ = function (id) { return document.getElementById(id); };
  var wide = function () { return window.matchMedia("(min-width: 768px)").matches; };
  var drawerOK = function () { return window.matchMedia("(min-width: 1280px)").matches; };
  var screen = $("screen"), tabbar = $("tabbar"), sheet = $("sheet"), panel = $("panel"), toastEl = $("toast"), floatEl = $("float");
  var reduce = function () { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; };   // đọc mỗi lần dùng, theo dõi được khi người dùng đổi cài đặt
  var lastFocus = null, toastTimer = null, saveMode = "new", reviewList = [], lastKey = "", planDraft = null, createCtx = {}, pickStyles = [], pickPace = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function toast(t, undoFn) {
    toastEl.innerHTML = "<span>" + esc(t) + "</span>" + (undoFn ? '<button type="button" id="undoBtn">Hoàn tác</button>' : "");
    toastEl.hidden = false; clearTimeout(toastTimer);
    if (undoFn) $("undoBtn").addEventListener("click", function () { undoFn(); toastEl.hidden = true; });
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, undoFn ? 10000 : 2600);
  }
  toastEl.addEventListener("focusin", function () { clearTimeout(toastTimer); });   // người dùng bàn phím/đọc màn hình không bị hết giờ Hoàn tác khi đang focus
  function dropUndo() { toastEl.hidden = true; toastEl.innerHTML = ""; clearTimeout(toastTimer); }   // một thay đổi mới làm Hoàn tác (snapshot) cũ hết nghĩa
  function newLink() { var r = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(r); return [].map.call(r, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }   // bản thật: ≥ 128 bit, lưu băm, có hạn, thu hồi được
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function noAccent(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase(); }
  function trip(id) { return state.trips.filter(function (t) { return t.id === id; })[0]; }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function dm(s) { return s.slice(8) + "/" + s.slice(5, 7); }
  /** Các màn dùng chuyển cảnh mượt (ảnh bìa trượt từ thẻ sang đầu trang). Màn có form hoặc tờ phủ vẽ ngay để tránh trễ. */
  var SMOOTH_VIEWS = ["explore", "dest", "deck", "picked", "trips"];
  function go(v, extra) {
    var prev = state.view; state.view = v; if (extra) for (var k in extra) state[k] = extra[k]; save();
    var smooth = !!document.startViewTransition && !window.__WANDER_NO_VT && !Motion.reduced() && prev !== v && SMOOTH_VIEWS.indexOf(prev) >= 0 && SMOOTH_VIEWS.indexOf(v) >= 0 && sheet.hidden;
    if (!smooth) { render(); return; }
    try { document.startViewTransition(function () { render(); }); } catch (e) { render(); }
  }
  function catOf(p) { return CATS[p.cat]; }
  /** "Tháng 9–11" hoặc "Tháng 3–4, 9–11": gộp các tháng liền nhau, chịu được mảng rỗng hoặc thiếu. */
  function monthRange(arr) {
    var m = (arr || []).map(Number).filter(function (x) { return x >= 1 && x <= 12; }).sort(function (a, b) { return a - b; }).filter(function (x, i, l) { return l.indexOf(x) === i; }), out = [], i = 0;
    while (i < m.length) { var j = i; while (j + 1 < m.length && m[j + 1] === m[j] + 1) j++; out.push(j > i ? m[i] + "–" + m[j] : String(m[i])); i = j + 1; }
    return out.length ? "Tháng " + out.join(", ") : "";
  }

  /* khoảng cách ước tính: đường chim bay x hệ số đường núi, chia tốc độ giả định */
  function air(a, b) { if (a.lat == null || b.lat == null) return null; var R = 6371, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); }
  function km(a, b) { var d = air(a, b); return d == null ? null : d * 1.5; }
  function hrs(k) { return k / 25; }
  function fmtT(h) { var m = Math.round(h * 60 / 15) * 15; if (m < 60) return Math.max(15, m) + " phút"; m = Math.round(h * 2) * 30; var hh = Math.floor(m / 60); return hh + (m % 60 ? ",5" : "") + " giờ"; }
  function away(p, hub) { var d = km(p, hub || HUB); return d == null ? null : Math.max(1, Math.round(d)); }

  function todayU() { var n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }
  function nextSat() { var d = todayU(); d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7)); return d; }
  function seedDemo() {
    var d = nextSat(), e = new Date(d); e.setUTCDate(e.getUTCDate() + 2);
    var ds = [iso(d), iso(new Date(d.getTime() + 864e5)), iso(e)];
    var mk = function (pid, day, by, rem, x) { var o = { id: uid(), placeId: pid, day: day, addedBy: by, removal: rem || null }; if (x) for (var q in x) o[q] = x[q]; return o; };
    var fk = function (type, title, day, x) { var o = { id: uid(), placeId: null, type: type, title: title, day: day, addedBy: "Bạn", removal: null, done: {} }; if (x) for (var q in x) o[q] = x[q]; return o; };
    var now = Date.now();
    state.trips.push({ id: "demo", name: "Hà Giang - mẫu", start: ds[0], end: ds[2], shared: true, demo: true, styles: ["Khám phá", "Núi"], pace: "Vừa", budget: null, items: [
      mk("cao-nguyen-da", ds[0], "Bạn", null, { cost: 0 }), mk("dinh-vuong", ds[0], "Bạn", null, { cost: 30, time: "10:00", dur: 60 }), mk("cot-co-lung-cu", ds[0], "Bạn", null, { included: true, ref: 25 }),
      fk("food", "Ăn trưa (mẫu)", ds[0], { cost: 120, time: "12:30", dur: 60 }), fk("lodging", "Homestay Đồng Văn (mẫu)", ds[0], { cost: 450, booking: "booked", note: "Số tiền chỉ để minh họa." }),
      mk("deo-ma-pi-leng", ds[1], "Bạn"),
      mk("song-nho-que", ds[1], "Bạn", { by: "Bình", when: "2 giờ trước", reason: "Đi thuyền mất gần nửa buổi, cả nhóm dễ say sóng.", status: "pending" }, { cost: 150 }),
      fk("rest", "Nghỉ trưa", ds[1], { dur: 60 }), fk("task", "Đổ xăng trước khi lên đèo", ds[1]),
      mk("pho-co-dong-van", null, "Bình"), mk("hoang-su-phi", null, "Bạn"), mk("tay-con-linh", null, "Bạn")
    ], trash: [
      { id: uid(), at: now - 5 * 864e5, by: "Bạn", day: ds[0], item: fk("shopping", "Mua áo mưa (mẫu)", ds[0], { cost: 60 }) },
      { id: uid(), at: now - 29 * 864e5, by: "Bình", day: ds[2], item: mk("cong-troi-quan-ba", ds[2], "Bình") }
    ] });
    state.seeded = true;
  }
  if (!state.seeded && !state.trips.length) seedDemo();
  if (!state.identity && state.trips.length && !FRESH) state.identity = demoIdentity(true);   // chuyến mẫu thuộc về một danh tính mẫu
  // Dữ liệu cũ có thể trỏ tới địa điểm đã bị gỡ khỏi kho: bỏ để không trắng trang (M7)
  state.trips.forEach(function (t) { t.items = t.items.filter(function (i) { return !i.placeId || BY[i.placeId]; }); t.trash = (t.trash || []).filter(function (e) { return !e.item.placeId || BY[e.item.placeId]; }); });
  Object.keys(state.decisions).forEach(function (id) { if (!BY[id]) delete state.decisions[id]; });
  state.history = state.history.filter(function (id) { return BY[id]; }); state.skipped = state.skipped.filter(function (id) { return BY[id]; });
  (function refreshDemo() {
    var d = trip("demo"); if (!d || d.start >= iso(todayU())) return;
    var od = days(d), s = nextSat(), nd = od.map(function (_, k) { return iso(new Date(s.getTime() + k * 864e5)); });
    d.items.forEach(function (i) { if (i.day) { var k = od.indexOf(i.day); i.day = k >= 0 ? nd[k] : null; } });
    d.start = nd[0]; d.end = nd[nd.length - 1];
  })();

  /* ---------- logic ---------- */
  function candidates() {
    var t = state.addTripId ? trip(state.addTripId) : null;
    return PLACES.filter(function (p) {
      if (state.cat !== "all" && p.cat !== state.cat) return false;
      if (t) return !t.items.some(function (i) { return i.placeId === p.id; }) && state.skipped.indexOf(p.id) < 0;
      return !state.decisions[p.id];
    });
  }
  function picked() { return PLACES.filter(function (p) { return state.decisions[p.id] === "like"; }); }
  function uniqueName(base) { var names = state.trips.map(function (t) { return t.name; }); if (names.indexOf(base) < 0) return base; for (var n = 2; n < 200; n++) if (names.indexOf(base + " - " + n) < 0) return base + " - " + n; return base + " - " + uid(); }
  function decide(id, dir) {
    if (state.addTripId) {
      if (dir === "r") { var t = trip(state.addTripId); t.items.push({ id: uid(), placeId: id, day: null, addedBy: state.role === "owner" ? "Bạn" : mb(), removal: null }); toast("Đã thêm vào chuyến đi, cả nhóm sẽ thấy."); }
      else state.skipped.push(id);
    } else { state.decisions[id] = dir === "r" ? "like" : "skip"; state.history.push(id); }
    state.photo[id] = 0; save(); render();
  }
  function undo() { if (state.addTripId) return; var id = state.history.pop(); if (!id) return; delete state.decisions[id]; save(); render(); }
  function days(t) { var out = [], d = new Date(t.start), e = new Date(t.end); while (d <= e && out.length < 366) { out.push(iso(d)); d.setUTCDate(d.getUTCDate() + 1); } return out; }
  var WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  function dayName(s) { return WD[new Date(s).getUTCDay()] + " " + dm(s); }
  function fullDate(s) { return s ? WD[new Date(s).getUTCDay()] + ", " + s.slice(8) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : ""; }
  // ô ngày gốc hiển thị theo hệ điều hành (có thể mm/dd/yyyy): dưới ô luôn ghi lại dạng dd/mm/yyyy kèm thứ
  function hintDates(root) { root.querySelectorAll('input[type="date"]').forEach(function (inp) { var h = inp.parentNode.querySelector(".hint"); if (h) h.textContent = fullDate(inp.value); }); }
  function pendingOf(t) { return t.items.filter(function (i) { return i.removal && i.removal.status === "pending"; }); }
  function avatar(n) { return '<span class="av" style="background:' + (NAMES[n] || "#0b58b8") + '" title="' + esc(n) + '">' + esc(n === "Bạn" ? "Tôi" : Array.from(n)[0] || "?") + "</span>"; }
  function members(t) { var s = ["Bạn"], gone = t.removed || []; t.items.forEach(function (i) { if (s.indexOf(i.addedBy) < 0) s.push(i.addedBy); }); if (t.shared && s.indexOf(mb()) < 0) s.push(mb()); return s.filter(function (n) { return n === "Bạn" || gone.indexOf(n) < 0; }); }
  function dayItems(t, d) { return t.items.filter(function (i) { return i.day === d; }).sort(function (a, b) { return (a.ord == null ? 1e6 : a.ord) - (b.ord == null ? 1e6 : b.ord); }); }
  function dayColor(k) { return DAYC[k % DAYC.length]; }
  function dateRange(t) { return dm(t.start) + " – " + dm(t.end) + (t.tentative ? " · chưa chắc" : ""); }
  function snapshot(t) { return JSON.stringify({ start: t.start, end: t.end, name: t.name, tentative: !!t.tentative, items: t.items, trash: t.trash || [] }); }
  function restore(t, snap) { var o = JSON.parse(snap); t.start = o.start; t.end = o.end; t.name = o.name; t.tentative = !!o.tentative; t.items = o.items; t.trash = o.trash || []; }

  /* ---------- khung ---------- */
  function renderTabs() {
    var hide = state.view === "onboard" || state.view === "expired" || (!wide() && state.view === "export") || !wide() && (state.view === "today" || state.view === "deck" || state.view === "trip" || state.view === "dest" || state.view === "trash");
    tabbar.hidden = hide; screen.classList.toggle("nobar", hide); if (hide) return;
    var nb = picked().length, np = state.trips.reduce(function (a, t) { return a + pendingOf(t).length; }, 0);
    var tab = function (v, icon, label, badge, warn) { return '<button class="tab" type="button" data-go="' + v + '"' + (state.view === v ? ' aria-current="page"' : "") + ">" + ic(icon) + "<span>" + label + "</span>" + (badge ? '<span class="dot' + (warn ? " warn" : "") + '">' + badge + "</span>" : "") + "</button>"; };
    var brand = wide() ? '<button class="brand" type="button" data-go="explore" aria-label="Wander, về Khám phá"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M21.5 2.5L2.5 10l7 2.6L12 20.5z"/></svg><span>Wander</span></button>' : "";
    var navr = wide() ? '<span class="navr"><button class="iconbtn" type="button" data-go="settings" aria-label="Cài đặt và giới thiệu"' + (state.view === "settings" ? ' aria-current="page"' : "") + ">" + ic("info-circle") + '</button><button class="iconbtn" type="button" data-go="security" aria-label="Bảo mật và thiết bị' + (state.identity && state.identity.unseen ? ", có hoạt động mới" : "") + '"' + (state.view === "security" ? ' aria-current="page"' : "") + ">" + ic("shield") + (state.identity && state.identity.unseen ? '<span class="udot" aria-hidden="true"></span>' : "") + "</button></span>" : "";
    tabbar.innerHTML = brand + tab("explore", "compass", "Khám phá") + tab("picked", "bookmarks", "Đã chọn", nb) + tab("trips", "calendar-event", "Chuyến đi", np, true) + navr;
  }
  function render() {
    var key = state.view + "|" + state.tripId + "|" + state.dayTab, keep = key === lastKey, st = screen.scrollTop, sbEl = screen.querySelector(".sheet-scroll") || screen.querySelector(".sheetbody"), sbt = sbEl ? sbEl.scrollTop : 0; lastKey = key;
    if (state.view !== "onboard" && obMap) { obMap.destroy(); obMap = null; }
    if (state.view !== "explore" && state.view !== "dest" && state.view !== "picked" && homeMap) { homeMap.destroy(); homeMap = null; }
    if (state.view !== "trip" && tripMap) { tripMap.destroy(); tripMap = null; tripMapTrip = null; tripSheet = null; }
    screen.dataset.view = state.view; renderTabs(); floatEl.hidden = true;
    screen.className = screen.classList.contains("nobar") ? "nobar" : "";
    if (state.view === "export") renderExport(); else if (state.view === "settings") renderSettings(); else if (state.view === "expired") renderExpired(); else if (state.view === "today") renderToday(); else if (state.view === "onboard") renderOnboard(); else if (state.view === "explore") renderExplore(); else if (state.view === "dest") renderDest(); else if (state.view === "deck") renderDeck();
    else if (state.view === "picked") renderPicked(); else if (state.view === "trips") renderTrips(); else if (state.view === "trip") renderTrip(); else if (state.view === "trash") renderTrash(); else if (state.view === "security") renderSecurity(); else if (state.view === "recover") renderRecover();
    renderTabs(); screen.scrollTop = keep ? st : 0;
    if (keep && sbt) { var nbEl = screen.querySelector(".sheet-scroll") || screen.querySelector(".sheetbody"); if (nbEl) nbEl.scrollTop = sbt; }   // màn rộng: vùng cuộn là .sheetbody, không để chọn ngày/sửa mục kéo về đầu trang
    if (!keep) { screen.classList.add("enter"); clearTimeout(enterT); enterT = setTimeout(function () { screen.classList.remove("enter"); }, 1100); }
    initReveal();
    if (state.view === "deck") syncDrawer();
  }
  var enterT = null, rvObs = null;
  function initReveal() {   // hiện dần các khối .rv khi cuộn tới; giảm chuyển động thì hiện ngay
    Motion.countUp(screen);
    var els = screen.querySelectorAll(".rv"); if (!els.length) return;
    if (reduce() || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    if (rvObs) rvObs.disconnect();
    rvObs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rvObs.unobserve(e.target); } }); }, { root: screen, rootMargin: "0px 0px -8% 0px", threshold: .08 });
    els.forEach(function (e) { rvObs.observe(e); });
  }
  var coverSrc = function () { return P(DEST.coverPlaceId || UI.PLACE.COVER).photos[0].src; };

  /* ---------- onboarding 3 cảnh (DG-2 A2; làm lại 26/10/2026 theo PO: cần "wow" và có móc giữ chân) ----------
     Cảnh 1 khơi cảm hứng bằng ảnh thật và sự thật có thật từ kho biên tập; cảnh 2 CHO THẤY cách quẹt bằng bộ bài tự chạy;
     cảnh 3 CHO THẤY lịch tự thành hình. Mọi chuyển động là CSS (tắt khi giảm chuyển động, khung cuối vẫn đọc được). */
  var obStep = 0, obMap = null;
  var OB = [
    { id: UI.PLACE.COVER, title: "Có một nơi đang đợi bạn", cta: "Tiếp", scene: "invite" },
    { id: UI.PLACE.PASS, title: "Quẹt phải là mê, quẹt trái là thôi", text: UI.COPY.OB_SWIPE, cta: "Tiếp", scene: "swipe", eyebrow: "Bước 2 · Chọn nơi mê" },
    { id: UI.PLACE.RIVER, title: "Rồi lịch tự thành hình", text: UI.COPY.OB_PLAN, cta: "Bắt đầu khám phá", scene: "plan", eyebrow: "Bước 3 · Xếp lịch" }
  ];
  /** Tách tiêu đề thành từng chữ để hiện lần lượt (chữ vẫn liền mạch với trình đọc màn hình). */
  function obWords(text) {
    return text.split(" ").map(function (w, k) { return '<span class="w" style="--w:' + k + '">' + esc(w) + "</span>"; }).join(" ");
  }
  /** Dòng ghi công ảnh của cảnh i: cảnh 1 nêu tác giả ảnh bìa; cảnh 2–3 chỉ về nơi xem nguồn từng ảnh. */
  function obCredit(i) {
    var p = P(OB[i].id), ph = p.photos[0];
    if (OB[i].scene === "invite") return "Ảnh: " + esc(ph.artist || "") + (ph.license ? " · " + esc(ph.license) : "");
    return "Ảnh từ Wikimedia Commons; tác giả và giấy phép từng ảnh nằm ở nút ⓘ của mỗi địa điểm.";
  }
  /** Khối chữ của cảnh i: nhãn, tiêu đề, lời mời, ghi công ảnh (chữ mực trên nền sáng). */
  function obTextHtml(i) {
    var s = OB[i], p = P(s.id), text = s.text || p.hook;
    return '<p class="obx-eyebrow">' + ic("map-pin", "s") + esc(s.eyebrow || p.name + ", " + DEST.name) + "</p><h1>" + obWords(s.title) + "</h1><p class=\"obx-text\">" + esc(text) + '</p><p class="obx-credit">' + obCredit(i) + ' <span class="obx-draft">Bản nháp nội dung</span></p>';
  }
  /** Cảnh 1: thẻ ảnh lớn nghiêng nhẹ trên nền trời, ba "sự thật" từ kho biên tập nổi lên, máy bay lướt, la bàn xoay. */
  function obSceneInvite(p) {
    var best = String(p.best || "").toLowerCase();
    return '<div class="obs obs-invite"><div class="obs-sunbg">' + WanderArt.sun() + '</div><figure class="obs-hero"><img alt="" src="' + p.photos[0].src + '" fetchpriority="high"></figure>' +
      '<span class="obs-fact f1" style="--k:0">' + ic("map-pin", "s") + esc(p.name) + "</span>" +
      '<span class="obs-fact f2" style="--k:1">' + ic("calendar-event", "s") + "Đẹp nhất " + esc(best) + "</span>" +
      '<span class="obs-fact f3" style="--k:2">' + ic("hand-finger", "s") + PLACES.length + " nơi đang chờ bạn quẹt</span>" + WanderArt.plane() + WanderArt.compass("obs-compass") + "</div>";
  }
  /** Cảnh 2: bộ bài tự quẹt (phải = chọn, trái = bỏ qua), bàn tay chạy theo thẻ, bộ đếm "Đã chọn" nhảy số. */
  function obSceneSwipe() {
    var cards = UI.ONBOARD.SWIPE_DEMO.map(function (id, i) {
      var p = P(id), no = i === 1;
      return '<figure class="obs-card c' + (i + 1) + '"><img alt="" src="' + p.photos[0].src + '"><figcaption>' + esc(p.name) + '</figcaption><span class="obs-stamp ' + (no ? "no" : "yes") + '">' + ic(no ? "x" : "check") + "</span></figure>";
    }).reverse().join("");
    return '<div class="obs obs-swipe"><div class="obs-deck">' + cards + '<span class="obs-hand">' + ic("hand-finger", "xl") + '</span></div><div class="obs-count">' + ic("bookmarks", "s") + "Đã chọn " + '<span class="obs-n"><i class="n0">0</i><i class="n1">1</i><i class="n2">2</i></span></div></div>';
  }
  /** Cảnh 3: bản đồ địa hình thật vẽ tuyến ngày 1 (ghim rơi, đường vẽ dần), dưới là hai ngày xếp sẵn. */
  function obScenePlan() {
    var k = 0;
    return '<div class="obs obs-plan"><div class="obs-map" id="obs-map"></div><div class="obs-days">' + UI.ONBOARD.PLAN_DEMO.map(function (d, di) {
      return '<section class="obs-day"><h3>' + esc(d.label) + '</h3><div class="obs-chips">' + d.places.map(function (id) {
        var p = P(id);
        return '<span class="obs-stop" style="--k:' + (k++) + '"><img alt="" src="' + p.photos[0].src + '"><b>' + esc(p.name) + "</b></span>";
      }).join("") + "</div></section>";
    }).join("") + '<p class="obs-done" style="--k:' + k + '">' + ic("check", "s") + esc(UI.COPY.OB_PLAN_DONE) + "</p></div></div>";
  }
  /** Dựng bản đồ nhỏ của cảnh 3 sau khi sân khấu đã vào DOM (huỷ bản cũ nếu có). */
  function mountObMap() {
    if (obMap) { obMap.destroy(); obMap = null; }
    var host = $("obs-map"); if (!host) return;
    var ids = UI.ONBOARD.PLAN_DEMO[0].places.filter(function (id) { return BY[id] && BY[id].lat != null; });
    obMap = new TerrainMap(host, { dest: DEST.id, interactive: false, towns: false, credit: false });
    obMap.setMode("route"); obMap.setMarkers(ids.map(function (id, i) { var p = P(id); return { id: id, lat: p.lat, lon: p.lon, label: p.name, thumb: p.photos[0].src, num: i + 1 }; }));
    obMap.setRoute(ids, ids.slice(1).map(function (id, i) { var d = km(P(ids[i]), P(id)); return d ? "~" + Math.round(d) + " km" : ""; })); obMap.fitTo(null, { animate: false, padding: 40 });
  }
  /** Sân khấu của cảnh i (phần minh họa nằm giữa thanh trên và khối chữ). */
  function obStageHtml(i) {
    var s = OB[i];
    return s.scene === "swipe" ? obSceneSwipe() : s.scene === "plan" ? obScenePlan() : obSceneInvite(P(s.id));
  }
  function renderOnboard() {
    var n = obStep;
    screen.innerHTML = '<section class="obx" data-step="' + n + '"><div class="obx-sky" aria-hidden="true"><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div></div>' +
      '<div class="obx-top">' + (n > 0 ? '<button class="iconbtn glass" type="button" data-act="obBack" aria-label="Quay lại">' + ic("chevron-left") + "</button>" : '<span class="obx-space" aria-hidden="true"></span>') +
      '<div class="obar obx-bar" role="progressbar" aria-valuemin="1" aria-valuemax="' + OB.length + '" aria-valuenow="' + (n + 1) + '" aria-label="Bước ' + (n + 1) + " trên " + OB.length + '">' + OB.map(function (_, i) { return '<i class="' + (i <= n ? "on" : "") + '"></i>'; }).join("") + "</div>" +
      '<button class="obx-skip" type="button" data-act="obSkip">Bỏ qua</button></div>' +
      '<div class="obx-stage" id="obx-st" aria-hidden="true">' + obStageHtml(n) + "</div>" +
      '<div class="obx-body"><div class="obx-text-wrap" id="obx-tx">' + obTextHtml(n) + '</div><button class="btn block obx-cta" type="button" data-act="obNext">' + OB[n].cta + "</button></div></section>";
    mountObMap();
  }
  function paintOnboard() {   // đổi cảnh tại chỗ: nền trời đứng yên, sân khấu và chữ thay có hoạt họa
    var root = screen.querySelector(".obx"); if (!root) { renderOnboard(); return; }
    var n = obStep;
    root.dataset.step = n;
    var tx = $("obx-tx"); tx.innerHTML = obTextHtml(n); tx.classList.remove("swap"); void tx.offsetWidth; tx.classList.add("swap");
    $("obx-st").innerHTML = obStageHtml(n); mountObMap();
    root.querySelectorAll(".obx-bar i").forEach(function (b, i) { b.classList.toggle("on", i <= n); });
    var bar = root.querySelector(".obx-bar"); bar.setAttribute("aria-valuenow", n + 1); bar.setAttribute("aria-label", "Bước " + (n + 1) + " trên " + OB.length);
    var top = root.querySelector(".obx-top"), back = top.querySelector('[data-act="obBack"]'), sp = top.querySelector(".obx-space");
    if (n > 0 && !back) { var b = document.createElement("button"); b.className = "iconbtn glass"; b.type = "button"; b.setAttribute("data-act", "obBack"); b.setAttribute("aria-label", "Quay lại"); b.innerHTML = ic("chevron-left"); top.insertBefore(b, sp || top.firstChild); if (sp) sp.remove(); }
    else if (n === 0 && back) { var s2 = document.createElement("span"); s2.className = "obx-space"; s2.setAttribute("aria-hidden", "true"); back.replaceWith(s2); }
    root.querySelector(".obx-cta").textContent = OB[n].cta;
    var h1 = tx.querySelector("h1"); h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true });
  }
  function obDone() { state.onboarded = true; obStep = 0; go("explore"); }

  /* ---------- khám phá (v6, 26/10/2026: nhiều yếu tố gợi cảm hứng, chuyển động, bản đồ địa hình, lịch mẫu) ---------- */
  var OTHERS = ["Sa Pa", "Hội An", "Đà Lạt", "Ninh Bình", "Phú Quốc", "Đà Nẵng"];
  var homeMap = null, homeMapFor = "", bigMap = null, sheetMaps = [];
  /** Các nơi đang vào mùa đẹp của tháng hiện tại (theo kho biên tập). */
  function monthPlaces() { var m = new Date().getMonth() + 1; return PLACES.filter(function (p) { return (p.bestMonths || p.months || []).map(Number).indexOf(m) >= 0; }); }
  /** Ảnh đầu của một địa điểm theo id. */
  function photoOf(id) { return P(id).photos[0].src; }
  /** Hero trang chủ màn rộng: ảnh thật chuyển mờ, câu mời và ô tìm kiếm. */
  function heroWide() {
    var ids = [UI.PLACE.PASS, UI.PLACE.COVER, UI.PLACE.RIVER], mp = monthPlaces(), m = new Date().getMonth() + 1;
    var eyebrow = mp.length ? "Tháng " + m + " · " + mp.length + " nơi ở " + DEST.name + " đang vào mùa đẹp" : DEST.name + " · " + String(DEST.tagline || "").toLowerCase();
    return '<section class="hero-w"><div class="hero-ph" aria-hidden="true">' + ids.map(function (id, i) { return '<figure class="hs" style="--i:' + i + '"><img alt="" src="' + photoOf(id) + '"' + (i ? "" : ' fetchpriority="high"') + "></figure>"; }).join("") + '</div><div class="hero-scrim" aria-hidden="true"></div>' +
      '<div class="hero-in"><p class="hero-eyebrow">' + ic("sun", "s") + esc(eyebrow) + '</p><h1 class="hero-h">Quẹt nơi mê,<br>đi cho đã.</h1><p class="hero-sub">Ảnh thật, nhãn biên tập, cách bao xa. Chọn vài nơi làm bạn mê rồi lên đường.</p>' +
      '<div class="hero-act"><button class="btn" type="button" data-go="dest">' + ic("hand-finger") + 'Bắt đầu quẹt ' + esc(DEST.name) + '</button><label class="search hero-search">' + ic("compass") + '<input id="q" type="search" placeholder="Bạn muốn đi đâu? Thử Hà Giang" autocomplete="off" aria-label="Tìm điểm đến"></label></div></div></section>';
  }
  /** Nhãn "ghim" nổi trên bầu trời trang chủ (tên nơi thật). */
  function pinsHtml() { return UI.HOME.PINS.map(function (x) { return '<span class="pin ' + x.cls + '">' + ic("map-pin", "s") + esc(P(x.id).name) + "</span>"; }).join(""); }
  /** Thẻ giữa của quạt: ảnh các nơi chạy luân phiên, tên đổi theo ảnh, dấu "thích" nảy lên như vừa quẹt phải. */
  function liveCardHtml() {
    var ids = UI.HOME.LIVE_CARD;
    return '<figure class="f2 live">' + ids.map(function (id, k) { return '<img alt="" src="' + photoOf(id) + '" style="--n:' + k + '">'; }).join("") + "<i></i>" + ids.map(function (id, k) { return '<span style="--n:' + k + '">' + esc(P(id).name) + "</span>"; }).join("") + '<em class="live-ok" aria-hidden="true">' + ic("check") + "</em></figure>";
  }
  /** Câu mời đổi luân phiên dưới logo (chữ đọc được là câu đầu; các câu sau chỉ trang trí). */
  function hookRotator() {
    var hooks = UI.COPY.HOME_HOOKS;
    var say = function (h) { return h.replace("{dest}", DEST.name); };
    return '<div class="tagline" role="text" aria-label="' + esc(say(hooks[0])) + '">' + hooks.map(function (h, k) { return '<span aria-hidden="true" style="--n:' + k + '">' + esc(say(h)) + "</span>"; }).join("") + "</div>";
  }
  /** Hero trang chủ điện thoại: trời có mặt trời, mây trôi, máy bay lướt, quạt ảnh, ghim nổi, la bàn. */
  function homeHeroHtml() {
    var f = function (id, cls) { var p = P(id); return '<figure class="' + cls + '"><img alt="" src="' + p.photos[0].src + '"><i></i><span>' + esc(p.name) + "</span></figure>"; }, fan = UI.HOME.FAN;
    return '<section class="sky"><div class="sky-sun">' + WanderArt.sun() + '</div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>' +
      '<h1 class="logo">Wander</h1>' + hookRotator() + pinsHtml() + WanderArt.plane() +
      '<div class="fan">' + f(fan[0], "f1") + liveCardHtml() + f(fan[2], "f3") + "</div>" + WanderArt.compass() + "</section>";
  }
  /** Dải tên các nơi thật chạy ngang (chỉ trang trí, ẩn với trình đọc màn hình). */
  function ribbonHtml() {
    var one = PLACES.map(function (p) { return "<span>" + ic("map-pin", "s") + esc(p.name) + "</span>"; }).join("");
    return '<div class="ribbon" aria-hidden="true"><div class="ribbon-track">' + one + one + "</div></div>";
  }
  /** Tiêu đề một khối: tên + (tùy chọn) nhãn hoặc nút bên phải. */
  function secHead(title, right) { return '<div class="sec-head"><h2 class="h2">' + title + "</h2>" + (right || "") + "</div>"; }
  /** Ô "Bạn đang mê gì?": mỗi loại một ảnh thật và số nơi; chạm để quẹt riêng loại đó. */
  function moodHtml() {
    var cats = [], by = {};
    PLACES.forEach(function (p) { if (!by[p.cat]) { by[p.cat] = []; cats.push(p.cat); } by[p.cat].push(p); });
    return '<section class="stack rv">' + secHead(UI.COPY.HOME_MOODS) + '<div class="hscroll moods">' + cats.map(function (c) {
      var l = by[c];
      return '<button class="mood" type="button" data-catgo="' + c + '"><img alt="" src="' + l[0].photos[0].src + '" loading="lazy"><span class="mood-in"><span class="mood-ic">' + ic(CATS[c].icon) + "</span><b>" + CATS[c].name + "</b><span>" + l.length + " nơi</span></span></button>";
    }).join("") + "</div></section>";
  }
  /** Tổng quãng đường ước tính của một lịch mẫu (cộng khoảng cách giữa các nơi liền nhau trong từng ngày). */
  function tplKm(tp) {
    var t = 0; tp.days.forEach(function (d) { var ids = d.filter(function (id) { return BY[id] && BY[id].lat != null; }); for (var i = 1; i < ids.length; i++) { var x = km(BY[ids[i - 1]], BY[ids[i]]); if (x) t += x; } }); return Math.round(t);
  }
  /** Khối "Lịch mẫu": gợi ý lịch ghép từ các nơi có thật, nhãn bản nháp biên tập; "Dùng lịch này" tạo chuyến đi. */
  function templatesHtml() {
    return '<section class="stack rv">' + secHead(UI.COPY.HOME_TEMPLATES, '<span class="chip tint">Bản nháp biên tập</span>') + '<div class="hscroll tpls">' + UI.TEMPLATES.map(function (tp) {
      var ids = [].concat.apply([], tp.days).filter(function (id) { return BY[id]; });
      return '<article class="tpl"><div class="tpl-photos" aria-hidden="true">' + ids.slice(0, 4).map(function (id, k) { return '<img alt="" src="' + photoOf(id) + '" style="--k:' + k + '" loading="lazy">'; }).join("") + "</div>" +
        "<h3>" + esc(tp.title) + '</h3><p class="tpl-meta">' + tp.days.length + " ngày · " + ids.length + " nơi · ~" + tplKm(tp) + ' km, ước tính</p><p class="tpl-note">' + esc(tp.note) + '</p><button class="btn" type="button" data-tpl="' + tp.id + '">' + ic("wand") + "Dùng lịch này</button></article>";
    }).join("") + "</div></section>";
  }
  /** Khối bản đồ địa hình của điểm đến (tĩnh, chạm ghim để xem; nút mở rộng để kéo và phóng). */
  function mapCardHtml() {
    return '<section class="stack rv">' + secHead(DEST.name + " trên bản đồ", '<button class="linkbtn" type="button" data-act="openMap">' + ic("map-pin", "s") + " Mở rộng</button>") + '<div class="mapcard" id="mapcard"></div></section>';
  }
  /** Danh sách ghim của mọi địa điểm có tọa độ. */
  function placeMarkers() { return PLACES.filter(function (p) { return p.lat != null; }).map(function (p) { return { id: p.id, lat: p.lat, lon: p.lon, label: p.name, thumb: p.photos[0].src }; }); }
  /** Dựng bản đồ tĩnh ở khối "trên bản đồ" (dựng lại mỗi lần vẽ lại danh sách). */
  function mountHomeMap() {
    var host = $("mapcard");
    if (homeMap && homeMapFor === state.view && homeMap.host !== host && host) { host.replaceWith(homeMap.host); return; }   // gõ tìm kiếm chỉ vẽ lại danh sách: giữ bản đồ cũ
    if (homeMap) { homeMap.destroy(); homeMap = null; }
    if (!host) return;
    homeMapFor = state.view;
    homeMap = new TerrainMap(host, { dest: DEST.id, interactive: false, towns: false, onPin: function (id) { openInfo(id); } });
    homeMap.setInsets({ bottom: 26 }); homeMap.setMarkers(placeMarkers()); homeMap.fitTo(null, { animate: false, padding: 30 });
  }
  /** Mở bản đồ toàn màn có kéo, phóng, gộp cụm; chạm ghim mở chi tiết. */
  function openMapSheet() {
    panel.innerHTML = '<div class="mapfull"><div class="mapbig" id="mapbig"></div><button class="iconbtn close" type="button" data-act="closeSheet" aria-label="Đóng bản đồ">' + ic("x") + '</button><h2 class="sr">Bản đồ ' + esc(DEST.name) + "</h2></div>";
    showSheet(true);
    bigMap = new TerrainMap($("mapbig"), { dest: DEST.id, interactive: true, onPin: function (id) { closeSheet(); openInfo(id); } });
    bigMap.setMarkers(placeMarkers()); bigMap.fitTo(null, { animate: false, padding: 48 });
  }
  /** Tạo chuyến đi từ một lịch mẫu: ngày bắt đầu là thứ Bảy tới, mỗi nơi vào đúng ngày của lịch. */
  function createFromTemplate(tp) {
    var s = nextSat(), n = tp.days.length, ds = [], items = [], e = new Date(s);
    e.setUTCDate(e.getUTCDate() + n - 1);
    tp.days.forEach(function (arr, k) { var d = new Date(s); d.setUTCDate(d.getUTCDate() + k); ds.push(iso(d)); arr.forEach(function (id, j) { if (BY[id]) items.push({ id: uid(), placeId: id, day: ds[k], ord: j, addedBy: "Bạn", removal: null }); }); });
    var t = { id: uid(), name: uniqueName(tp.title), start: iso(s), end: iso(e), shared: false, tentative: false, styles: [], pace: null, budget: null, items: items };
    var done = function () { state.trips.push(t); state.role = "owner"; closeSheet(); go("trip", { tripId: t.id, dayTab: "ov" }); toast("Đã tạo «" + t.name + "» từ lịch mẫu. Bạn chỉnh được mọi thứ."); Motion.confetti(); };
    if (!state.identity) { startIdentity(done); return; }
    done();
  }
  /** Hàng "Nên đi tháng này": chỉ các nơi đang vào mùa đẹp theo kho biên tập (không bịa mùa). */
  function monthHtml() {
    var mp = monthPlaces().slice(0, UI.HOME.MONTH_LIMIT); if (!mp.length) return "";
    return '<section class="stack rv">' + secHead(UI.COPY.HOME_MONTH) + '<div class="monthrow">' + mp.map(function (p, i) {
      return '<button class="mcard cat-' + p.cat + '" type="button" data-info="' + p.id + '" style="--d:' + i * 70 + 'ms"><img alt="" src="' + p.photos[0].src + '"><span class="mc-badge">' + ic("calendar-event", "s") + esc(p.best) + '</span><span class="mc-in"><b>' + esc(p.name) + "</b><span>" + esc(p.area) + "</span></span></button>";
    }).join("") + "</div></section>";
  }
  /** Tường ảnh "Những nơi làm người ta muốn đi" (chỉ màn rộng). */
  function wallHtml() {
    var wall = UI.HOME.WALL.map(function (id) { return P(id); });
    return '<section class="stack rv">' + secHead("Những nơi làm người ta muốn đi") + '<div class="wall">' + wall.map(function (p, i) { return '<button class="wcell w' + i + ' cat-' + p.cat + '" type="button" data-info="' + p.id + '" style="--d:' + i * 60 + 'ms"><img alt="" src="' + p.photos[0].src + '" loading="lazy"><span class="wc-in"><span class="chip glass">' + ic(catOf(p).icon, "s") + esc(catOf(p).name) + "</span><b>" + esc(p.name) + "</b></span></button>"; }).join("") + "</div></section>";
  }
  function renderExplore() {
    if (wide()) { screen.innerHTML = heroWide() + '<div class="sections pad-x wsec" id="sec"></div>'; drawExplore(""); $("q").addEventListener("input", function (e) { drawExplore(e.target.value); }); return; }
    screen.innerHTML = homeHeroHtml() + '<label class="search">' + ic("compass") + '<input id="q" type="search" placeholder="Bạn muốn đi đâu? Thử Hà Giang" autocomplete="off" aria-label="Tìm điểm đến"></label>' + ribbonHtml() + '<div class="sections pad-x" id="sec"></div>';
    drawExplore(""); $("q").addEventListener("input", function (e) { drawExplore(e.target.value); });
  }
  function drawExplore(q) {
    var n = noAccent(q.trim());
    screen.classList.toggle("searching", !!n);   // đang tìm: thu nhỏ phần minh họa để kết quả hiện ngay trong màn hình
    var out = !state.identity && !n ? '<p><button class="linkbtn" type="button" data-go="recover">Đã có chuyến đi? Mở trên máy này</button></p>' : "", b = picked(), hit = !n || noAccent(DEST.name).indexOf(n) >= 0;
    if (!n && b.length) out += '<section class="stack"><h2 class="h2">Đang chọn dở</h2><button class="resume" type="button" data-go="picked"><img alt="" src="' + b[0].photos[0].src + '"><div><h3>' + b.length + ' địa điểm đã chọn</h3><p>' + esc(DEST.name) + ', chưa lưu thành chuyến đi</p></div><span class="chip tint cat-canh">Xem</span></button></section>';
    if (hit && !n) out += moodHtml() + templatesHtml() + monthHtml();
    if (hit && wide() && !n) out += wallHtml();
    if (hit && !n) out += mapCardHtml();
    if (hit) {
      out += '<section class="stack rv">' + secHead("Khám phá ngay") + '<button class="dcard" type="button" data-go="dest"><img alt="" src="' + coverSrc() + '"><span class="pill cta">Xem cẩm nang</span><div class="dcard-in"><h3>' + esc(DEST.name) + '</h3><div class="row"><span class="chip glass">' + ic("map-pin", "s") + PLACES.length + ' địa điểm</span><span class="chip glass">' + ic("calendar-event", "s") + "Đẹp nhất " + esc(monthRange(DEST.bestMonths).toLowerCase()) + "</span></div></div></button></section>";
      if (n) out += '<section class="stack rv">' + secHead("Nổi bật ở " + esc(DEST.name)) + '<div class="hscroll">' + UI.PLACE.HIGHLIGHTS.map(function (id) { var p = P(id); return '<button class="mini cat-' + p.cat + '" type="button" data-info="' + p.id + '"><img alt="" src="' + p.photos[0].src + '"><span class="catbadge">' + ic(catOf(p).icon) + '</span><span class="in"><h3>' + esc(p.name) + "</h3><p>" + esc(p.area) + "</p></span></button>"; }).join("") + "</div></section>";
    }
    var others = OTHERS.filter(function (o) { return !n || noAccent(o).indexOf(n) >= 0; });
    if (others.length) out += '<section class="stack"><h2 class="h2">Sắp ra mắt</h2><div class="soon">' + others.map(function (o) { return "<span>" + esc(o) + "</span>"; }).join("") + "</div></section>";
    if (!hit && !others.length) out = '<div class="empty" role="status"><span class="ib">' + ic("compass", "l") + '</span><h2 class="h2">Chưa có điểm đến nào khớp «' + esc(q.trim()) + '»</h2><p>Hiện có cẩm nang Hà Giang. Sa Pa, Hội An, Đà Lạt… đang chuẩn bị.</p><button class="btn ghost" type="button" data-act="clearSearch">Xóa tìm kiếm</button></div>';
    $("sec").innerHTML = out;
    mountHomeMap(); initReveal();
  }

  /* ---------- cẩm nang điểm đến (dùng ở trang điểm đến và tab Tổng quan) ---------- */
  var FOODS = [["soup", "Thắng cố", "Món hầm nhiều loại thịt, hay bán ở chợ phiên."], ["meat", "Thịt trâu gác bếp", "Thịt trâu hun khói, ăn kèm chẩm chéo."], ["wheat", "Mèn mén", "Món bột ngô hấp của người Mông."], ["bulb", "Mật ong bạc hà", "Mật ong từ hoa bạc hà vùng cao."]];
  var PACK = ["Áo gió / áo ấm", "Áo mưa", "Giày đế bám", "Thuốc say xe", "Sạc dự phòng", "Tiền mặt", "Giấy tờ và bằng lái"];
  function guideHtml(t, compact) {
    var mine = t ? Number(t.start.slice(5, 7)) : null, ms = "";
    for (var m = 1; m <= 12; m++) ms += '<i class="' + ((DEST.bestMonths || []).indexOf(m) >= 0 ? "best" : (DEST.rainyMonths || []).indexOf(m) >= 0 ? "rain" : "") + (m === mine ? " mine" : "") + '">' + m + "</i>";
    var tripLine = t ? '<p class="note"><b>Chuyến của bạn</b> (' + dm(t.start) + "–" + dm(t.end) + ") " + ((DEST.bestMonths || []).indexOf(mine) >= 0 ? "rơi vào mùa đẹp nhất." : "không nằm trong " + monthRange(DEST.bestMonths).toLowerCase() + ", hãy xem thêm dự báo trước khi đi.") + "</p>" : "";
    var B = [
      ["mua", "calendar-event", "cat-canh", "Mùa nên đi", monthRange(DEST.bestMonths) + " đẹp nhất: lúa chín, hoa tam giác mạch.",
        '<div class="months" aria-label="Tháng trong năm">' + ms + '</div><div class="leg"><span>Đẹp nhất (ô cam)</span><span class="r">Mưa nhiều (ô xanh nhạt)</span></div><p class="note">Tháng 9–10 lúa chín ở các ruộng bậc thang. Tháng 10–11 hoa tam giác mạch nở. Khoảng tháng 5–8 mưa nhiều, đường dễ trơn và sạt lở. Tháng 9 vẫn có thể mưa.</p>' + tripLine],
      ["chuanbi", "backpack", "cat-van", "Chuẩn bị mang gì", "Áo ấm, áo mưa, thuốc say xe, tiền mặt…",
        '<div class="packs">' + PACK.map(function (x, i) { return '<button class="pack" type="button" data-pack="' + i + '" aria-pressed="' + !!state.pack[i] + '">' + ic("check", "s") + esc(x) + "</button>"; }).join("") + '</div><p class="note">Bấm để đánh dấu đã chuẩn bị.</p>'],
      ["an", "tools-kitchen-2", "cat-am", "Ăn gì", "Thắng cố, thịt trâu gác bếp, mèn mén, mật ong bạc hà.",
        '<div class="foods">' + FOODS.map(function (f) { return '<div class="food">' + ic(f[0], "l") + "<b>" + f[1] + "</b><p>" + f[2] + "</p></div>"; }).join("") + "</div>"],
      ["thien", "trees", "cat-canh", "Thiên nhiên", "Đèo, sông, cao nguyên đá, ruộng bậc thang.",
        ["deo-ma-pi-leng", "song-nho-que", "cao-nguyen-da", "hoang-su-phi"].map(function (id) { var p = BY[id]; return '<button class="grow cat-' + p.cat + '" type="button" data-info="' + id + '"><span class="catbadge">' + ic(catOf(p).icon) + "</span><span><b>" + esc(p.name) + '</b><span class="d">' + esc(p.hook) + "</span></span>" + ic("chevron-down", "s") + "</button>"; }).join("")],
      ["dv", "bed", "cat-luu", "Dịch vụ và trải nghiệm", "Homestay, thuê xe máy, chợ phiên, thuyền Nho Quế.",
        [["bed", "Homestay", "Hay gặp ở Quản Bạ, Đồng Văn, Mèo Vạc."], ["motorbike", "Thuê xe máy", "Thường thuê ở TP Hà Giang."], ["users", "Tour và người dẫn đường", "Hợp với người không rành đường đèo."], ["route", "Thuyền trên sông Nho Quế", "Đi giữa hẻm vực Tu Sản."], ["building-store", "Chợ phiên Đồng Văn", "Họp vào sáng Chủ nhật."]].map(function (r) { return '<div class="grow cat-luu"><span class="ib">' + ic(r[0]) + "</span><span><b>" + r[1] + '</b><span class="d">' + r[2] + "</span></span><span></span></div>"; }).join("")],
      ["dichuyen", "motorbike", "cat-leo", "Di chuyển", "Xe máy hoặc ô tô thuê kèm tài xế.",
        [["motorbike", "Đi trong vùng", "Xe máy, hoặc ô tô thuê kèm tài xế."], ["alert-triangle", "Lưu ý", "Đường đèo hẹp, đổ xăng ở thị trấn trước khi lên đèo, sóng yếu ở một số đoạn."]].map(function (r) { return '<div class="grow cat-leo"><span class="ib">' + ic(r[0]) + "</span><span><b>" + r[1] + '</b><span class="d">' + r[2] + "</span></span><span></span></div>"; }).join("")]
    ];
    if (compact) B = B.slice(0, 3);
    return '<div class="guide">' + B.map(function (b) { var open = state.guide === b[0]; return '<div class="gblock ' + b[2] + (open ? " open" : "") + '"><button class="ghead" type="button" data-guide="' + b[0] + '" aria-expanded="' + open + '"><span class="ib">' + ic(b[1]) + "</span><span><b>" + b[3] + '</b><span class="sum">' + b[4] + '</span></span><span class="chev">' + ic("chevron-down") + '</span></button><div class="gbody">' + b[5] + "</div></div>"; }).join("") + '</div><p class="gfoot">Wander biên soạn, bản nháp. Hãy kiểm tra lại trước khi đi.</p>';
  }
  /** Ba số nhanh của điểm đến, đều tính từ kho biên tập: số nơi, mùa đẹp chung, số loại trải nghiệm. */
  function destFactsHtml() {
    var kinds = {}; PLACES.forEach(function (p) { kinds[p.cat] = 1; });
    var f = [["map-pin", String(PLACES.length), "địa điểm"], ["calendar-event", monthRange(DEST.bestMonths).replace("Tháng ", ""), "tháng đẹp nhất"], ["sparkles", String(Object.keys(kinds).length), "loại trải nghiệm"]];
    return '<ul class="dfacts" aria-label="Tóm tắt điểm đến">' + f.map(function (x) { return '<li><span class="ib">' + ic(x[0]) + "</span><b" + (/^\d+$/.test(x[1]) ? ' data-count="' + x[1] + '"' : "") + ">" + x[1] + "</b><span>" + x[2] + "</span></li>"; }).join("") + "</ul>";
  }
  /** Dải ảnh "Xem trước các nơi": nối phần ảnh bìa với nội dung bên dưới, chạm để xem chi tiết từng nơi. */
  function destPeekHtml() {
    return '<section class="stack rv"><h2 class="h2">' + UI.COPY.DEST_PEEK + '</h2><div class="hscroll peek">' + PLACES.map(function (p) {
      return '<button class="mini cat-' + p.cat + '" type="button" data-info="' + p.id + '"><img alt="" src="' + p.photos[0].src + '" loading="lazy"><span class="catbadge">' + ic(catOf(p).icon) + '</span><span class="in"><h3>' + esc(p.name) + "</h3><p>" + esc(p.area) + "</p></span></button>";
    }).join("") + "</div></section>";
  }
  function renderDest() {
    screen.classList.add("nobar");
    var focal = UI.FOCAL[DEST.coverPlaceId || UI.PLACE.COVER] || "50% 50%";
    screen.innerHTML = '<section class="dhero"><img alt="" src="' + coverSrc() + '" style="object-position:' + focal + '"><div class="top"><button class="iconbtn" type="button" data-go="explore" aria-label="Quay lại">' + ic("chevron-left") + '</button></div>' +
      '<div class="in"><p class="dhero-region">' + ic("map-pin", "s") + esc(DEST.region || "") + "</p><h1>" + esc(DEST.name) + '</h1><p class="dhero-tag">' + esc(DEST.tagline || "") + "</p></div></section>" +
      '<div class="dbody pad-x">' + destFactsHtml() + '<div class="dcta"><button class="btn" type="button" data-go="deck">' + ic("hand-finger") + 'Bắt đầu quẹt</button><button class="btn ghost" type="button" data-act="create">' + ic("plus") + "Tạo chuyến đi</button></div>" +
      mapCardHtml() + destPeekHtml() + '<h2 class="h2">Cẩm nang ' + esc(DEST.name) + "</h2>" + guideHtml(null, false) + "</div>";
    mountHomeMap(); initReveal();
  }

  /* ---------- thẻ ---------- */
  function credit(p, i) { var ph = p.photos[i]; return "Ảnh: " + esc((ph.artist || "Không rõ tác giả").slice(0, 28)) + " · " + esc(ph.license) + ' · <a href="' + ph.source + '" target="_blank" rel="noopener noreferrer">Xem ảnh gốc</a>'; }
  /** Thẻ quẹt toàn màn (v6, PO 26/10/2026): ảnh của địa điểm là nền; tên, thông tin và dấu THÍCH/BỎ QUA nổi đè lên ảnh. */
  function cardHtml(p, depth, o) {
    var i = state.photo[p.id] || 0, n = p.photos.length, segs = "", front = depth === 0, a = away(p);
    for (var k = 0; k < n; k++) segs += '<i class="' + (k <= i ? "on" : "") + '"></i>';
    return '<article class="card cat-' + p.cat + " " + (front ? "front" : "depth-" + depth) + '" data-id="' + p.id + '"' + (front ? ' aria-label="' + esc(p.name) + '. ' + o.aria + '"' : ' aria-hidden="true"') + ">" +
      '<img class="ph" alt="" src="' + p.photos[i].src + '"><div class="card-veil" aria-hidden="true"></div>' + (n > 1 ? '<div class="segs" aria-hidden="true">' + segs + "</div>" : "") + (o.banner || "") +
            '<span class="stamp r" aria-hidden="true">' + ic("check") + '</span><span class="stamp l" aria-hidden="true">' + ic("x") + "</span>" +
      '<div class="card-info"><div class="card-top"><span class="chip card-cat">' + ic(catOf(p).icon, "s") + catOf(p).name + "</span>" + (front ? '<button class="credit-btn" type="button" data-credit="card" aria-label="Nguồn ảnh">' + ic("info-circle") + "</button>" : "") + "</div><h2>" + esc(p.name) + '</h2><p class="card-area">' + ic("map-pin", "s") + esc(p.area) + "</p>" +
      '<ul class="card-facts"><li>' + ic("calendar-event", "s") + esc(p.best) + "</li><li>" + ic("clock", "s") + esc(p.dur) + "</li>" + (a ? "<li>" + ic("route", "s") + "Cách ~" + a + " km, ước tính</li>" : "") + "</ul>" +
      '<p class="hook">' + esc(p.hook) + "</p></div></article>";
  }
  function renderDeck() {
    screen.classList.add("immersive");
    var adding = !!state.addTripId, left = candidates(), t = adding ? trip(state.addTripId) : null, seen = PLACES.filter(function (p) { return state.decisions[p.id]; }).length;
    var usedCats = []; PLACES.forEach(function (p) { if (usedCats.indexOf(p.cat) < 0) usedCats.push(p.cat); });
    var head = '<div class="deckbar pad-x"><button class="iconbtn" type="button" data-go="' + (adding ? "trip" : "dest") + '" aria-label="Quay lại">' + ic("chevron-left") + '</button><div class="mid"><h1>' + esc(adding ? t.name : DEST.name) + '</h1><p class="note">' + (adding ? "Chọn thêm, địa điểm tự vào chuyến đi" : "Đã xem " + seen + "/" + PLACES.length) + '</p></div><button class="pill" type="button" data-go="' + (adding ? "trip" : "picked") + '">' + ic("check", "s") + (adding ? "Lưu" : "Xem đã chọn (" + picked().length + ")") + "</button></div>" +
      '<div class="filters pad-x" role="group" aria-label="Lọc theo loại"><button class="fchip" type="button" data-cat="all" aria-pressed="' + (state.cat === "all") + '">Tất cả</button>' + usedCats.map(function (c) { return '<button class="fchip cat-' + c + '" type="button" data-cat="' + c + '" aria-pressed="' + (state.cat === c) + '">' + ic(CATS[c].icon, "s") + CATS[c].name + "</button>"; }).join("") + "</div>";
    if (!left.length) {
      screen.innerHTML = head + '<div class="empty pad-x" style="color:var(--on-photo)"><h2 class="h2" style="color:var(--on-photo)">Hết thẻ rồi</h2><p>' + (adding ? "Mọi địa điểm đều đã có trong chuyến đi." : state.cat !== "all" ? "Hết thẻ ở loại này. Thử chọn loại khác." : "Bạn đã chọn " + picked().length + " địa điểm ở " + esc(DEST.name) + ".") + '</p><button class="btn" type="button" data-go="' + (adding ? "trip" : "picked") + '">' + (adding ? "Về chuyến đi" : "Xem đã chọn") + "</button>" + (adding ? "" : '<button class="btn ghost" type="button" data-act="undo">Hoàn tác thẻ cuối</button><button class="btn ghost" type="button" data-act="restart">Xem lại các thẻ đã bỏ qua</button>') + "</div>";
      return;
    }
    var o = { aria: "Quẹt phải để chọn, quẹt trái để bỏ qua. Chạm cạnh trái hoặc phải để đổi ảnh.", rLabel: "THÍCH", lLabel: "BỎ QUA" };
    screen.style.setProperty("--stage", "url('" + left[0].photos[state.photo[left[0].id] || 0].src + "')");
    screen.innerHTML = head + '<div class="deckwrap"><div class="deck">' + left.slice(0, 3).map(function (p, i) { return cardHtml(p, i, o); }).reverse().join("") + "</div>" +
      '<div class="actions"><div class="act"><button class="round small" type="button" data-act="undo" aria-label="Hoàn tác"' + (state.history.length && !adding ? "" : " disabled") + ">" + ic("arrow-back-up") + "</button>Hoàn tác</div>" +
      '<div class="act"><button class="round l" type="button" data-act="skip" aria-label="Bỏ qua">' + ic("x") + "</button>Bỏ qua</div>" +
      '<div class="act"><button class="round r" type="button" data-act="like" aria-label="Chọn nơi này">' + ic("check") + "</button>Chọn</div>" +
      '<div class="act"><button class="round small" type="button" data-act="info" aria-label="Xem chi tiết">' + ic("chevron-up") + "</button>Chi tiết</div></div></div>";
    attachDrag(screen.querySelector(".card.front"), function (id, dir) { decide(id, dir); });
  }
  function fling(card, dir, done) {
    if (card.dataset.gone) return; card.dataset.gone = "1"; var sg = dir === "r" ? 1 : -1;
    if (reduce()) { done(); return; }
    card.style.transition = "transform .32s ease-out, opacity .32s"; card.style.transform = "translate(" + sg * 560 + "px,-30px) rotate(" + sg * 28 + "deg)"; card.style.opacity = "0"; if (card.parentElement) card.parentElement.style.setProperty("--p", "1"); setTimeout(done, 300);
  }
  function pid(card) { return card.dataset.place || card.dataset.id; }
  function shiftPhoto(card, delta) {
    var p = BY[pid(card)], i = state.photo[p.id] || 0, j = Math.max(0, Math.min(p.photos.length - 1, i + delta)); if (j === i) return;
    state.photo[p.id] = j; save(); card.querySelector(".ph").src = p.photos[j].src; if (state.view === "deck") screen.style.setProperty("--stage", "url('" + p.photos[j].src + "')"); card.querySelectorAll(".segs i").forEach(function (s, k) { s.classList.toggle("on", k <= j); });
    var pl = card.querySelector(".credit-pill"); if (pl) pl.remove();
  }
  function attachDrag(card, onDecide, opts) {
    if (!card) return; opts = opts || {};
    var sx = 0, sy = 0, dx = 0, dy = 0, down = false, moved = false, t0 = 0, rs = card.querySelector(".stamp.r"), ls = card.querySelector(".stamp.l"), deckEl = card.parentElement;
    function paint() { card.style.transform = "translate(" + dx + "px," + dy * .3 + "px) rotate(" + dx / 18 + "deg)"; rs.style.opacity = Math.max(0, Math.min(1, dx / 90)); ls.style.opacity = Math.max(0, Math.min(1, -dx / 90)); if (deckEl) deckEl.style.setProperty("--p", String(Math.min(1, Math.abs(dx) / 130))); }
    card.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".more, .credit-btn, .credit-pill")) return;
      down = true; moved = false; dx = dy = 0; sx = e.clientX; sy = e.clientY; t0 = performance.now(); card.style.transition = "none"; try { card.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
    });
    card.addEventListener("pointermove", function (e) { if (!down) return; dx = e.clientX - sx; dy = e.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 8) moved = true; paint(); });
    function end(e) {
      if (!down) return; down = false; var v = dx / Math.max(1, performance.now() - t0);
      if (Math.abs(dx) > 110 || (Math.abs(v) > .6 && Math.abs(dx) > 40)) { var dir = dx > 0 ? "r" : "l"; fling(card, dir, function () { onDecide(card.dataset.id, dir); }); return; }
      card.style.transition = "transform .28s cubic-bezier(.2,.8,.2,1)"; card.style.transform = ""; rs.style.opacity = 0; ls.style.opacity = 0; if (deckEl) deckEl.style.setProperty("--p", "0");
      if (!moved && e.type === "pointerup") {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, multi = card.querySelectorAll(".segs i").length;
        if (multi && x < .3) shiftPhoto(card, -1); else if (multi && x > .7) shiftPhoto(card, 1); else if (!opts.noTap) openInfo(pid(card));
      }
    }
    card.addEventListener("pointerup", end); card.addEventListener("pointercancel", end);
  }
  function swipeTop(dir, cb) { var c = screen.querySelector(".card.front"); if (c) fling(c, dir, function () { cb(c.dataset.id, dir); }); }

  /* ---------- đã chọn ---------- */
  function renderPicked() {
    var b = picked();
    var head = '<div class="pagehead pad-x"><p class="note">' + esc(DEST.name) + '</p><h1>Địa điểm đã chọn</h1><p class="note">Những nơi bạn đã quẹt phải, chưa lưu thành chuyến đi.</p></div>';
    if (!b.length) { screen.innerHTML = head + '<div class="empty pad-x"><h2 class="h2">Chưa chọn nơi nào</h2><p>Quẹt phải những nơi bạn muốn đến, chúng sẽ nằm ở đây.</p><button class="btn" type="button" data-go="dest">Bắt đầu khám phá</button></div>'; return; }
    screen.innerHTML = head + '<div class="pad-x"><div class="mapcard mapcard-s" id="mapcard"></div></div><div class="grid pad-x">' + b.map(function (p) { return '<div class="tile cat-' + p.cat + '"><button class="tilebtn" type="button" data-info="' + p.id + '" aria-label="Xem ' + esc(p.name) + '"><img alt="" src="' + p.photos[0].src + '"><span class="in"><h3>' + esc(p.name) + "</h3><p>" + esc(p.area) + '</p></span></button><span class="catbadge">' + ic(catOf(p).icon) + '</span><button class="x" type="button" data-unpick="' + p.id + '" aria-label="Bỏ chọn ' + esc(p.name) + '">' + ic("x", "s") + "</button></div>"; }).join("") +
      '</div><div class="stickybar pad-x"><button class="btn block" type="button" data-act="create">' + ic("calendar-event") + "Lưu " + b.length + " địa điểm thành chuyến đi</button></div>";
    mountPickedMap(b);
  }
  /** Bản đồ nhỏ các nơi đã chọn (tĩnh, chạm ghim xem chi tiết). */
  function mountPickedMap(b) {
    if (homeMap) { homeMap.destroy(); homeMap = null; }
    var host = $("mapcard"); if (!host) return;
    homeMapFor = "picked";
    homeMap = new TerrainMap(host, { dest: DEST.id, interactive: false, towns: false, onPin: function (id) { openInfo(id); } });
    homeMap.setMarkers(b.filter(function (p) { return p.lat != null; }).map(function (p, i) { return { id: p.id, lat: p.lat, lon: p.lon, label: p.name, thumb: p.photos[0].src, num: i + 1 }; })); homeMap.setInsets({ bottom: 26 }); homeMap.fitTo(null, { animate: false, padding: 34 });
  }

  /* ---------- "Hôm nay" khi đang đi (DG-2 A5, DR-012 Q1): KHUNG. Chỉ đọc từ dữ liệu chuyến đã có; "hôm nay" theo ngày của thiết bị (Tầng B), giả lập được để xem các trạng thái; bản đồ là liên kết ra app ngoài ---------- */
  function realToday() { return iso(todayU()); }
  function todayOf() { return (state.todayBy || {})[state.tripId] || realToday(); }
  function renderToday() {
    var t = trip(state.tripId); if (!t) { go("trips"); return; }
    var td = todayOf(), ds = days(t), k = ds.indexOf(td), its = k >= 0 ? dayItems(t, td) : [], sim = (state.todayBy || {})[t.id] || null;
    var head = '<div class="pagehead pad-x"><div><button class="iconbtn" type="button" data-go="trip" aria-label="Quay lại chuyến đi">' + ic("chevron-left") + '</button></div><p class="note">' + esc(t.name) + "</p><h1>Hôm nay</h1><p class=\"note\">" + fullDate(td) + (sim ? " · ngày giả lập" : "") + "</p></div>";
    var simbar = '<div class="simbar pad-x" style="margin:0 16px 12px">BẢN THỬ · Giả lập ngày<div class="chips" role="group" aria-label="Giả lập ngày hôm nay" style="margin-top:8px"><button class="fchip" type="button" data-act="todaySim:" aria-pressed="' + !sim + '">Ngày thật</button>' + ds.slice(0, 3).map(function (d, i) { return '<button class="fchip" type="button" data-act="todaySim:' + d + '" aria-pressed="' + (sim === d) + '">Ngày ' + (i + 1) + "</button>"; }).join("") + '<button class="fchip" type="button" data-act="todaySim:before" aria-pressed="' + (sim === "before") + '">Trước chuyến</button><button class="fchip" type="button" data-act="todaySim:after" aria-pressed="' + (sim === "after") + '">Sau chuyến</button></div></div>';
    var body = "";
    if (t.tentative) body = '<div class="empty pad-x"><h2 class="h2">Chuyến này chưa chắc ngày</h2><p>"Hôm nay" cần ngày đi chắc chắn. Chốt ngày ở phần sửa chuyến đi.</p><button class="btn" type="button" data-go="trip">Về chuyến đi</button></div>';
    else if (k < 0) {
      var before = td < t.start, gap = Math.round(Math.abs((new Date(before ? t.start : t.end) - new Date(td)) / 864e5));
      body = '<div class="empty pad-x"><h2 class="h2">' + (before ? "Chưa tới ngày đi" : "Chuyến đi đã kết thúc") + "</h2><p>" + (before ? "Còn " + gap + " ngày nữa là tới " + dm(t.start) + "." : "Chuyến đi kết thúc từ " + dm(t.end) + ".") + '</p><button class="btn" type="button" data-go="trip">Xem cả chuyến đi</button></div>';
    } else {
      var cs = 0, unk = 0; its.forEach(function (i) { if (i.included) return; if (i.cost == null) { if (costApplies(i)) unk++; return; } cs += i.cost; });
      var tasks = its.filter(function (i) { return typeOf(i) === "task"; }), doneN = tasks.filter(function (i) { return i.done && i.done[me()]; }).length;
      var stat = '<div class="stats"><div class="stat cat-van"><b>Ngày ' + (k + 1) + "/" + ds.length + '</b><span>của chuyến</span></div><div class="stat cat-canh"><b>' + its.length + '</b><span>mục hôm nay</span></div><div class="stat cat-am"><b>' + vnd(cs) + "</b><span>" + (unk ? unk + " mục chưa biết giá" : "đã biết giá") + "</span></div></div>";
      var list = its.length ? its.map(function (i) {
        var p = placeOf(i), ty = typeOf(i), kd = TYPES[ty], isTask = ty === "task", dn = isTask && i.done && i.done[me()];
        var map = p && p.lat != null ? '<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=' + p.lat + "," + p.lon + '" aria-label="Mở «' + esc(itemName(i)) + '» trong app bản đồ (liên kết ra ngoài)">' + ic("route") + "Mở bản đồ</a>" : "";
        return '<div class="trow ' + (p ? "cat-" + p.cat : kd.cls) + '"><span class="tm">' + esc(i.time || "—") + '</span><div class="tx"><h3>' + esc(itemName(i)) + '</h3><p class="note">' + (p ? esc(catOf(p).name + " · " + p.area) : esc(kd.label)) + '</p><div class="acts">' +
          (isTask ? '<button class="btn ghost" type="button" data-act="task:' + i.id + '" aria-pressed="' + !!dn + '">' + ic("check") + (dn ? "Đã xong" : "Đánh dấu xong") + "</button>" : "") + map + "</div></div></div>";
      }).join("") : '<div class="emptyday">Hôm nay chưa có mục nào. Thêm địa điểm hoặc nghỉ ngơi.</div>';
      body = '<div class="pad-x">' + stat + (tasks.length ? '<p class="note" style="margin:8px 0">Việc cần làm: ' + doneN + "/" + tasks.length + " xong</p>" : "") + '<div class="tlist">' + list + '</div><p class="note" style="margin-top:12px">Chi phí chỉ cộng các mục đã nhập giá. "Mở bản đồ" mở app bản đồ ngoài trong tab mới.</p><button class="btn ghost block" type="button" data-go="trip">Xem cả chuyến đi</button></div>';
    }
    screen.innerHTML = head + simbar + body;
  }
  function todaySim(v) {
    var t = trip(state.tripId), ds = t ? days(t) : [];
    state.todayBy = state.todayBy || {}; state.todayBy[state.tripId] = v === "" ? null : v === "before" ? iso(new Date(new Date(ds[0]).getTime() - 5 * 864e5)) : v === "after" ? iso(new Date(new Date(ds[ds.length - 1]).getTime() + 3 * 864e5)) : v;
    save(); render();
  }

  /* ---------- Cài đặt/Giới thiệu (S21), hết phiên (S19), lỗi theo mã (S20): DG-2 A6/A7, KHUNG. TTL phiên chưa chốt (Tầng A); chính sách riêng tư chỉ là bản nháp ---------- */
  var ERRS = {
    RATE_LIMITED: ["Bạn thao tác hơi nhanh", "Chờ một lúc rồi thử lại. Dữ liệu của bạn không mất.", "retry"],
    NOT_FOUND: ["Không tìm thấy", "Mục này có thể đã bị xóa, hoặc chuyến đi không còn ở máy này.", "trips"],
    INTERNAL: ["Có lỗi ở phía Wander", "Việc bạn vừa làm có thể chưa được lưu. Thử lại sau ít phút.", "retry"],
    STEP_UP_REQUIRED: ["Cần xác thực lại", "Thao tác này cần bạn xác nhận lại bằng thiết bị tin cậy hoặc mã khôi phục.", "security"],
    BODY_TOO_LARGE: ["Dữ liệu gửi đi quá lớn", "Rút gọn nội dung, ví dụ ghi chú, rồi thử lại.", "retry"]
  };
  function showError(code) {
    var e = ERRS[code]; if (!e) return;
    panel.innerHTML = '<div class="pp"><div role="alert"><h2 style="font-size:26px">' + esc(e[0]) + '</h2><p class="note" style="margin-top:6px">' + esc(e[1]) + '</p><p class="note">Mã lỗi: <code>' + esc(code) + '</code></p></div><div class="stack">' +
      (e[2] === "security" ? '<button class="btn block" type="button" data-act="errGo:security">Mở Bảo mật</button>' : e[2] === "trips" ? '<button class="btn block" type="button" data-act="errGo:trips">Về Chuyến đi</button>' : '<button class="btn block" type="button" data-act="closeSheet">Đã hiểu, thử lại sau</button>') +
      '<button class="btn ghost block" type="button" data-act="closeSheet">Đóng</button></div></div>';
    showSheet();
  }
  function renderSettings() {
    var idn = state.identity, cur = idn ? idn.devices.filter(function (d) { return d.current; })[0] : null;
    var h = '<div class="pagehead pad-x"><div><button class="iconbtn" type="button" data-go="trips" aria-label="Quay lại">' + ic("chevron-left") + '</button></div><p class="note">Wander</p><h1>Cài đặt và giới thiệu</h1></div><div class="stack pad-x" style="gap:16px">';
    h += '<section class="seccard"><h2 class="h2">Thiết bị này</h2>' + (cur ? '<label class="field">Tên thiết bị<input id="st-dev" maxlength="40" value="' + esc(cur.name) + '"></label><p class="note">Tên giúp bạn nhận ra máy này khi duyệt hoặc thu hồi thiết bị.</p><button class="btn ghost" type="button" data-act="saveDevName">Lưu tên</button>' : '<p class="note">Chưa có danh tính. Danh tính ẩn danh được tạo khi bạn lưu chuyến đi đầu tiên.</p>') + '<button class="btn ghost block" type="button" data-go="security">' + ic("shield") + "Bảo mật và mã khôi phục</button></section>";
    h += '<section class="seccard"><h2 class="h2">Giao diện</h2><p class="note">Mặc định là sáng. Chọn tối hoặc theo hệ thống nếu bạn muốn.</p><div class="chips" role="group" aria-label="Giao diện">' + [["light", "Sáng"], ["dark", "Tối"], ["system", "Theo hệ thống"]].map(function (o) { return '<button class="fchip" type="button" data-act="theme:' + o[0] + '" aria-pressed="' + ((state.theme || "light") === o[0]) + '">' + o[1] + "</button>"; }).join("") + "</div></section>";
    h += '<section class="seccard"><h2 class="h2">Về Wander</h2><p class="note">Ảnh lấy từ Wikimedia Commons theo giấy phép Creative Commons. Mô tả lấy từ Wikipedia tiếng Việt (CC BY-SA 4.0). Khoảng cách và thời gian đi là ước tính. Nhãn gợi ý, mùa đẹp, buổi nên đi và mẹo là bản nháp biên tập của Wander. Biểu tượng: Tabler Icons (MIT).</p><button class="btn ghost block" type="button" data-act="replayIntro">' + ic("sparkles") + "Xem lại giới thiệu</button></section>";
    h += '<section class="seccard"><h2 class="h2">Quyền riêng tư</h2><p class="note">Wander không hỏi email hay số điện thoại. Chuyến đi gắn với danh tính ẩn danh của bạn.</p><p class="note"><em>Bản nháp, chưa phải chính sách pháp lý; cần duyệt trước khi ra mắt thật.</em></p></section>';
    h += '<section class="seccard"><h2 class="h2">Chuyến đi tạo nhầm</h2><p class="note">Phiên bản này chưa có xóa cả chuyến đi. Bạn có thể xóa từng mục và khôi phục ở "Đã xóa gần đây".</p></section>';
    h += '<section class="seccard"><span class="pill warn" style="display:inline-block;margin-bottom:8px">BẢN THỬ</span><h2 class="h2">Giả lập</h2><button class="btn ghost block" type="button" data-act="simExpire">Giả lập: hết phiên</button><p class="note" style="margin-top:12px">Giả lập thông báo lỗi theo mã:</p><div class="chips" role="group" aria-label="Giả lập lỗi theo mã">' + Object.keys(ERRS).map(function (c) { return '<button class="fchip" type="button" data-act="simErr:' + c + '">' + c + "</button>"; }).join("") + "</div></section></div>";
    screen.innerHTML = h;
  }
  function renderExpired() {
    var idn = state.identity, hasProof = !!(idn && (idn.code || idn.devices.length > 1)), br = state.expiredBranch || (hasProof ? "A" : "B");
    var h = '<div class="pagehead pad-x"><p class="note">Wander</p><h1>Phiên của bạn đã hết hạn</h1></div><div class="stack pad-x" style="gap:16px"><p>Khi làm thật, chữ bạn đang gõ sẽ được giữ tạm trên máy này. Bản thử chưa giữ.</p>';
    h += '<div class="chips" role="group" aria-label="Giả lập tình huống"><span class="note" style="align-self:center">BẢN THỬ:</span><button class="fchip" type="button" data-act="expBranch:A" aria-pressed="' + (br === "A") + '">Đã có mã khôi phục</button><button class="fchip" type="button" data-act="expBranch:B" aria-pressed="' + (br === "B") + '">Đã bỏ qua mã</button></div>';
    if (br === "A") h += '<section class="seccard"><h2 class="h2">Mở lại chuyến đi</h2><p class="note">Dùng mã khôi phục của bạn, hoặc nhờ một thiết bị tin cậy khác duyệt máy này.</p><button class="btn block" type="button" data-go="recover">Mở trên máy này</button></section>';
    else h += '<div class="warnbox" role="alert"><b>BẢN THỬ, chờ PO quyết (phiên có được hết hạn khi chưa có mã không?).</b> <b>Không khôi phục được chuyến đi này.</b> Bạn đã bỏ qua mã khôi phục và chưa có thiết bị tin cậy nào khác. Wander không khôi phục giúp được (không email, không số điện thoại). Chuyến đi cũ sẽ không mở lại được.</div><section class="seccard"><h2 class="h2">Bắt đầu lại</h2><p class="note">Danh tính mới được tạo khi bạn lưu chuyến đi đầu tiên. Lần này hãy lưu mã khôi phục.</p><button class="btn block" type="button" data-go="explore">Về Khám phá</button></section>';
    h += '<p class="note">Thời hạn phiên chưa được chốt, nên màn này chưa nói con số.</p><button class="btn ghost block" type="button" data-go="settings">Quay lại Cài đặt</button></div>';
    screen.innerHTML = h;
  }

  /* ---------- Xuất / chia sẻ (S18, DG-2 A8): KHUNG xem trước bằng dữ liệu chuyến thật; CHƯA tạo tệp; liên kết chỉ-đọc thuộc 1b (Q6–Q9 còn mở) ---------- */
  var EXPORTS = ["Ảnh", "PDF", "Lịch"];
  function renderExport() {
    var t = trip(state.tripId); if (!t) { go("trips"); return; }
    var kind = state.exportKind || "Ảnh", tent = !!t.tentative, ds = days(t), un = t.items.filter(function (i) { return !i.day && !(i.removal && i.removal.status === "pending"); }), body = "";
    var line = function (i) { var p = placeOf(i); return { time: i.time || "", name: itemName(i), where: p ? p.area : (TYPES[typeOf(i)].label) }; };
    if (tent && kind === "Lịch") body = '<div class="empty"><h2 class="h2">Chưa thể thêm vào lịch</h2><p>Chuyến này chưa chắc ngày. Hãy chốt ngày đi rồi thêm vào lịch, để không tạo sự kiện cho ngày chưa chắc.</p></div>';
    else if (kind === "Ảnh") {
      body = '<div class="xcard"><p class="xlogo">Wander</p><h2>' + esc(t.name) + '</h2><p class="note">' + dateRange(t) + " · " + ds.length + " ngày · " + placeCount(t) + " địa điểm</p>" + ds.map(function (d, k) {
        var its = dayItems(t, d); return '<div class="xday" style="--tc:' + dayColor(k) + '"><h3><b>Ngày ' + (k + 1) + "</b> " + dayName(d) + "</h3>" + (its.length ? "<ul>" + its.map(function (i) { var l = line(i); return "<li><span>" + esc(l.time || "—") + "</span><div><b>" + esc(l.name) + "</b><small>" + esc(l.where) + "</small></div></li>"; }).join("") + "</ul>" : '<p class="note">Chưa có mục.</p>') + "</div>";
      }).join("") + (un.length ? '<p class="note">' + un.length + " mục chưa có ngày không có trong ảnh.</p>" : "") + '<p class="xfoot">Làm bằng Wander · bản xem trước</p></div>';
    } else if (kind === "PDF") {
      var cs = costSummary(t);
      body = '<div class="xpaper"><h2>' + esc(t.name) + '</h2><p class="note">' + dateRange(t) + '</p><table><thead><tr><th scope="col">Ngày</th><th scope="col">Giờ</th><th scope="col">Mục</th><th scope="col">Chi phí</th></tr></thead><tbody>' + ds.map(function (d, k) {
        return dayItems(t, d).map(function (i, j) { var l = line(i); return "<tr><td>" + (j ? "" : "Ngày " + (k + 1) + " · " + dm(d)) + "</td><td>" + esc(l.time || "—") + "</td><td>" + esc(l.name) + "</td><td>" + (i.included ? "Đã bao gồm" : i.cost != null ? esc(vnd(i.cost)) : costApplies(i) ? "Chưa biết giá" : "") + "</td></tr>"; }).join("");
      }).join("") + "</tbody></table><p><b>Tổng phải trả thêm (đã biết giá):</b> " + esc(vnd(cs.total)) + (cs.unknown ? " · " + cs.unknown + " mục chưa biết giá" : "") + '</p><p class="note">Số liệu chỉ là ước tính từ dữ liệu bạn nhập.</p></div>';
    } else {
      body = '<ul class="xcal">' + ds.map(function (d, k) { return dayItems(t, d).map(function (i) { var l = line(i); return "<li><span>" + dm(d) + " · " + esc(l.time || "Cả ngày") + "</span><b>" + esc(l.name) + "</b><small>" + (i.dur != null ? i.dur + " phút · " : "") + esc(l.where) + "</small></li>"; }).join(""); }).join("") + '</ul><p class="note">Giờ theo múi giờ của thiết bị. Mục không có giờ thành sự kiện cả ngày.</p>';
    }
    screen.innerHTML = '<div class="pagehead pad-x"><div><button class="iconbtn" type="button" data-go="trip" aria-label="Quay lại chuyến đi">' + ic("chevron-left") + '</button></div><p class="note">' + esc(t.name) + '</p><h1>Lưu hoặc gửi lịch trình</h1><p class="note">Bản chỉ để xem, không cần mời ai.</p></div><div class="stack pad-x" style="gap:14px">' + (tent ? '<div class="warnbox" role="status">Chuyến này chưa chắc ngày: các ngày dưới đây chỉ là dự kiến.</div>' : "") + '<div class="chips" role="group" aria-label="Kiểu xuất">' +
      EXPORTS.map(function (k) { return '<button class="fchip" type="button" data-export-kind="' + k + '" aria-pressed="' + (kind === k) + '">' + (k === "Lịch" ? "Thêm vào lịch" : k) + "</button>"; }).join("") + "</div>" + body +
      '<div class="warnbox" role="status"><b>BẢN THỬ:</b> đây là bản xem trước từ dữ liệu chuyến đi. Wander chưa tạo tệp ' + (kind === "Lịch" ? ".ics" : kind === "PDF" ? "PDF" : "ảnh") + ' ở bước thiết kế này. Liên kết chỉ-đọc thuộc phần nhóm (1b), chưa quyết.</div><button class="btn block" type="button" disabled aria-describedby="xwhy">Tạo tệp (chưa làm)</button><p id="xwhy" class="note">Nút này bật khi phần tạo tệp được duyệt và làm.</p></div>';
  }

  /* ---------- tạo chuyến theo bước (DG-2 A3, DR-012 Q8): KHUNG. "Ai đi" = kiểu chuyến đi (không phải danh sách thành viên, Q6–Q9 của 1b còn mở); "ngày linh hoạt" dùng lại "Dự kiến N ngày", KHÔNG quyết A3; chưa quyết schema ---------- */
  var KINDS = ["Một mình", "Gia đình", "Bạn bè", "Cặp đôi", "Công việc"];
  var WZ_STEPS = ["Đi đâu", "Khi nào", "Ai đi", "Sở thích", "Ngân sách", "Xem lại"];
  var wz = null;
  function openWizard() {
    var s = nextSat(), e = new Date(s); e.setUTCDate(e.getUTCDate() + 2);
    wz = { step: 0, start: iso(s), end: iso(e), tent: false, n: "3", kind: null, interests: [], budget: "", name: uniqueName(DEST.name) };
    drawWizard("");
  }
  function wzRead() {
    var g = function (id) { var el = $(id); return el ? el.value : null; }, v;
    if (wz.step === 1) { v = g("w-start"); if (v != null) wz.start = v; v = g("w-end"); if (v != null) wz.end = v; if ($("w-tent")) wz.tent = $("w-tent").checked; v = g("w-n"); if (v != null) wz.n = v.trim(); }
    if (wz.step === 4) { v = g("s-budget"); if (v != null) wz.budget = v.trim(); }
    if (wz.step === 5) { v = g("w-name"); if (v != null) wz.name = v; }
  }
  function wzError() {
    if (wz.step === 1) {
      if (!wz.start) return "Hãy chọn ngày đi.";
      if (wz.tent) return /^\d+$/.test(wz.n) && Number(wz.n) >= 1 && Number(wz.n) <= 366 ? "" : "Số ngày dự kiến từ 1 đến 366.";
      if (!wz.end || wz.end < wz.start) return "Ngày về phải sau hoặc bằng ngày đi.";
      if (Math.round((new Date(wz.end) - new Date(wz.start)) / 864e5) + 1 > 366) return "Chuyến đi tối đa 366 ngày.";
    }
    if (wz.step === 4 && wz.budget && (!/^\d{1,10}$/.test(wz.budget) || Number(wz.budget) > 1000000000)) return "Ngân sách chỉ nhập số nguyên từ 0 đến 1.000.000.000, đơn vị nghìn đồng.";
    if (wz.step === 5 && !wz.name.trim()) return "Hãy đặt tên chuyến đi.";
    return "";
  }
  function drawWizard(err) {
    var n = wz.step, last = n === WZ_STEPS.length - 1, body = "";
    if (n === 0) body = '<div class="opt on" role="radio" aria-checked="true" tabindex="0"><span class="rd"></span><div><strong>' + esc(DEST.name) + '</strong><p class="note">Điểm đến đã có cẩm nang và địa điểm thật.</p></div></div><p class="note">Sắp ra mắt: ' + OTHERS.map(esc).join(", ") + ".</p>";
    else if (n === 1) body = '<div class="two"><label class="field">Ngày đi<input id="w-start" type="date" value="' + esc(wz.start) + '"><small class="hint"></small></label><label class="field"' + (wz.tent ? " hidden" : "") + '>Ngày về<input id="w-end" type="date" value="' + esc(wz.end) + '"><small class="hint"></small></label></div>' +
      '<label class="checkrow" style="grid-template-columns:28px 1fr"><input id="w-tent" type="checkbox"' + (wz.tent ? " checked" : "") + '><span>Chưa chắc ngày, chỉ dự kiến</span></label><label class="field" id="w-n-wrap"' + (wz.tent ? "" : " hidden") + '>Dự kiến số ngày (1–366)<input id="w-n" inputmode="numeric" value="' + esc(wz.n) + '"></label>';
    else if (n === 2) body = '<p class="note">Chọn kiểu chuyến đi. Đây chưa phải danh sách người đi cùng.</p><div class="chips" role="group" aria-label="Kiểu chuyến đi">' + KINDS.map(function (k) { return '<button class="fchip" type="button" data-wz-kind="' + k + '" aria-pressed="' + (wz.kind === k) + '">' + k + "</button>"; }).join("") + "</div>";
    else if (n === 3) body = '<p class="note">Bạn thích loại địa điểm nào? Chọn nhiều được, bỏ trống cũng được.</p><div class="chips" role="group" aria-label="Sở thích">' + Object.keys(CATS).map(function (k) { return '<button class="fchip" type="button" data-wz-int="' + k + '" aria-pressed="' + (wz.interests.indexOf(k) >= 0) + '">' + ic(CATS[k].icon, "s") + CATS[k].name + "</button>"; }).join("") + "</div>";
    else if (n === 4) body = '<label class="field">Ngân sách, nghìn đồng (tùy chọn)<input id="s-budget" inputmode="numeric" placeholder="Ví dụ 3000" value="' + esc(wz.budget) + '"><small class="hint"></small></label>';
    else body = '<ul class="wzsum"><li><b>Điểm đến</b> ' + esc(DEST.name) + "</li><li><b>Ngày</b> " + (wz.tent ? "dự kiến " + esc(wz.n) + " ngày, từ " + dm(wz.start) : dm(wz.start) + " – " + dm(wz.end)) + "</li><li><b>Kiểu chuyến đi</b> " + esc(wz.kind || "chưa chọn") + "</li><li><b>Sở thích</b> " + (wz.interests.length ? wz.interests.map(function (k) { return CATS[k].name; }).join(", ") : "chưa chọn") + "</li><li><b>Ngân sách</b> " + (wz.budget ? vnd(Number(wz.budget)) : "chưa đặt") + '</li></ul><label class="field">Tên chuyến đi<input id="w-name" maxlength="120" value="' + esc(wz.name) + '"></label>';
    panel.innerHTML = '<div class="pp"><div><span class="pill warn" style="display:inline-block;margin-bottom:8px">BẢN THỬ · khung, chưa chốt dữ liệu</span><div class="obar" role="progressbar" aria-valuemin="1" aria-valuemax="' + WZ_STEPS.length + '" aria-valuenow="' + (n + 1) + '" aria-label="Bước ' + (n + 1) + " trên " + WZ_STEPS.length + '"><i style="width:' + Math.round(((n + 1) / WZ_STEPS.length) * 100) + '%"></i></div><p class="note" style="margin-top:8px">Bước ' + (n + 1) + "/" + WZ_STEPS.length + '</p><h2 id="wz-h" tabindex="-1">' + WZ_STEPS[n] + "</h2></div>" + body +
      '<div id="w-err">' + (err ? '<div class="warnbox" role="alert">' + esc(err) + "</div>" : "") + '</div><div class="stack"><button class="btn block" type="button" data-act="wzNext">' + (last ? "Tạo chuyến đi" : "Tiếp") + "</button>" + (n > 0 ? '<button class="btn ghost block" type="button" data-act="wzBack">Quay lại</button>' : "") + '<button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>';
    var lf0 = sheet.hidden ? null : lastFocus; showSheet(); if (lf0) lastFocus = lf0;   // vẽ lại từng bước không làm mất nút để trả focus
    hintDates(panel); hintMoney(panel);
    var h = $("wz-h"); if (h && n > 0) h.focus();
  }
  function wzCreate() {
    var st = wz.start, en = wz.tent ? iso(new Date(new Date(st).getTime() + (Number(wz.n) - 1) * 864e5)) : wz.end, name = wz.name.trim();
    var t = { id: uid(), name: state.trips.some(function (x) { return x.name === name; }) ? uniqueName(name) : name, start: st, end: en, shared: false, tentative: wz.tent, kind: wz.kind, interests: wz.interests.slice(),
      styles: [], pace: null, budget: wz.budget ? Number(wz.budget) : null, items: [] };
    if (!state.identity) { var made = t; startIdentity(function () { state.trips.push(made); finishCreate(made, []); }); return; }
    state.trips.push(t); finishCreate(t, []);
  }

  /* ---------- tạo chuyến đi ---------- */
  function openCreate() {
    var b = picked(), s = nextSat(), e = new Date(s); e.setUTCDate(e.getUTCDate() + 2);
    saveMode = b.length ? "new" : "new"; pickStyles = []; pickPace = null; createCtx = { n: b.length };
    var fields = '<label class="field">Tên chuyến đi<input id="s-name" maxlength="120" value="' + esc(uniqueName(DEST.name)) + '"></label><div class="two"><label class="field">Ngày đi<input id="s-start" type="date" value="' + iso(s) + '"><small class="hint"></small></label><label class="field">Ngày về<input id="s-end" type="date" value="' + iso(e) + '"><small class="hint"></small></label></div>' +
      '<label class="checkrow" style="grid-template-columns:28px 1fr"><input id="s-tent" type="checkbox"><span>Chưa chắc ngày, chỉ dự kiến</span></label><label class="field" id="s-n-wrap" hidden>Dự kiến số ngày (1–366)<input id="s-n" inputmode="numeric" value="3"></label>' +
      '<div class="optgroup"><span>Phong cách (tùy chọn, tối đa 5)</span><div class="chips">' + STYLES.map(function (x) { return '<button class="fchip" type="button" data-style="' + x + '" aria-pressed="false">' + x + "</button>"; }).join("") + '</div></div>' +
      '<div class="optgroup"><span>Nhịp đi (tùy chọn)</span><div class="chips">' + PACES.map(function (x) { return '<button class="fchip" type="button" data-pace="' + x + '" aria-pressed="false">' + x + "</button>"; }).join("") + '</div></div>' +
      '<label class="field">Ngân sách, nghìn đồng (tùy chọn)<input id="s-budget" inputmode="numeric" placeholder="Ví dụ 3000"><small class="hint"></small></label>';
    if (!b.length) { panel.innerHTML = '<div class="pp"><div><h2>Tạo chuyến đi</h2><p class="note" style="margin-top:6px">Chuyến đi mới ở ' + esc(DEST.name) + ". Bạn thêm địa điểm sau.</p></div>" + fields + '<div class="stack"><button class="btn block" type="button" data-act="doCreate">Tạo chuyến đi</button><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>'; showSheet(); return; }
    panel.innerHTML = '<div class="pp"><div><h2>Lưu ' + b.length + ' địa điểm thành chuyến đi?</h2><p class="note" style="margin-top:6px">Các nơi đã chọn sẽ nằm ở mục "Chưa có ngày", bạn xếp vào từng ngày sau.</p></div>' +
      '<div class="opt on" data-mode="new" role="radio" aria-checked="true" tabindex="0"><span class="rd"></span><div><strong>Tạo chuyến đi mới</strong><div class="more-f">' + fields + "</div></div></div>" +
      '<div class="opt" data-mode="add" role="radio" aria-checked="false" tabindex="0"><span class="rd"></span><div><strong>Thêm vào chuyến đi có sẵn</strong><div class="more-f"><label class="field">Chọn chuyến đi<select id="s-trip">' + state.trips.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + "</option>"; }).join("") + "</select></label></div></div></div>" +
      '<div class="opt" data-mode="keep" role="radio" aria-checked="false" tabindex="0"><span class="rd"></span><div><strong>Để lại trong danh sách đã chọn</strong><p class="note">Chưa lưu. Danh sách vẫn còn khi bạn quay lại.</p></div></div>' +
      '<div class="stack"><button class="btn block" type="button" data-act="doCreate">Xác nhận</button><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>';
    showSheet();
  }
  function doCreate() {
    var b = picked(), t;
    if (b.length && saveMode === "keep") { closeSheet(); toast("Giữ trong danh sách đã chọn."); return; }
    if (b.length && saveMode === "add") {
      t = trip($("s-trip").value); if (!t) return;
      b.forEach(function (p) { if (!t.items.some(function (i) { return i.placeId === p.id; })) t.items.push({ id: uid(), placeId: p.id, day: null, addedBy: "Bạn", removal: null }); });
    } else {
      var name = $("s-name").value.trim() || DEST.name, st = $("s-start").value, en = $("s-end").value, bud = $("s-budget").value.trim();
      var tent = !!($("s-tent") && $("s-tent").checked);
      if (tent) {
        var nn = $("s-n").value.trim();
        if (!st) { toast("Hãy chọn ngày đi dự kiến."); return; }
        if (!/^\d+$/.test(nn) || Number(nn) < 1 || Number(nn) > 366) { toast("Số ngày dự kiến từ 1 đến 366."); return; }
        en = iso(new Date(new Date(st).getTime() + (Number(nn) - 1) * 864e5));
      }
      if (!st || !en || en < st) { toast("Ngày về phải sau hoặc bằng ngày đi."); return; }
      if (Math.round((new Date(en) - new Date(st)) / 864e5) + 1 > 366) { toast("Chuyến đi tối đa 366 ngày."); return; }
      if (bud && (!/^\d{1,10}$/.test(bud) || Number(bud) > 1000000000)) { toast("Ngân sách chỉ nhập số nguyên từ 0 đến 1.000.000.000, đơn vị nghìn đồng."); return; }
      t = { id: uid(), name: state.trips.some(function (x) { return x.name === name; }) ? uniqueName(name) : name, start: st, end: en, shared: false, tentative: tent, styles: pickStyles.slice(), pace: pickPace, budget: bud ? Number(bud) : null,
        items: b.map(function (p) { return { id: uid(), placeId: p.id, day: null, addedBy: "Bạn", removal: null }; }) };
      if (!state.identity) { var made = t; startIdentity(function () { state.trips.push(made); finishCreate(made, b); }); return; }   // F2: lưu lần đầu → tạo danh tính ẩn danh
      state.trips.push(t);
    }
    finishCreate(t, b);
  }
  function finishCreate(t, b) {
    b.forEach(function (p) { delete state.decisions[p.id]; }); state.history = []; state.role = "owner";
    closeSheet(); go("trip", { tripId: t.id, dayTab: "ov" }); toast("Đã lưu vào «" + t.name + "»");
  }

  /* ---------- chuyến đi: danh sách ---------- */
  function renderTrips() {
    var head = '<div class="pagehead pad-x"><div class="headrow"><div><p class="note">Của bạn</p><h1>Chuyến đi</h1></div><span class="hdract"><button class="iconbtn" type="button" data-go="settings" aria-label="Cài đặt và giới thiệu">' + ic("info-circle") + '</button><button class="iconbtn" type="button" data-go="security" aria-label="Bảo mật và thiết bị' + (state.identity && state.identity.unseen ? ", có hoạt động mới" : "") + '">' + ic("shield") + (state.identity && state.identity.unseen ? '<span class="udot" aria-hidden="true"></span>' : "") + '</button></span></div></div>';
    var list = state.trips.length ? '<div class="stack pad-x" style="gap:20px">' + state.trips.map(function (t) {
      var np = pendingOf(t).length, first = tripCover(t);
      return '<button class="tcard" type="button" data-trip="' + t.id + '"><div class="cov"><img alt="" src="' + first + '"></div><div class="b"><h3>' + esc(t.name) + '</h3><div class="meta"><span>' + ic("calendar-event", "s") + " " + dateRange(t) + "</span><span>" + countText(t) + '</span><span class="avatars">' + members(t).map(avatar).join("") + "</span>" + (np ? '<span class="chip warn">' + ic("clock", "s") + np + " đề nghị xóa</span>" : "") + "</div></div></button>";
    }).join("") + '<button class="btn ghost block" type="button" data-act="create">' + ic("plus") + "Tạo chuyến đi mới</button>" + '<button class="btn ghost block" type="button" data-act="wizard">' + ic("route") + "Tạo từng bước (bản thử)</button></div>" : '<div class="empty pad-x"><h2 class="h2">Chưa có chuyến đi</h2><p>Chọn vài địa điểm rồi lưu thành chuyến đi.</p><button class="btn" type="button" data-go="explore">Đi khám phá</button></div>';
    var nocode = state.identity && !state.identity.code && state.trips.length ? '<div class="pad-x"><button class="nocode" type="button" data-go="security">' + ic("info-circle", "s") + "<span>" + esc(UI.COPY.NO_CODE_BAR) + "</span></button></div>" : "";
    screen.innerHTML = head + nocode + list;
  }

  /* ---------- chuyến đi: chi tiết ---------- */
  /* ---------- bản đồ địa hình ở màn chuyến đi (TerrainMap, app/map.js) + tờ kéo (BottomSheet, app/sheet.js) ---------- */
  var tripMap = null, tripMapTrip = null, tripSheet = null, tripFitIds = null, tripSheetReady = false;
  /** Ghim của một chuyến: tổng quan = mọi mục có tọa độ (chưa có ngày thì mờ); tab ngày = mục của ngày đó đánh số, mục khác mờ. */
  function tripMarkers(t, tab, ds) {
    var dayIds = tab === "ov" ? null : dayItems(t, ds[Number(tab) - 1]).map(function (i) { return i.id; }), out = [];
    t.items.forEach(function (it) {
      var p = placeOf(it); if (!p || p.lat == null) return;
      var inDay = !!dayIds && dayIds.indexOf(it.id) >= 0;
      out.push({ id: it.id, lat: p.lat, lon: p.lon, label: p.name, thumb: p.photos[0].src, num: inDay ? dayIds.indexOf(it.id) + 1 : null, muted: tab === "ov" ? !it.day : !inDay });
    });
    return out;
  }
  /** Dựng (hoặc dùng lại) bản đồ của chuyến; đổi tab chỉ bay camera, không dựng lại. */
  function mountTripMap(t, tab, ds) {
    var host = $("tmap"); if (!host) return;
    if (tripMap && tripMapTrip === t.id) host.replaceWith(tripMap.host);
    else { if (tripMap) tripMap.destroy(); tripMapTrip = t.id; tripSheetReady = false; tripMap = new TerrainMap(host, { dest: DEST.id, onPin: function (id) { var tr = trip(state.tripId), it = tr && findItem(tr, id); if (it && it.placeId) openInfo(it.placeId, it.id); } }); }
    var mk = tripMarkers(t, tab, ds), dayIt = tab === "ov" ? [] : dayItems(t, ds[Number(tab) - 1]).filter(function (i) { return placeOf(i) && placeOf(i).lat != null; });
    tripMap.setMode(tab === "ov" ? "browse" : "route"); tripMap.setMarkers(mk);
    if (dayIt.length > 1) tripMap.setRoute(dayIt.map(function (i) { return i.id; }), dayIt.slice(1).map(function (i, k) { var d = km(placeOf(dayIt[k]), placeOf(i)); return d == null ? "" : "~" + Math.round(d) + " km"; })); else tripMap.setRoute(null);
    tripFitIds = tab === "ov" ? null : dayIt.map(function (i) { return i.id; });
  }
  /** Gắn tờ kéo vào màn chuyến đi (chỉ dưới 1280 px; từ 1280 px là cột phải cố định). */
  function mountTripSheet() {
    var el = screen.querySelector(".sheetbody"), head = screen.querySelector(".sheet-head");
    if (tripSheet) { tripSheet.destroy(); tripSheet = null; }
    if (!el || !head || drawerOK()) { if (tripMap) { tripMap.setInsets({}); tripMap.fitTo(tripFitIds, { animate: false }); } return; }
    tripSheet = new BottomSheet(el, head, { initial: state.sheetSnap || "half", onChange: function (snap, vis) {
      state.sheetSnap = snap; save();
      if (tripMap) { tripMap.setInsets({ bottom: vis, top: 56 }); tripMap.fitTo(tripFitIds, { animate: tripSheetReady }); }
    } });
    tripSheetReady = true;
  }
  function chipNew(i) { return i.addedBy && i.addedBy !== "Bạn" && !i.removal ? '<span class="chipnew">' + esc(i.addedBy) + " vừa thêm</span>" : ""; }
  /* ---------- mục trong chuyến (T6): 9 loại mục D13, chi phí D17/D18, đặt chỗ A-14/DR-003; xóa mềm và xác thực lại (T7) ---------- */
  var TYPES = {
    sightseeing: { label: "Tham quan", icon: "map-pin", cls: "cat-canh" },
    food: { label: "Ăn uống", icon: "tools-kitchen-2", cls: "cat-am" },
    transport: { label: "Di chuyển", icon: "route", cls: "cat-leo" },
    lodging: { label: "Lưu trú", icon: "bed", cls: "cat-luu" },
    car_rental: { label: "Thuê xe", icon: "motorbike", cls: "cat-leo" },
    shopping: { label: "Mua sắm", icon: "building-store", cls: "cat-cho" },
    tour: { label: "Tour/Combo", icon: "users", cls: "cat-van" },
    rest: { label: "Nghỉ", icon: "moon-stars", cls: "cat-luu", plain: true },
    task: { label: "Việc cần làm", icon: "list-check", cls: "cat-canh", plain: true }
  };
  var TYPE_ORDER = ["sightseeing", "food", "transport", "lodging", "car_rental", "shopping", "tour", "rest", "task"];
  var PLACE_TYPE = { canh: "sightseeing", van: "sightseeing", leo: "sightseeing", am: "food", luu: "lodging", cho: "shopping" };
  var BOOK = { pending: "Chờ xác nhận", booked: "Đã đặt" };
  var MAX_K = 1000000000, MAX_DUR = 7 * 24 * 60, MAX_TITLE = 200, MAX_NOTE = 2000, DAY_MS = 864e5;
  function placeOf(i) { return i.placeId ? BY[i.placeId] : null; }
  function typeOf(i) { var p = placeOf(i); return p ? (PLACE_TYPE[p.cat] || "sightseeing") : (TYPES[i.type] ? i.type : "sightseeing"); }
  function plainType(t) { return !!TYPES[t].plain; }   // Nghỉ và Việc cần làm: không giá, không đặt chỗ (ItemType.isPriced / supportsBooking)
  function costApplies(i) { return !plainType(typeOf(i)); }
  function itemName(i) { var p = placeOf(i); return p ? p.name : (i.title || TYPES[typeOf(i)].label); }
  function mb() { return state.memberName || "Bình"; }
  function me() { return state.role === "owner" ? "Bạn" : mb(); }
  /* tiền: nhập bằng nghìn đồng, hiển thị đầy đủ VND có dấu chấm và khoảng trắng không ngắt trước ₫ (D17) */
  function vnd(k) { var s = String(Math.round(k * 1000)), o = "", n; for (n = 0; n < s.length; n++) { if (n && (s.length - n) % 3 === 0) o += "."; o += s.charAt(n); } return o + " ₫"; }
  function tripCover(t) { for (var q = 0; q < t.items.length; q++) { var p = placeOf(t.items[q]); if (p) return p.photos[0].src; } return coverSrc(); }
  function placeCount(t) { return t.items.filter(placeOf).length; }
  function countText(t) { var n = placeCount(t), o = t.items.length - n; return n + " địa điểm" + (o ? " · " + o + " mục khác" : ""); }
  function roadOf(its) { var s = 0, last = null; its.forEach(function (i) { var p = placeOf(i); if (!p) return; if (last) s += km(last, p) || 0; last = p; }); return s; }
  function costSummary(t) {
    var r = { total: 0, unknown: 0, included: 0, booked: 0, bookable: 0, byType: {}, byDay: {}, unkDay: {} };
    t.items.forEach(function (i) {
      var ty = typeOf(i);
      if (!plainType(ty)) { r.bookable++; if (i.booking === "booked") r.booked++; }
      if (i.included) { r.included++; return; }
      if (i.cost == null) { if (costApplies(i)) { r.unknown++; if (i.day) r.unkDay[i.day] = (r.unkDay[i.day] || 0) + 1; } return; }
      r.total += i.cost; r.byType[ty] = (r.byType[ty] || 0) + i.cost; if (i.day) r.byDay[i.day] = (r.byDay[i.day] || 0) + i.cost;
    });
    return r;
  }
  function metaChips(i) {
    var m = "", dur = i.dur != null ? i.dur + " phút" : "";
    if (i.time || dur) m += '<span class="mchip">' + ic("clock", "s") + esc((i.time || "") + (i.time && dur ? " · " : "") + dur) + "</span>";
    if (costApplies(i)) {
      if (i.included) m += '<span class="mchip">' + ic("check", "s") + "Đã bao gồm" + (i.ref != null ? ", tham khảo " + vnd(i.ref) : "") + "</span>";
      else if (i.cost != null) m += '<span class="mchip money">' + ic("coin", "s") + vnd(i.cost) + "</span>";
      else m += '<span class="mchip unk">' + ic("coin", "s") + "Chưa biết giá</span>";
      if (i.booking === "booked") m += '<span class="mchip cat-canh tint">' + ic("ticket", "s") + "Đã đặt</span>";
    }
    if (i.type === "task") { var ms = members(trip(state.tripId)), dn = ms.filter(function (n) { return i.done && i.done[n]; }).length; if (ms.length > 1) m += '<span class="mchip">' + ic("users", "s") + "Xong " + dn + "/" + ms.length + " người</span>"; }
    return m ? '<div class="mrow">' + m + "</div>" : "";
  }
  function costHtml(t) {
    var cs = costSummary(t), bud = t.budget, h = '<section class="daysec costbox"><div class="dayhead"><h2>Chi phí</h2><span class="s">tính từ số bạn nhập</span></div>';
    h += '<div class="bigmoney"><b>' + vnd(cs.total) + "</b><span>tổng phải trả thêm</span></div>";
    if (cs.unknown) h += '<p class="note">' + ic("coin", "s") + " Chưa tính " + cs.unknown + " mục chưa biết giá.</p>";
    if (cs.included) h += '<p class="note">' + ic("check", "s") + " " + cs.included + " mục đã bao gồm, không cộng vào tổng.</p>";
    if (bud != null) {
      var left = bud - cs.total, pct = bud ? Math.min(100, Math.round(cs.total / bud * 100)) : 100;
      h += '<div class="prog' + (left < 0 ? " over" : "") + '" role="progressbar" aria-label="Đã tính so với ngân sách" aria-valuemin="0" aria-valuenow="' + pct + '" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
        '<p class="' + (left < 0 ? "overnote" : "note") + '">' + (left < 0 ? ic("alert-triangle", "s") + " Vượt ngân sách " + vnd(-left) : "Ngân sách " + vnd(bud) + ", còn lại " + vnd(left)) + (cs.unknown ? " (chưa tính mục chưa biết giá)" : "") + "</p>";
    }
    var keys = TYPE_ORDER.filter(function (k) { return cs.byType[k] > 0; });
    if (keys.length) h += '<div class="chips">' + keys.map(function (k) { return '<span class="chip tint ' + TYPES[k].cls + '">' + esc(TYPES[k].label) + ": " + vnd(cs.byType[k]) + "</span>"; }).join("") + "</div>";
    if (cs.bookable) h += '<p class="note">' + ic("ticket", "s") + " Đã đặt " + cs.booked + "/" + cs.bookable + " mục có đặt chỗ.</p>";
    if (t.demo) h += '<p class="note">Chuyến mẫu: mọi số tiền chỉ để minh họa, không phải giá thật.</p>';
    return h + "</section>";
  }
  function itemRow(i, owner, num, dayIdx, unassigned, ds, srt) {
    var p = placeOf(i), ty = typeOf(i), kd = TYPES[ty], pend = i.removal && i.removal.status === "pending", rej = i.removal && i.removal.status === "rejected", c = p ? catOf(p) : null;
    var mineOwn = owner || i.addedBy === mb();
    var bgl = pend ? (owner ? "Đồng ý xóa" : "") : (mineOwn ? "Xóa" : "Đề nghị xóa"), bgr = pend ? (owner ? "Giữ lại" : "") : "Chọn ngày";
    var done = ty === "task" && i.done && i.done[me()], nm = itemName(i);
    var tile = p ? '<div class="im"><img alt="" src="' + p.photos[0].src + '">' + (num ? "<b>" + num + "</b>" : "") + "</div>" : '<div class="im ktile">' + ic(kd.icon, "l") + (num ? "<b>" + num + "</b>" : "") + "</div>";
    var kindLine = pend ? '<span class="flag">' + ic("clock", "s") + esc(i.removal.by) + " đề nghị xóa</span>" : p ? '<span class="kind">' + ic(c.icon, "s") + c.name + " · " + esc(p.area) + "</span>" : '<span class="kind">' + ic(kd.icon, "s") + kd.label + "</span>";
    var snip = p ? (rej ? "Người tạo đã giữ lại nơi này. " + p.hook : p.hook) : (i.note || "");
    var h = '<div class="swipe' + (srt ? " sorting" : "") + '" data-item="' + i.id + '"><div class="swbg" aria-hidden="true"><span>' + bgr + "</span><span>" + bgl + "</span></div>" +
      '<button class="irow ' + (p ? "cat-" + p.cat : kd.cls) + (pend ? " pending" : "") + (done ? " done" : "") + '" type="button" data-item-open="' + i.id + '" style="--tc:' + (dayIdx != null ? dayColor(dayIdx) : "var(--muted)") + '">' + tile + '<div class="tx">' + kindLine + "<h3>" + esc(nm) + "</h3>" + (snip ? '<p class="snip">' + esc(snip) + "</p>" : "") + metaChips(i) + chipNew(i) + "</div></button>";
    if (ty === "task" && !pend) h += '<button class="taskchk" type="button" data-act="task:' + i.id + '" aria-pressed="' + !!done + '" aria-label="' + (done ? "Bỏ đánh dấu xong: " : "Đánh dấu đã xong: ") + esc(nm) + '">' + ic("check") + "</button>";
    if (srt) h += '<div class="mv"><button class="iconbtn" type="button" data-act="move:' + i.id + ':up"' + (srt.first ? " disabled" : "") + ' aria-label="Chuyển «' + esc(nm) + '» lên">' + ic("arrow-up") + '</button><button class="iconbtn" type="button" data-act="move:' + i.id + ':down"' + (srt.last ? " disabled" : "") + ' aria-label="Chuyển «' + esc(nm) + '» xuống">' + ic("arrow-down") + "</button></div>";
    h += "</div>";
    if (unassigned && ds) h += '<div class="assign"><span>Chọn ngày:</span>' + ds.map(function (d, k) { return '<button class="dchip" type="button" data-assign="' + i.id + ":" + (k + 1) + '" style="--tc:' + dayColor(k) + '">Ngày ' + (k + 1) + "</button>"; }).join("") + "</div>";
    return h;
  }
  function renderTrip() {
    var t = trip(state.tripId); if (!t) { go("trips"); return; }
    var owner = state.role === "owner", ds = days(t), pend = pendingOf(t), un = t.items.filter(function (i) { return !i.day; }), tab = state.dayTab;
    if (tab !== "ov" && Number(tab) > ds.length) tab = state.dayTab = "ov";
    var first = tripCover(t), assigned = t.items.length - un.length, cs = costSummary(t);
    var h = '<section class="mapbox"><div class="tmap" id="tmap"></div><div class="top"><button class="iconbtn" type="button" data-go="trips" aria-label="Quay lại">' + ic("chevron-left") + '</button><div class="r">' + (owner ? '<button class="iconbtn" type="button" data-act="editTrip" aria-label="Sửa chuyến đi">' + ic("pencil") + "</button>" : "") + '<button class="iconbtn" type="button" data-act="shareSheet" aria-label="Mời người đi cùng">' + ic("share-2") + "</button></div></div></section>";
    h += '<section class="sheetbody"><div class="sheet-head pad-x"><button class="grab" type="button" aria-label="Danh sách chuyến đi: bấm hoặc kéo để mở rộng, thu gọn" aria-expanded="true"></button><div class="thead"><img alt="" src="' + first + '"><div><h1>' + esc(t.name) + '</h1><p class="note">' + dateRange(t) + " · " + countText(t) + '</p></div><span class="avatars">' + members(t).map(avatar).join("") + "</span></div>";
    h += '<div class="dtabs" role="tablist"><button class="dtab" role="tab" type="button" data-dtab="ov" aria-selected="' + (tab === "ov") + '">Tổng quan</button>' + ds.map(function (d, k) { return '<button class="dtab" role="tab" type="button" data-dtab="' + (k + 1) + '" style="--tc:' + dayColor(k) + '" aria-selected="' + (tab === String(k + 1)) + '">Ngày ' + (k + 1) + "</button>"; }).join("") + "</div>";
    h += '</div><div class="sheet-scroll"><div class="pad-x"><div class="tbody">';
    if (tab === "ov") {
      var totalKm = 0; ds.forEach(function (d) { totalKm += roadOf(dayItems(t, d)); });
      h += '<button class="btn ghost block" type="button" data-go="today" style="margin-bottom:12px">' + ic("sun") + "Hôm nay (bản thử)</button>";
      if (un.length && owner) h += '<div class="next"><span class="ib">' + ic("wand", "l") + '</span><div><h3>' + un.length + ' mục chưa có ngày</h3><p class="note">Để Wander gợi ý nhóm các nơi gần nhau vào cùng một ngày, rồi bạn chỉnh lại.</p><button class="btn" type="button" data-act="autoPlan">' + ic("sparkles") + "Xếp giúp tôi</button></div></div>";
      else if (!t.items.length) h += '<div class="next"><span class="ib">' + ic("plus", "l") + '</span><div><h3>Chưa có địa điểm nào</h3><p class="note">Thêm địa điểm từ bộ thẻ để bắt đầu lên lịch.</p><button class="btn" type="button" data-act="addMore">' + ic("hand-finger") + "Thêm địa điểm</button></div></div>";
      else if (!un.length) h += '<div class="next"><span class="ib">' + ic("users", "l") + '</span><div><h3>Mọi địa điểm đã có ngày</h3><p class="note">Mời người đi cùng để cả nhóm cùng thêm địa điểm.</p><button class="btn" type="button" data-act="shareSheet">' + ic("share-2") + "Mời người đi cùng</button></div></div>";
      h += '<div class="stats"><div class="stat cat-canh"><b data-count="' + placeCount(t) + '">' + placeCount(t) + "</b><span>địa điểm</span></div>" + '<div class="stat cat-van"><b data-count="' + ds.length + '">' + ds.length + '</b><span>ngày</span></div><div class="stat cat-leo"><b data-count="' + Math.round(totalKm) + '" data-prefix="~">~' + Math.round(totalKm) + "</b><span>km · ước tính</span></div></div>";
      if (ds.length > 1) h += '<div class="dayroutes"><h2 class="h3">Tuyến theo ngày <small>ước tính, mục tự do không có tọa độ nên không tính</small></h2><div class="chips" role="group" aria-label="Chọn ngày để xem tuyến">' + ds.map(function (d1, k1) { var rd = roadOf(dayItems(t, d1)); return '<button class="dchip" type="button" data-route-day="' + (k1 + 1) + '" style="--tc:' + dayColor(k1) + '">Ngày ' + (k1 + 1) + (rd > 0 ? " · ~" + Math.round(rd) + " km" : " · chưa có tuyến") + "</button>"; }).join("") + "</div></div>";
      if (t.styles && t.styles.length || t.kind || t.interests && t.interests.length || t.pace || t.budget != null) h += '<div class="chips">' + (t.kind ? '<span class="chip tint cat-luu">Kiểu: ' + esc(t.kind) + "</span>" : "") + (t.interests || []).map(function (k) { return '<span class="chip tint cat-' + k + '">' + esc(CATS[k].name) + "</span>"; }).join("") + (t.styles || []).map(function (x) { return '<span class="chip tint cat-van">' + esc(x) + "</span>"; }).join("") + (t.pace ? '<span class="chip tint cat-luu">Nhịp ' + esc(t.pace.toLowerCase()) + "</span>" : "") + (t.budget != null ? '<span class="chip tint cat-am">Ngân sách ' + vnd(t.budget) + "</span>" : "") + "</div>";
      if (owner && pend.length) h += '<div class="reqbar"><b>' + pend.length + " đề nghị xóa đang chờ bạn</b><p>Quẹt phải để giữ lại, quẹt trái để đồng ý xóa.</p></div>";
      h += costHtml(t);
      h += '<section class="daysec"><div class="dayhead"><h2>Chưa có ngày</h2><span class="s">Đã có ngày ' + assigned + "/" + t.items.length + '</span></div><div class="prog" role="progressbar" aria-label="Số mục đã có ngày" aria-valuemin="0" aria-valuenow="' + assigned + '" aria-valuemax="' + t.items.length + '"><i style="width:' + (t.items.length ? Math.round(assigned / t.items.length * 100) : 0) + '%"></i></div>' +
        (un.length ? un.map(function (i) { return itemRow(i, owner, 0, null, true, ds); }).join("") : '<div class="emptyday">' + (t.items.length ? "Mọi mục đã có ngày." : "Chưa có địa điểm nào.") + "</div>") +
        '<button class="btn ghost block" type="button" data-act="addItem">' + ic("plus") + "Thêm mục tự do, nghỉ hoặc việc cần làm</button></section>";
      h += '<section class="daysec"><button class="btn ghost block" type="button" data-go="trash">' + ic("trash") + "Đã xóa gần đây (" + (t.trash || []).length + ")</button></section>";
      h += '<section class="daysec"><div class="dayhead"><h2>Trước khi đi</h2></div>' + guideHtml(t, true) + "</section>";
      h += '<div class="simbar">Công cụ thử (BẢN THỬ 1b) · Xem với tư cách<span class="seg" role="group"><button type="button" data-role="owner" aria-pressed="' + owner + '">Người tạo</button><button type="button" data-role="member" aria-pressed="' + !owner + '">Thành viên (' + esc(mb()) + ')</button></span><button class="fchip" type="button" data-act="protoConflict">Giả lập: thiết bị khác vừa sửa</button></div>';
    } else {
      var k0 = Number(tab) - 1, d = ds[k0], its = dayItems(t, d), road = roadOf(its), dayCost = cs.byDay[d] || 0, dayUnk = cs.unkDay[d] || 0, sorting = !!state.sortMode && its.length > 1;
      h += '<section class="daysec" style="--tc:' + dayColor(k0) + '"><div class="dayhead"><h2><i></i>Ngày ' + tab + '</h2><span class="s">' + dayName(d) + (road > 0 ? "<br>~" + fmtT(hrs(road)) + " trên đường · ước tính" : "") + (dayCost || dayUnk ? "<br>" + vnd(dayCost) + (dayUnk ? " + " + dayUnk + " chưa biết giá" : "") : "") + "</span></div>";
      if (its.length > 1) h += '<div class="dayact"><button class="fchip" type="button" data-act="sortToggle" aria-pressed="' + sorting + '">' + ic("arrow-up", "s") + (sorting ? "Xong sắp xếp" : "Sắp xếp") + "</button></div>";
      if (!its.length) h += '<div class="emptyday">Ngày này chưa có mục nào.' + (un.length ? '<button class="btn" type="button" data-act="addToDay">' + ic("plus") + "Thêm từ mục chưa có ngày</button>" : "") + "</div>";
      its.forEach(function (i, k) {
        h += itemRow(i, owner, k + 1, k0, false, ds, sorting ? { first: k === 0, last: k === its.length - 1 } : null);
        var nx = its[k + 1], dist = nx && placeOf(i) && placeOf(nx) ? km(placeOf(i), placeOf(nx)) : null;
        if (dist != null) h += '<div class="travel">' + ic("motorbike", "s") + "<span>≈ " + fmtT(hrs(dist)) + " · " + Math.round(dist) + " km · ước tính</span></div>";
      });
      if (its.length && un.length) h += '<button class="btn ghost block" type="button" data-act="addToDay">' + ic("plus") + "Thêm từ mục chưa có ngày</button>";
      h += '<button class="btn ghost block" type="button" data-act="addItem">' + ic("plus") + "Thêm mục vào ngày này</button>";
      h += "</section>";
    }
    h += "</div></div></div></section>"; screen.innerHTML = h;
    mountTripMap(t, tab, ds); mountTripSheet();
    screen.querySelectorAll(".swipe").forEach(function (sw) { attachRowSwipe(sw, t, owner); });
    var fl = ""; if (owner && pend.length) fl += '<button class="pill warn" type="button" data-act="review">' + ic("clock", "s") + "Xem " + pend.length + " đề nghị</button>";
    fl += '<button class="pill" type="button" data-act="addMore">' + ic("plus", "s") + "Thêm địa điểm</button>"; floatEl.innerHTML = fl; floatEl.hidden = false;
  }
  function announce(msg) { var l = $("live"); if (l) { l.textContent = ""; setTimeout(function () { l.textContent = msg; }, 30); } }
  function moveItem(id, dir) {
    dropUndo(); var t = trip(state.tripId), it = findItem(t, id); if (!it || !it.day) return;
    var arr = dayItems(t, it.day); arr.forEach(function (x, q) { x.ord = q; });
    var q = arr.indexOf(it), r = dir === "up" ? q - 1 : q + 1; if (r < 0 || r >= arr.length) return;
    var o = arr[r], tmp = it.ord; it.ord = o.ord; o.ord = tmp; save(); render();
    var b = screen.querySelector('[data-act="move:' + id + ":" + dir + '"]'); if (!b || b.disabled) b = screen.querySelector('[data-act="move:' + id + ":" + (dir === "up" ? "down" : "up") + '"]');
    if (b) b.focus(); announce("«" + itemName(it) + "» ở vị trí " + (r + 1) + " trên " + arr.length);
  }
  function toggleTask(id) {
    dropUndo(); var t = trip(state.tripId), it = findItem(t, id); if (!it) return; it.done = it.done || {}; it.done[me()] = !it.done[me()]; save(); render();
    var b = screen.querySelector('[data-act="task:' + id + '"]'); if (b) b.focus(); announce(it.done[me()] ? "Đã đánh dấu xong «" + itemName(it) + "»" : "Bỏ đánh dấu «" + itemName(it) + "»");
  }
  function openConflict() {
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Chuyến đi đã thay đổi</h2><p class="note" style="margin-top:6px">Một thiết bị khác của bạn vừa sửa chuyến này, nên bản bạn đang xem đã cũ. Wander không ghi đè lên thay đổi đó.</p></div><div class="warnbox" role="alert">Tải lại để xem bản mới nhất, rồi làm lại thay đổi của bạn nếu cần.</div><div class="stack"><button class="btn block" type="button" data-act="conflictReload">Tải lại bản mới</button><button class="btn ghost block" type="button" data-act="closeSheet">Đóng, tôi sẽ xem sau</button></div></div>'; showSheet();
  }
  function openAddItem() {
    var k = state.dayTab === "ov" ? null : Number(state.dayTab) - 1, opt = function (act, icon, title, sub) { return '<button class="opt addopt" type="button" data-act="' + act + '"><span class="ib">' + ic(icon) + "</span><span><strong>" + title + '</strong><span class="note">' + sub + "</span></span></button>"; };
    panel.innerHTML = '<div class="pp"><div><h2>Thêm vào chuyến đi</h2><p class="note" style="margin-top:6px">' + (k != null ? "Mục mới sẽ vào Ngày " + (k + 1) + "." : "Mục mới nằm ở “Chưa có ngày” cho tới khi bạn xếp ngày.") + '</p></div><div class="stack">' +
      opt("addMore", "hand-finger", "Địa điểm từ " + esc(DEST.name), "Quẹt chọn thêm từ bộ thẻ") + opt("newItem:sightseeing", "pencil", "Mục tự do", "Quán ăn, chỗ ở, vé, di chuyển, mua sắm... chọn loại ở bước sau") + opt("newItem:rest", "moon-stars", "Nghỉ", "Một khoảng nghỉ trong ngày") + opt("newItem:task", "list-check", "Việc cần làm", "Ví dụ đổ xăng, mua vé, đặt phòng") +
      '</div><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div>';
    showSheet();
  }
  var itemDraft = null;
  function typeOptions(sel) { return TYPE_ORDER.map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + TYPES[k].label + "</option>"; }).join(""); }
  function openItemEditor(itemId, presetType) {
    var t = trip(state.tripId), it = itemId ? findItem(t, itemId) : null, ds = days(t), owner = state.role === "owner";
    var isPlace = !!(it && it.placeId), ty = it ? typeOf(it) : presetType, nm = it ? itemName(it) : "";
    var d = it || { title: "", day: state.dayTab === "ov" ? null : (ds[Number(state.dayTab) - 1] || null), time: "", dur: null, note: "", cost: null, included: false, ref: null, booking: null };
    itemDraft = { id: it ? it.id : null, place: isPlace, type: ty, booking: d.booking === "booked" ? "booked" : "pending" };
    var label = isPlace ? "Giờ, chi phí, đặt chỗ" : (it ? "Sửa mục" : "Thêm " + (ty === "rest" || ty === "task" ? TYPES[ty].label.toLowerCase() : "mục tự do"));
    var own = it && (owner || it.addedBy === mb()), plain = plainType(ty);
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">' + label + "</h2>" + (isPlace ? '<p class="note" style="margin-top:6px">' + esc(nm) + "</p>" : "") + "</div>" +
      (isPlace ? "" : '<label class="field">Tên<input id="i-title" maxlength="' + MAX_TITLE + '" value="' + esc(d.title || "") + '" placeholder="' + (ty === "rest" ? "Ví dụ Nghỉ trưa" : ty === "task" ? "Ví dụ Đổ xăng" : "Ví dụ Ăn trưa quán phở") + '"></label><label class="field">Loại<select id="i-type">' + typeOptions(ty) + "</select></label>") +
      '<label class="field">Ngày<select id="i-day"><option value="">Chưa có ngày</option>' + ds.map(function (x, q) { return '<option value="' + x + '"' + (d.day === x ? " selected" : "") + ">Ngày " + (q + 1) + " · " + dayName(x) + "</option>"; }).join("") + "</select></label>" +
      '<div class="two"><label class="field">Giờ (tùy chọn)<input id="i-time" type="time" value="' + esc(d.time || "") + '"></label><label class="field">Thời lượng, phút<input id="i-dur" inputmode="numeric" value="' + (d.dur == null ? "" : d.dur) + '" placeholder="Ví dụ 90"></label></div>' +
      '<label class="field">Ghi chú (tùy chọn)<textarea id="i-note" rows="3" maxlength="' + MAX_NOTE + '">' + esc(d.note || "") + "</textarea></label>" +
      '<div id="i-priced"' + (plain ? " hidden" : "") + '><label class="field">Chi phí, nghìn đồng (tùy chọn)<input id="i-cost" inputmode="numeric" value="' + (d.cost == null ? "" : d.cost) + '" placeholder="Để trống nếu chưa biết giá"><small class="hint"></small></label>' +
        '<label class="checkrow" style="grid-template-columns:28px 1fr"><input id="i-inc" type="checkbox"' + (d.included ? " checked" : "") + "><span>Đã bao gồm (nằm trong giá khác, không cộng vào tổng)</span></label>" +
        '<label class="field" id="i-ref-wrap"' + (d.included ? "" : " hidden") + '>Giá tham khảo, nghìn đồng (tùy chọn)<input id="i-ref" inputmode="numeric" value="' + (d.ref == null ? "" : d.ref) + '"><small class="hint"></small></label>' +
        '<div class="optgroup" id="i-booking"><span>Đặt chỗ</span><div class="chips" role="group" aria-label="Đặt chỗ">' + ["pending", "booked"].map(function (b) { return '<button class="fchip" type="button" data-act="book:' + b + '" aria-pressed="' + (itemDraft.booking === b) + '">' + BOOK[b] + "</button>"; }).join("") + "</div></div></div>" +
      (it && ty === "task" ? taskWho(it) : "") +
      '<div id="i-warn"></div><div class="stack"><button class="btn block" type="button" data-act="saveItem">Lưu</button>' +
      (it ? '<button class="btn ' + (own ? "danger" : "ghost") + ' block" type="button" data-resolve="' + (own ? "del" : "ask") + ":" + it.id + '">' + (own ? "Xóa mục này" : "Đề nghị xóa") + "</button>" : "") +
      '<button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>';
    showSheet(); hintMoney(panel);
  }
  function hintMoney(root) {
    root.querySelectorAll("#i-cost, #i-ref, #s-budget").forEach(function (inp) {
      var h = inp.parentNode.querySelector(".hint"), v = inp.value.trim(); if (!h) return;
      h.textContent = v === "" ? (inp.id === "i-cost" ? "Trống là chưa biết giá. Nhập 0 nếu biết là không mất tiền." : "") : /^\d{1,10}$/.test(v) && Number(v) <= MAX_K ? "= " + vnd(Number(v)) : "Chỉ nhập số nguyên từ 0 đến 1.000.000.000, đơn vị nghìn đồng.";
    });
  }
  function saveItem() {
    var t = trip(state.tripId), g = itemDraft, it = g.id ? findItem(t, g.id) : null, w = $("i-warn");
    var warn = function (m) { w.innerHTML = '<div class="warnbox" role="alert">' + m + "</div>"; };
    var title = $("i-title") ? $("i-title").value.trim() : null, ty = $("i-type") ? $("i-type").value : g.type;
    if (!g.place && !title) { warn("Hãy đặt tên cho mục này."); return; }
    var durS = $("i-dur").value.trim(), dur = null;
    if (durS) { if (!/^\d+$/.test(durS) || Number(durS) > MAX_DUR) { warn("Thời lượng từ 0 đến " + MAX_DUR + " phút (tối đa 7 ngày)."); return; } dur = Number(durS); }
    var plain = plainType(ty), inc = false, cost = null, ref = null;
    if (plain && it && (it.cost != null || it.included || it.ref != null || it.booking === "booked") && !g.okClear) { g.okClear = true; warn("Chuyển sang «" + TYPES[ty].label + "» sẽ xóa chi phí, giá tham khảo và trạng thái đặt chỗ của mục này. Bấm Lưu lần nữa để xác nhận."); return; }
    if (!plain) {
      var cv = $("i-cost").value.trim(), rv = $("i-ref").value.trim(); inc = $("i-inc").checked;
      if (cv) { if (!/^\d{1,10}$/.test(cv) || Number(cv) > MAX_K) { warn("Chi phí chỉ nhập số nguyên không âm tới 1.000.000.000, đơn vị nghìn đồng."); return; } cost = Number(cv); }
      if (inc && rv) { if (!/^\d{1,10}$/.test(rv) || Number(rv) > MAX_K) { warn("Giá tham khảo chỉ nhập số nguyên không âm tới 1.000.000.000, đơn vị nghìn đồng."); return; } ref = Number(rv); }   // bỏ tick "đã bao gồm" thì giá tham khảo bị xóa (R4)
    }
    var day = $("i-day").value || null, snap = snapshot(t);
    if (!it) { it = { id: uid(), placeId: null, addedBy: me(), removal: null, done: {}, ord: null, day: null }; t.items.push(it); }
    if (!g.place) { it.title = title; it.type = ty; }
    var others = day ? dayItems(t, day).filter(function (x) { return x !== it; }).length : null, moved = it.day !== day;
    it.time = $("i-time").value || null; it.dur = dur; it.note = $("i-note").value.trim(); it.day = day;
    it.cost = plain ? null : cost; it.included = plain ? false : inc; it.ref = plain ? null : ref; it.booking = plain ? null : (g.booking === "booked" ? "booked" : null);   // null = Chờ xác nhận (mặc định, DR-003)
    if (moved || it.ord == null) it.ord = others;
    closeSheet(); save(); render(); toast("Đã lưu «" + itemName(it) + "»", function () { restore(t, snap); save(); render(); });
  }
  function pseudoPlace(i) {
    var k = TYPES[typeOf(i)], col = "#b84c00";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="' + col + '"/></svg>';
    return { id: i.id, name: itemName(i), cat: k.cls.replace("cat-", ""), area: k.label, best: k.label, dur: i.dur != null ? i.dur + " phút" : "—", hook: i.note || "", lat: null, photos: [{ src: "data:image/svg+xml," + encodeURIComponent(svg) }] };
  }
  function taskWho(it) {
    if (it.type !== "task") return "";
    var ms = members(trip(state.tripId)); if (ms.length < 2) return "";
    return '<h3 class="h3">Ai đã xong</h3><ul class="who" aria-label="Ai đã xong">' + ms.map(function (n) { var ok = it.done && it.done[n]; return "<li>" + avatar(n) + "<span>" + esc(n === "Bạn" ? "Bạn (người tạo)" : n) + '</span><b class="' + (ok ? "ok" : "no") + '">' + (ok ? "Đã xong" : "Chưa xong") + "</b></li>"; }).join("") + "</ul><p class=\"note\">Mỗi người tự tích phần của mình, không tích hộ ai.</p>";
  }
  function itemSummary(it) { return '<div class="stack" style="gap:10px">' + metaChips(it) + taskWho(it) + '<button class="btn ghost block" type="button" data-act="editItem:' + it.id + '">' + ic("pencil") + "Giờ, chi phí, đặt chỗ</button></div>"; }

  /* ---------- xóa mềm, "Đã xóa gần đây" giữ đến khi xóa tay, khôi phục, xóa vĩnh viễn từng mục chỉ cần xác nhận (T7: F7, DR-011 A2/B1; D19, D25) ---------- */
  function agoText(e) { var d = Math.floor((Date.now() - e.at) / DAY_MS); return d < 1 ? "hôm nay" : d + " ngày trước"; }
  function trashItem(t, it) {
    var idx = t.items.indexOf(it), pos = it.day ? dayItems(t, it.day).indexOf(it) : -1, ent = { id: uid(), item: it, at: Date.now(), by: me(), day: it.day, pos: pos };
    t.items.splice(idx, 1); t.trash = t.trash || []; t.trash.unshift(ent); save(); render();
    toast("Đã xóa «" + itemName(it) + "»", function () { t.trash = t.trash.filter(function (x) { return x !== ent; }); it.day = ent.day; t.items.splice(Math.min(idx, t.items.length), 0, it); save(); render(); });
  }
  function restoreItem(t, ent) {
    var ds = days(t), it = ent.item, back = ent.day && ds.indexOf(ent.day) >= 0 ? ent.day : null;
    t.trash = t.trash.filter(function (x) { return x !== ent; }); it.day = back; it.removal = null; t.items.push(it);
    if (back) { var arr = dayItems(t, back).filter(function (x) { return x !== it; }), at = ent.pos >= 0 ? Math.min(ent.pos, arr.length) : arr.length; arr.splice(at, 0, it); arr.forEach(function (x, k) { x.ord = k; }); } else it.ord = null;   // về đúng vị trí cũ trong ngày (Trip.restore)
    save(); render();
    toast("Đã khôi phục «" + itemName(it) + "»" + ((ent.day && !back) || ent.cut ? " vào Chưa có ngày (ngày cũ không còn trong chuyến)" : ""), function () { t.items = t.items.filter(function (x) { return x !== it; }); t.trash.unshift(ent); save(); render(); });
  }
  function renderTrash() {
    var t = trip(state.tripId); if (!t) { go("trips"); return; }
    var owner = state.role === "owner", list = t.trash || [];
    var h = '<div class="pagehead pad-x"><div><button class="iconbtn" type="button" data-go="trip" aria-label="Quay lại chuyến đi">' + ic("chevron-left") + '</button></div><p class="note">' + esc(t.name) + "</p><h1>Đã xóa gần đây</h1><p class=\"note\">Mục bị xóa được giữ ở đây đến khi bạn xóa vĩnh viễn. Khôi phục để đưa lại vào chuyến đi." + (owner ? " Xóa vĩnh viễn không hoàn tác được." : " Chỉ người tạo chuyến xóa vĩnh viễn được.") + "</p></div>";
    if (!list.length) h += '<div class="empty pad-x"><h2 class="h2">Chưa có mục nào bị xóa</h2><p>Mục bạn xóa sẽ nằm ở đây để bạn khôi phục khi cần.</p><button class="btn" type="button" data-go="trip">Về chuyến đi</button></div>';
    else h += '<div class="stack pad-x">' + list.map(function (e) {
      var it = e.item, p = placeOf(it), kd = TYPES[typeOf(it)], nm = itemName(it);
      var tile = p ? '<div class="im"><img alt="" src="' + p.photos[0].src + '"></div>' : '<div class="im ktile">' + ic(kd.icon, "l") + "</div>";
      return '<div class="trashrow irow ' + (p ? "cat-" + p.cat : kd.cls) + '">' + tile + '<div class="tx"><span class="kind">' + ic(p ? catOf(p).icon : kd.icon, "s") + (p ? catOf(p).name : kd.label) + "</span><h3>" + esc(nm) + '</h3><p class="note">' + esc(e.by) + " xóa " + agoText(e) + '</p><div class="acts"><button class="btn ghost" type="button" data-act="restore:' + e.id + '" aria-label="Khôi phục «' + esc(nm) + '»">Khôi phục</button>' + (owner ? '<button class="btn danger" type="button" data-act="purge:' + e.id + '" aria-label="Xóa vĩnh viễn «' + esc(nm) + '»">Xóa vĩnh viễn</button>' : "") + "</div></div></div>";
    }).join("") + "</div>";
    screen.innerHTML = h;
  }
  function askPurge(id) {
    var t = trip(state.tripId), e = (t.trash || []).filter(function (x) { return x.id === id; })[0]; if (!e) return;
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Xóa vĩnh viễn «' + esc(itemName(e.item)) + '»?</h2><p class="note" style="margin-top:6px">Mục này sẽ mất hẳn và không khôi phục được. Thao tác này không cần xác thực lại.</p></div><div class="stack"><button class="btn danger block" type="button" data-act="purgeYes:' + e.id + '">Xóa vĩnh viễn</button><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>'; showSheet();
  }
  function doPurge(id) {
    var t = trip(state.tripId), e = (t.trash || []).filter(function (x) { return x.id === id; })[0]; if (!e) return;
    t.trash = t.trash.filter(function (x) { return x !== e; }); save(); closeSheet(); render(); toast("Đã xóa vĩnh viễn «" + itemName(e.item) + "».");
  }

  /* ---------- danh tính ẩn danh, mã khôi phục, xác thực lại (Q16, DR-001: QĐ-1…QĐ-6, MĐ-1…MĐ-8) ---------- */
  function codeNorm(s) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1"); }   // như Secrets.normalize: O→0, I/L→1
  function genCode() {
    var A = "0123456789ABCDEFGHJKMNPQRSTVWXYZ", out = "", n, r = new Uint8Array(30);   // 30 ký hiệu × 5 bit ≈ 150 bit, nhóm 5 (Secrets.newRecoveryCode)
    (window.crypto || window.msCrypto).getRandomValues(r);
    for (n = 0; n < 30; n++) { out += A.charAt(r[n] & 31); if (n % 5 === 4 && n < 29) out += "-"; }
    return out;
  }
  function trustedOthers() { return state.identity ? state.identity.devices.filter(function (d) { return !d.current; }) : []; }
  var reauth = null, codeCtx = null;
  function openReauth(title, why, onOk) { reauth = { title: title, why: why, onOk: onOk, tries: 0, locked: false, mode: null, sent: false, denied: false }; drawReauth(); }
  function drawReauth() {
    var r = reauth, idn = state.identity, others = trustedOthers(), hasCode = !!(idn && idn.code);
    var head = '<div><h2 style="font-size:26px">' + esc(r.title) + '</h2><p class="note" style="margin-top:6px">' + esc(r.why) + " Mỗi thao tác cần một lần xác thực riêng.</p></div>";
    if (!hasCode && !others.length) {
      panel.innerHTML = '<div class="pp">' + head + '<div class="warnbox" role="alert">Chưa thể xác thực lại: bạn chưa có mã khôi phục và mới chỉ có một thiết bị. Hãy tạo mã khôi phục trước, rồi quay lại.</div><div class="stack"><button class="btn block" type="button" data-act="issueFirst">Tạo mã khôi phục</button><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>'; showSheet(); return;
    }
    var mode = r.mode || (others.length ? "device" : "code"), body;
    var opts = '<div class="chips" role="group" aria-label="Cách xác thực">' + (others.length ? '<button class="fchip" type="button" data-act="reauthMode:device" aria-pressed="' + (mode === "device") + '">Thiết bị tin cậy khác</button>' : "") + (hasCode ? '<button class="fchip" type="button" data-act="reauthMode:code" aria-pressed="' + (mode === "code") + '">Mã khôi phục</button>' : "") + "</div>";
    if (mode === "device") {
      body = '<p class="note">Wander gửi yêu cầu tới «' + esc(others[0].name) + "». Bấm Duyệt trên thiết bị đó. Không dùng hết mã nào.</p>" +
        (r.sent ? '<div class="waitbox" role="status"><span class="spin" aria-hidden="true"></span>Đang chờ «' + esc(others[0].name) + '» duyệt…</div><div class="protobox"><b>BẢN THỬ</b><p class="note">Thiết bị kia sẽ hiện: “' + esc(r.title) + '. Chỉ duyệt nếu chính bạn vừa yêu cầu, và nó nêu rõ thao tác này.”</p><button class="btn" type="button" data-act="reauthApprove">Giả lập: thiết bị kia bấm Duyệt</button><button class="btn ghost" type="button" data-act="reauthDeny">Giả lập: thiết bị kia từ chối</button></div>' : '<button class="btn block" type="button" data-act="reauthSend">Gửi yêu cầu duyệt</button>') +
        (r.denied ? '<div class="warnbox" role="alert">Thiết bị kia đã từ chối yêu cầu.</div>' : "");
    } else {
      body = '<label class="field">Mã khôi phục<input id="r-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" aria-describedby="r-help"' + (r.locked ? " disabled" : "") + '></label><p class="note" id="r-help">Mã này sẽ được dùng hết cho thao tác này. Ngay sau đó bạn nhận một mã mới và phải nhập lại để xác nhận.</p><div id="r-warn"></div><button class="btn block" type="button" data-act="reauthCode"' + (r.locked ? " disabled" : "") + ">Xác thực</button>";
    }
    panel.innerHTML = '<div class="pp">' + head + opts + body + '<button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div>'; showSheet();
  }
  function reauthWithCode() {
    var r = reauth, w = $("r-warn"), v = $("r-code").value;
    if (codeNorm(v) && codeNorm(v) === codeNorm(state.identity.code)) { var ok = r.onOk; openIssueCode({ purpose: "reauth", onDone: function () { ok(true); } }); return; }
    r.tries++;
    if (r.tries >= 5) { r.locked = true; drawReauth(); $("r-warn").innerHTML = '<div class="warnbox" role="alert">Bạn đã thử quá nhiều lần ở thiết bị này. Chờ một lúc rồi thử lại, hoặc dùng thiết bị tin cậy khác.</div>'; return; }
    w.innerHTML = '<div class="warnbox" role="alert">Mã chưa đúng hoặc không còn hiệu lực.</div>'; $("r-code").focus();
  }
  function issueLocked() { return !!codeCtx && !sheet.hidden && !!panel.querySelector("#newcode, #c-re, #savedcode"); }
  document.addEventListener("visibilitychange", function () { var c = $("newcode"); if (c) c.classList.toggle("blur", document.hidden); });   // làm mờ mã khi tab bị ẩn (ảnh chụp chuyển tab, ảnh xem trước)
  function openIssueCode(ctx) { ctx.newCode = genCode(); ctx.step = 1; codeCtx = ctx; drawIssue(); }
  function drawIssue() {
    var c = codeCtx, first = c.purpose === "first";
    var why = { first: "Đây là chìa khóa để mở lại chuyến đi khi mất thiết bị. Wander không lưu bản đọc được của mã này.", reauth: "Mã cũ vẫn dùng được cho tới khi bạn xác nhận mã mới ở bước sau. Mã mới chỉ có hiệu lực từ lúc đó.", regen: "Mã cũ vẫn dùng được cho tới khi bạn xác nhận mã mới.", recover: "Khôi phục chỉ hoàn tất khi bạn xác nhận mã mới. Mã cũ vẫn dùng được cho tới lúc đó." }[c.purpose];
    if (c.step === 1) {
      panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">' + (first ? "Mã khôi phục của bạn" : "Mã khôi phục mới") + '</h2><p class="note" style="margin-top:6px">' + esc(why) + '</p></div><div class="codebox" id="newcode" role="group" aria-label="Mã khôi phục">' + c.newCode.split("-").map(function (g, k) { return (k ? '<span class="sep">-</span>' : "") + "<span>" + g + "</span>"; }).join("") + '</div><div class="warnbox">Chép ra giấy hoặc lưu trong trình quản lý mật khẩu. Mã chỉ hiện một lần; đừng để ảnh chụp trên chính thiết bị này nếu ảnh tự đồng bộ. Nếu mất mã và mất mọi thiết bị tin cậy, bạn mất quyền với chuyến đi vĩnh viễn.</div><div class="stack"><button class="btn ghost block" type="button" data-act="codeCopy">' + ic("share-2") + 'Sao chép mã</button><button class="btn block" type="button" data-act="codeNext">Tôi đã lưu mã, tiếp tục</button>' + (first && c.pendingIdentity ? '<button class="btn ghost block" type="button" data-act="codeSkip">Để sau (chuyến đi vẫn được lưu)</button>' : "") + '<button class="btn ghost block" type="button" data-act="codeCancel">' + (first && c.pendingIdentity ? "Hủy, chưa lưu chuyến đi" : "Hủy") + "</button>" + "</div></div>";
    } else if (c.step === 2) {
      panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Nhập lại mã để xác nhận</h2><p class="note" style="margin-top:6px">Để chắc là bạn đã lưu đúng. Mã mới chỉ có hiệu lực sau bước này.</p></div><label class="field">Mã khôi phục mới<input id="c-re" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"></label><div id="c-warn"></div><div class="stack"><button class="btn block" type="button" data-act="codeConfirm">Xác nhận</button><button class="btn ghost block" type="button" data-act="codeBack">Xem lại mã</button></div></div>';
    } else if (c.step === 4) {
      panel.innerHTML = '<div class="pp"><div><span class="obx-ok" aria-hidden="true">' + ic("check", "l") + '</span><h2 style="font-size:26px">Đã lưu mã khôi phục</h2><p class="note" style="margin-top:6px">Mã mới đã có hiệu lực. Đây là lần cuối bạn xem được mã: hãy lưu ở nơi an toàn rồi bấm Xong.</p></div><div class="codebox" id="savedcode" role="group" aria-label="Mã khôi phục đã lưu">' + c.newCode.split("-").map(function (g, k) { return (k ? '<span class="sep">-</span>' : "") + "<span>" + g + "</span>"; }).join("") + '</div><div class="stack"><div class="two"><button class="btn ghost" type="button" data-act="codeCopy">' + ic("share-2") + 'Sao chép</button><button class="btn ghost" type="button" data-act="codeDownload">' + ic("check") + 'Tải về (.txt)</button></div><button class="btn ghost block" type="button" data-act="codePrint">In ra giấy</button><button class="btn block" type="button" data-act="codeDone">Xong, tôi đã lưu mã</button></div></div>';
    }
    showSheet(); if (c.step === 2) $("c-re").focus();
  }
  function finishIssue(skip) {
    var c = codeCtx, done = c.onDone;
    if (c.pendingIdentity) { state.identity = c.pendingIdentity; c.pendingIdentity = null; }
    if (!skip) {
      state.identity.code = c.newCode; syncServerFromState(); save();   // mã có hiệu lực NGAY khi nhập lại đúng (QĐ-6)
      c.step = 4; drawIssue(); return;                                    // rồi cho xem lại, sao chép, tải, in; đóng khi bấm Xong
    }
    codeCtx = null; syncServerFromState(); save(); closeSheet(); if (done) done();
    toast(UI.COPY.SKIP_CODE_SAVED);
  }
  function codeDone() { var c = codeCtx, done = c && c.onDone; codeCtx = null; closeSheet(); if (done) done(); }
  function codeFileText(code) { return "MÃ KHÔI PHỤC WANDER\r\n\r\n" + code + "\r\n\r\nTạo lúc: " + new Date().toLocaleString("vi-VN") + "\r\nGiữ ở nơi an toàn. Wander không lưu bản đọc được của mã này và không ai khôi phục giúp bạn nếu mất cả mã lẫn mọi thiết bị tin cậy.\r\n"; }
  function codeDownload(code) { try { var u = URL.createObjectURL(new Blob([codeFileText(code)], { type: "text/plain;charset=utf-8" })), a = document.createElement("a"); a.href = u; a.download = "wander-ma-khoi-phuc.txt"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); toast("Đã tải tệp mã. Cất ở nơi an toàn, đừng để đồng bộ lên đám mây công khai."); } catch (e) { toast("Không tải được, hãy chép tay."); } }
  function codePrint(code) { try { var fr = document.createElement("iframe"); fr.setAttribute("aria-hidden", "true"); fr.style.cssText = "position:fixed;width:0;height:0;border:0;"; document.body.appendChild(fr); fr.srcdoc = "<!doctype html><meta charset=utf-8><title>Mã khôi phục Wander</title><body style=\"font:20px system-ui;padding:32px\"><h1>Mã khôi phục Wander</h1><p style=\"font:700 28px ui-monospace,Consolas,monospace;letter-spacing:.05em\">" + code + "</p><p>Giữ ở nơi an toàn. Wander không lưu bản đọc được của mã này.</p></body>"; fr.onload = function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast("Không in được, hãy chép tay."); } setTimeout(function () { fr.remove(); }, 4000); }; } catch (e) { toast("Không in được, hãy chép tay."); } }
  /* ---------- T8: người mới → danh tính ẩn danh khi lưu lần đầu (F2); T9: bảo mật, thiết bị tin cậy, khôi phục trên máy mới (F8) ---------- */
  var SKEY = "wander-proto-server", ATTEMPT_TTL = (Number((/[?&]ttl=(\d+)/.exec(location.search) || [])[1]) || 900) * 1000, PAIR_TTL = 300000;
  function demoIdentity(withCurrent) {
    var now = Date.now();
    return { code: "7K2QF-R9XMT-4B8HD-WJ3NC-5VZ6A-E1G0Y", created: now - 9 * 864e5, events: [{ at: now - 3 * 864e5, text: "Đã thêm «Máy tính bảng» bằng mã ghép" }], devices: [
      { id: "d1", name: withCurrent ? "Thiết bị này" : "Điện thoại của bạn", current: !!withCurrent, at: withCurrent ? now : now - 864e5 },
      { id: "d2", name: "Máy tính bảng", current: false, at: now - 3 * 864e5 }] };
  }
  /* "máy chủ" giả của prototype: một danh tính mẫu mà máy mới khôi phục được; lưu riêng để ?fresh=1 vẫn thấy */
  function server() {
    try { var s = JSON.parse(localStorage.getItem(SKEY) || "null"); if (s) return s; } catch (e) { /* bỏ qua */ }
    var d = demoIdentity(false); saveServer(d); return d;
  }
  function saveServer(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) { /* bỏ qua */ } }
  function syncServerFromState() {
    if (!state.identity) return;
    var sv = server(); if (state.identity.code) sv.code = state.identity.code;   // chưa có mã: không ghi đè danh tính mẫu của máy chủ giả
    sv.devices = state.identity.devices.map(function (d) { return { id: d.id, name: d.name, current: false, at: d.at }; }); sv.events = state.identity.events || []; saveServer(sv);
  }
  function agoMs(at) { var m = Math.floor((Date.now() - at) / 60000); if (m < 1) return "vừa xong"; if (m < 60) return m + " phút trước"; var h = Math.floor(m / 60); if (h < 24) return h + " giờ trước"; return Math.floor(h / 24) + " ngày trước"; }
  function pairCode() { var A = "0123456789ABCDEFGHJKMNPQRSTVWXYZ", r = new Uint8Array(8), s = "", n; (window.crypto || window.msCrypto).getRandomValues(r); for (n = 0; n < 8; n++) s += A.charAt(r[n] & 31); return s.slice(0, 4) + "-" + s.slice(4); }   // mã ngắn XXXX-XXXX (Secrets.newShortCode)
  function spaced(c) { return c; }

  /* F2: lưu lần đầu → giải thích bằng chữ thường ngày → tạo danh tính → mã hiện MỘT lần → nhập lại hoặc bỏ qua có cảnh báo (QĐ-5) */
  var idCtx = null;
  function startIdentity(done) {
    idCtx = { done: done };
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Lưu chuyến đi của bạn</h2><p class="note" style="margin-top:6px">Wander tạo một danh tính ẩn danh để bạn mở lại chuyến đi trên máy khác. Không cần email hay số điện thoại.</p></div>' +
      '<ul class="keybox"><li>' + ic("key") + '<span>Bạn nhận một <b>mã khôi phục</b>, chỉ hiện <b>một lần</b>. Đó là chìa khóa lấy lại chuyến đi khi mất máy.</span></li></ul>' +
      '<div class="stack"><button class="btn block" type="button" data-act="idCreate">Tạo danh tính và nhận mã</button><button class="btn ghost block" type="button" data-act="idSkip">Để sau, lưu chuyến đi luôn</button><p class="note skipnote">' + ic("info-circle", "s") + esc(UI.COPY.SKIP_CODE_NOTE) + "</p></div></div>";
    showSheet();
  }

  /* F8 (thiết bị đang dùng): Bảo mật */
  function devRow(d) {
    return '<div class="devrow"><span class="ib">' + ic("device-mobile", "l") + '</span><div><b>' + esc(d.name) + '</b><span class="note">' + (d.current ? "Đang dùng" : "Hoạt động " + agoMs(d.at)) + "</span></div>" + (d.current ? "" : '<button class="btn ghost" type="button" data-act="revoke:' + d.id + '" aria-label="Thu hồi ' + esc(d.name) + '">Thu hồi</button>') + "</div>";
  }
  function renderSecurity() {
    var idn = state.identity, h = '<div class="pagehead pad-x"><div><button class="iconbtn" type="button" data-go="trips" aria-label="Quay lại">' + ic("chevron-left") + '</button></div><p class="note">Danh tính ẩn danh</p><h1>Bảo mật</h1><p class="note">Wander không hỏi email hay số điện thoại. Quyền với chuyến đi của bạn nằm ở mã khôi phục và các thiết bị tin cậy.</p></div>';
    if (!idn) { screen.innerHTML = h + '<div class="empty pad-x"><h2 class="h2">Chưa có danh tính</h2><p>Danh tính ẩn danh được tạo khi bạn lưu chuyến đi đầu tiên.</p><button class="btn" type="button" data-go="explore">Đi khám phá</button></div>'; return; }
    h += '<div class="stack pad-x" style="gap:16px">';
    if (idn.unseen) { h += '<div class="infobox" role="status"><b>Có hoạt động mới trên danh tính của bạn</b><p>Xem mục “Hoạt động gần đây” bên dưới. Nếu không phải bạn, thu hồi thiết bị lạ và tạo mã mới.</p></div>'; idn.unseen = false; save(); }
    if (state.recovered) h += '<div class="infobox" role="status"><b>Đã mở chuyến đi trên máy này</b><p>Các thiết bị cũ vẫn còn hiệu lực. Hãy xem danh sách bên dưới và thu hồi thiết bị bạn không nhận ra.</p></div>';
    h += '<section class="seccard"><h2 class="h2">Mã khôi phục</h2>' + (idn.code ? '<p class="note">' + ic("check", "s") + " Bạn đã có mã khôi phục. Wander không giữ bản đọc được nên không xem lại được. Tạo mã mới cần xác thực lại.</p>" + '<button class="btn ghost block" type="button" data-act="regenCode">' + ic("key") + "Tạo mã mới</button>" : '<div class="warnbox" role="alert">Bạn chưa có mã khôi phục. Nếu mất thiết bị này và không còn thiết bị tin cậy nào, bạn mất quyền với chuyến đi vĩnh viễn.</div><button class="btn block" type="button" data-act="issueNow">' + ic("key") + "Tạo mã khôi phục</button>") + "</section>";
    h += '<section class="seccard"><h2 class="h2">Thiết bị tin cậy</h2><p class="note">Thiết bị tin cậy duyệt được thiết bị mới. Thu hồi thiết bị bạn không nhận ra hoặc đã mất.</p>' + idn.devices.map(devRow).join("") + "</section>";
    h += '<section class="seccard"><h2 class="h2">Hoạt động gần đây</h2>' + ((idn.events || []).length ? '<ul class="evlist">' + idn.events.slice(0, 8).map(function (e) { return "<li><span>" + esc(e.text) + '</span><span class="note">' + agoMs(e.at) + "</span></li>"; }).join("") + "</ul>" : '<p class="note">Chưa có hoạt động nào.</p>') + '<p class="note">Có hoạt động bạn không nhận ra? Thu hồi thiết bị lạ rồi tạo mã khôi phục mới.</p></section>';
    h += '<section class="seccard"><h2 class="h2">Thêm thiết bị mới</h2><p class="note">Trên máy mới, mở Wander, chọn “Đã có chuyến đi” rồi “Thiết bị cũ duyệt”. Nhập mã ghép hiện trên máy đó vào đây.</p><label class="field">Mã ghép trên máy mới<input id="p-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX" aria-describedby="p-help"></label><p class="note" id="p-help">Mã ghép gồm 8 ký tự, hết hạn sau 5 phút, dùng một lần.</p><div id="p-warn"></div><button class="btn block" type="button" data-act="pairApprove">Duyệt thiết bị mới</button>' +
      '<div class="protobox"><b>BẢN THỬ</b>' + (state.pairing ? '<p class="note">Máy mới đang hiện mã ghép: <b class="pcode">' + spaced(state.pairing.code) + "</b></p>" : "") + '<button class="btn ghost" type="button" data-act="protoPair">Giả lập: máy mới xin ghép</button><button class="btn ghost" type="button" data-act="protoRemote">Giả lập: thiết bị khác khôi phục bằng mã</button></div></section>';
    screen.innerHTML = h + "</div>";
  }
  function openRevoke(id) {
    var d = state.identity.devices.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Thu hồi «' + esc(d.name) + '»?</h2><p class="note" style="margin-top:6px">Thiết bị này sẽ không mở được chuyến đi của bạn nữa. Thao tác này không cần xác thực lại và không hoàn tác được; thiết bị có thể xin ghép lại.</p></div><div class="stack"><button class="btn danger block" type="button" data-act="revokeYes:' + d.id + '">Thu hồi</button><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>'; showSheet();
  }
  var pairTries = 0;
  function logEvent(text, unseen) {
    if (!state.identity) return;
    state.identity.events = [{ at: Date.now(), text: text }].concat(state.identity.events || []).slice(0, 50);
    if (unseen) state.identity.unseen = true;
  }
  function pairApprove() {
    var v = codeNorm($("p-code").value), w = $("p-warn"), p = state.pairing;
    if (pairTries >= 5) { w.innerHTML = '<div class="warnbox" role="alert">Bạn đã thử quá nhiều lần ở thiết bị này. Chờ một lúc rồi thử lại.</div>'; return; }
    if (p && v && v === codeNorm(p.code) && Date.now() - p.at < PAIR_TTL) { openPairConfirm(); return; }
    pairTries++;
    w.innerHTML = pairTries >= 5 ? '<div class="warnbox" role="alert">Bạn đã thử quá nhiều lần ở thiết bị này. Chờ một lúc rồi thử lại.</div>' : '<div class="warnbox" role="alert">Mã ghép chưa đúng hoặc đã hết hạn. Hãy xem lại mã đang hiện trên máy mới.</div>';
    $("p-code").focus();
  }
  /* màn duyệt phải đủ thông tin để người dùng nhận ra thiết bị lạ (security-reviewer M3) */
  function openPairConfirm() {
    var p = state.pairing, mins = Math.max(0, Math.round((Date.now() - p.at) / 60000));
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Duyệt thiết bị mới?</h2></div><div class="seccard"><div class="devrow"><span class="ib">' + ic("device-mobile", "l") + "</span><div><b>" + esc(p.name || "Thiết bị mới") + '</b><span class="note">Xin ghép ' + (mins < 1 ? "vừa xong" : mins + " phút trước") + '</span></div></div><p class="note">Tên do thiết bị tự khai, chưa được xác minh.</p><p class="note">Khu vực ước tính: ' + esc(p.region || "không xác định") + ' (đoán theo mạng, có thể sai). <b>Ví dụ của bản thử, chưa có dữ liệu thật.</b></p></div><div class="warnbox" role="alert">Chỉ duyệt nếu chính bạn vừa mở Wander trên thiết bị này. Người lạ nhờ bạn nhập mã là dấu hiệu lừa đảo.</div><div class="stack"><button class="btn block" type="button" data-act="pairYes">Duyệt</button><button class="btn danger block" type="button" data-act="pairNo">Không phải tôi</button></div></div>'; showSheet();
  }
  /* F8 (máy mới): Mở chuyến đi trên máy này, bằng mã khôi phục (KP-C) hoặc thiết bị cũ duyệt */
  var recov = { mode: "code", tries: 0, locked: false, pair: null, expired: false };
  function renderRecover() {
    var h = '<div class="pagehead pad-x"><div><button class="iconbtn" type="button" data-go="explore" aria-label="Quay lại">' + ic("chevron-left") + '</button></div><h1>Mở chuyến đi trên máy này</h1><p class="note">Dành cho bạn đã dùng Wander trên một thiết bị khác.</p></div><div class="stack pad-x" style="gap:16px">';
    h += '<div class="chips" role="group" aria-label="Cách mở"><button class="fchip" type="button" data-act="recMode:code" aria-pressed="' + (recov.mode === "code") + '">Mã khôi phục</button><button class="fchip" type="button" data-act="recMode:device" aria-pressed="' + (recov.mode === "device") + '">Thiết bị cũ duyệt</button></div>';
    if (recov.mode === "code") {
      h += '<label class="field">Mã khôi phục<input id="rc-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"' + (recov.locked ? " disabled" : "") + '></label><p class="note">Mã chỉ dùng một lần. Nhập đúng thì bạn nhận một mã mới và phải nhập lại để xác nhận, sau đó mới mở được chuyến đi.</p><div id="rc-warn"></div><button class="btn block" type="button" data-act="recCode"' + (recov.locked ? " disabled" : "") + '>Tiếp tục</button><div class="protobox"><b>BẢN THỬ</b><p class="note">Mã của tài khoản mẫu: <b class="pcode">' + esc(server().code) + "</b></p></div>";
    } else {
      var exp = recov.expired ? '<div class="warnbox" role="alert">Mã ghép đã hết hạn. Hiện mã mới để thử lại.</div>' : "";
      if (recov.pair) h += '<div class="pairbox"><span class="note">Mã ghép của máy này</span><b class="pcode big">' + spaced(recov.pair.code) + '</b><span class="note">Trên thiết bị cũ: Bảo mật → Thêm thiết bị mới, nhập mã này. Hết hạn sau 5 phút.</span></div><div class="waitbox" role="status"><span class="spin" aria-hidden="true"></span>Đang chờ thiết bị cũ duyệt…</div><div class="protobox"><b>BẢN THỬ</b><button class="btn" type="button" data-act="recApprove">Giả lập: thiết bị cũ nhập mã và duyệt</button><button class="btn ghost" type="button" data-act="recExpire">Giả lập: mã ghép hết hạn</button></div>';
      else h += '<p class="note">Máy này sẽ hiện một mã ghép gồm 6 số. Bạn nhập mã đó trên thiết bị cũ để duyệt. Cách này không dùng hết mã khôi phục.</p>' + exp + '<button class="btn block" type="button" data-act="recPair">Hiện mã ghép</button>';
    }
    screen.innerHTML = h + "</div>";
  }
  function recoverIdentityFromServer() {
    var sv = server();
    return { code: sv.code, created: sv.created, events: sv.events || [], devices: sv.devices.map(function (d) { return { id: d.id, name: d.name, current: false, at: d.at }; }).concat([{ id: uid(), name: "Thiết bị này", current: true, at: Date.now() }]) };
  }
  function recoverWithCode() {
    var v = $("rc-code").value, sv = server(), w = $("rc-warn");
    if (codeNorm(v) && codeNorm(v) === codeNorm(sv.code)) {
      var idn = recoverIdentityFromServer(); idn.code = null;
      openIssueCode({ purpose: "recover", pendingIdentity: idn, attempt: { expires: Date.now() + ATTEMPT_TTL }, onDone: finishRecovery });
      return;
    }
    recov.tries++;
    if (recov.tries >= 5) { recov.locked = true; renderRecover(); $("rc-warn").innerHTML = '<div class="warnbox" role="alert">Bạn đã thử quá nhiều lần ở thiết bị này. Chờ một lúc rồi thử lại, hoặc dùng thiết bị cũ duyệt.</div>'; return; }
    w.innerHTML = '<div class="warnbox" role="alert">Mã chưa đúng hoặc không còn hiệu lực.</div>'; $("rc-code").focus();
  }
  function finishRecovery() {
    if (!state.trips.length) seedDemo();
    logEvent("Chuyến đi được mở trên một thiết bị mới"); syncServerFromState();
    state.recovered = true; recov = { mode: "code", tries: 0, locked: false, pair: null, expired: false };
    state.view = "security"; save(); render(); toast("Đã mở chuyến đi trên máy này.");
  }
  function recoverWithDevice() {
    if (!recov.pair || Date.now() - recov.pair.at >= PAIR_TTL) { recov.pair = null; recov.expired = true; renderRecover(); return; }
    state.identity = recoverIdentityFromServer(); syncServerFromState(); finishRecovery();
  }

  function findItem(t, id) { return t.items.filter(function (x) { return x.id === id; })[0]; }
  function removeItem(t, it, byOwner) {
    var idx = t.items.indexOf(it);
    if (byOwner) { trashItem(t, it); }
    else openRequestRemoval(it.id);
  }
  function openRequestRemoval(id) {
    var t = trip(state.tripId), it = findItem(t, id);
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Đề nghị xóa «' + esc(itemName(it)) + '»</h2><p class="note" style="margin-top:6px">Người tạo chuyến sẽ xem và quyết định. Mục vẫn ở trong chuyến cho tới khi họ đồng ý.</p></div><label class="field"><span>Lý do (không bắt buộc)</span><textarea id="q-reason" rows="3" maxlength="200" placeholder="Ví dụ: đi thuyền mất gần nửa buổi"></textarea></label><div class="stack"><button class="btn block" type="button" data-act="reqSend:' + id + '">Gửi đề nghị</button><button class="btn ghost block" type="button" data-act="closeSheet">Thôi</button></div></div>'; showSheet();
  }
  function sendRequest(id) {
    var t = trip(state.tripId), it = findItem(t, id), why = ($("q-reason").value || "").replace(/\s+/g, " ").trim().slice(0, 200);
    it.removal = { by: mb(), when: "vừa xong", reason: why || "Không ghi lý do.", status: "pending" }; closeSheet(); save(); render();
    toast("Đã gửi đề nghị xóa cho người tạo.", function () { it.removal = null; save(); render(); });
  }
  function resolveRequest(t, it, keep) { if (keep) { it.removal.status = "rejected"; save(); render(); toast("Giữ lại «" + itemName(it) + "»"); } else removeItem(t, it, true); }
  function assignDay(t, it, n, quiet) {
    var ds = days(t), prev = it.day, prevOrd = it.ord; it.day = n ? ds[n - 1] : null; it.ord = null; save(); render();
    if (!quiet) toast(n ? "Đã xếp vào Ngày " + n : "Đưa về Chưa có ngày", function () { it.day = prev; it.ord = prevOrd; save(); render(); });
  }
  function attachRowSwipe(sw, t, owner) {
    var row = sw.querySelector(".irow"), it = findItem(t, sw.dataset.item), pend = it.removal && it.removal.status === "pending", sx = 0, sy = 0, dx = 0, down = false, dragging = false, id = null;
    row.addEventListener("pointerdown", function (e) { down = true; dragging = false; dx = 0; sx = e.clientX; sy = e.clientY; id = e.pointerId; row.style.transition = "none"; });
    row.addEventListener("pointermove", function (e) {
      if (!down) return; var mx = e.clientX - sx, my = e.clientY - sy;
      if (!dragging) { if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my)) { dragging = true; try { row.setPointerCapture(id); } catch (er) { /* bỏ qua */ } } else return; }
      dx = mx; row.style.transform = "translateX(" + dx + "px)"; sw.querySelector(".swbg").className = "swbg " + (dx < 0 ? "go-l" : (pend ? "go-r" : "go-day"));
    });
    function end() {
      if (!down) return; down = false; row.style.transition = "";
      if (dragging && Math.abs(dx) > 90) {
        row.style.transform = "translateX(" + (dx < 0 ? -520 : 520) + "px)"; var dir = dx < 0 ? "l" : "r";
        setTimeout(function () {
          if (dir === "l") { if (pend && !owner) { render(); toast("Đề nghị đã gửi, chờ người tạo duyệt."); } else if (pend) resolveRequest(t, it, false); else removeItem(t, it, owner || it.addedBy === mb()); }
          else if (pend) { if (owner) resolveRequest(t, it, true); else render(); } else { render(); openDayPicker(it.id); }
        }, reduce() ? 0 : 200);
      } else row.style.transform = "";
      row.dataset.moved = dragging ? "1" : ""; setTimeout(function () { row.dataset.moved = ""; }, 50);
    }
    row.addEventListener("pointerup", end); row.addEventListener("pointercancel", end);
  }

  /* ---------- xếp giúp tôi: nhóm theo khoảng cách ---------- */
  function planDays(t) {
    var ds = days(t), un = t.items.filter(function (i) { return !i.day && !(i.removal && i.removal.status === "pending"); });
    var withC = un.filter(function (i) { return placeOf(i) && placeOf(i).lat != null; }), noC = un.filter(function (i) { return !(placeOf(i) && placeOf(i).lat != null); }), order = [], cur = HUB, pool = withC.slice();
    while (pool.length) { var bi = 0, bd = 1e9; pool.forEach(function (i, k) { var d = air(cur, BY[i.placeId]); if (d < bd) { bd = d; bi = k; } }); var nx = pool.splice(bi, 1)[0]; order.push(nx); cur = BY[nx.placeId]; }
    order = order.concat(noC);
    var counts = ds.map(function (d) { return dayItems(t, d).length; }), target = Math.ceil((t.items.filter(function (i) { return i.day; }).length + order.length) / ds.length), res = {}, di = 0;
    order.forEach(function (i, k) { while (di < ds.length - 1 && counts[di] >= target) di++; res[i.id] = { day: ds[di], ord: counts[di] }; counts[di]++; });
    return { res: res, ds: ds, un: un };
  }
  function openAutoPlan() {
    var t = trip(state.tripId), pl = planDays(t); if (!pl.un.length) { toast(t.items.some(function (i) { return !i.day; }) ? "Các địa điểm còn lại đang chờ duyệt xóa." : "Mọi địa điểm đã có ngày."); return; }
    planDraft = pl;
    var by = {}; pl.un.forEach(function (i) { var r = pl.res[i.id]; (by[r.day] = by[r.day] || []).push(i); });
    var html = pl.ds.map(function (d, k) { var arr = (by[d] || []).sort(function (a, b) { return pl.res[a.id].ord - pl.res[b.id].ord; }); if (!arr.length) return ""; return '<div style="--tc:' + dayColor(k) + '"><b>Ngày ' + (k + 1) + "</b>" + arr.map(function (i, n) { return "<span>" + (n + 1) + ". " + esc(itemName(i)) + "</span>"; }).join("") + "</div>"; }).join("");
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Gợi ý xếp ngày</h2><p class="note" style="margin-top:6px">Nhóm các nơi gần nhau vào cùng một ngày, tính theo đường chim bay. Đường núi thực tế có thể xa hơn. Bạn chỉnh lại được sau khi áp dụng.</p></div><div class="plan">' + html + '</div><div class="stack"><button class="btn block" type="button" data-act="applyPlan">' + ic("check") + 'Áp dụng gợi ý</button><button class="btn ghost block" type="button" data-act="closeSheet">Để tôi tự xếp</button></div></div>';
    showSheet();
  }
  function applyPlan() {
    var t = trip(state.tripId), pl = planDraft, snap = snapshot(t); if (!pl) return;
    t.items.forEach(function (i) { var r = pl.res[i.id]; if (r) { i.day = r.day; i.ord = r.ord; } });
    planDraft = null; closeSheet(); save(); render(); toast("Đã xếp " + pl.un.length + " địa điểm theo gợi ý", function () { restore(t, snap); save(); render(); });
  }
  function openAddToDay() {
    var t = trip(state.tripId), k = Number(state.dayTab) - 1, un = t.items.filter(function (i) { return !i.day; });
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Thêm vào Ngày ' + (k + 1) + '</h2><p class="note" style="margin-top:6px">Chọn các địa điểm chưa có ngày.</p></div><div>' + un.map(function (i) { var p = placeOf(i); return '<label class="checkrow"><input type="checkbox" data-pick="' + i.id + '"><span><b>' + esc(itemName(i)) + '</b><br><span class="note">' + (p ? esc(catOf(p).name) + " · " + esc(p.area) : esc(TYPES[typeOf(i)].label)) + "</span></span>" + (p ? '<img alt="" src="' + p.photos[0].src + '" width="48" height="48" style="border-radius:12px;object-fit:cover">' : "<span></span>") + "</label>"; }).join("") + '</div><div class="stack"><button class="btn block" type="button" data-act="doAddToDay">Thêm vào Ngày ' + (k + 1) + '</button><button class="btn ghost block" type="button" data-act="addMore">Khám phá thêm địa điểm mới</button></div></div>';
    showSheet();
  }
  function openEditTrip() {
    var t = trip(state.tripId);
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Sửa chuyến đi</h2></div><label class="field">Tên chuyến đi<input id="e-name" maxlength="120" value="' + esc(t.name) + '"></label><div class="two"><label class="field">Ngày đi<input id="e-start" type="date" value="' + t.start + '"><small class="hint"></small></label><label class="field">Ngày về<input id="e-end" type="date" value="' + t.end + '"><small class="hint"></small></label></div>' +
      (t.tentative ? '<label class="checkrow" style="grid-template-columns:28px 1fr"><input id="e-sure" type="checkbox"><span>Đã chốt ngày (bỏ nhãn “chưa chắc”)</span></label>' : "") + '<label class="checkrow" style="grid-template-columns:28px 1fr"><input id="e-shift" type="checkbox" checked><span>Dời cả lịch theo ngày mới (khi số ngày không đổi)</span></label><div id="e-warn"></div><div class="stack"><button class="btn block" type="button" data-act="doEdit">Lưu thay đổi</button><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>';
    showSheet();
  }
  var editConfirm = false;
  function doEdit() {
    var t = trip(state.tripId), name = $("e-name").value.trim() || t.name, st = $("e-start").value, en = $("e-end").value;
    if (!st || !en || en < st) { $("e-warn").innerHTML = '<div class="warnbox">Ngày về phải sau hoặc bằng ngày đi.</div>'; return; }
    if (Math.round((new Date(en) - new Date(st)) / 864e5) + 1 > 366) { $("e-warn").innerHTML = '<div class="warnbox">Chuyến đi tối đa 366 ngày.</div>'; return; }
    var nt = { start: st, end: en }, nds = days(nt), ods = days(t), same = nds.length === ods.length && $("e-shift").checked, lost = 0;
    var map = function (d) { if (!d) return null; if (same) return nds[ods.indexOf(d)] || null; return nds.indexOf(d) >= 0 ? d : null; };
    t.items.forEach(function (i) { if (i.day && !map(i.day)) lost++; });
    if (lost && editConfirm !== lost) { editConfirm = lost; $("e-warn").innerHTML = '<div class="warnbox">' + lost + " địa điểm nằm ở ngày bị cắt sẽ chuyển về “Chưa có ngày”. Bấm Lưu lần nữa để xác nhận. Bạn vẫn hoàn tác được.</div>"; return; }
    editConfirm = false; var snap = snapshot(t); t.name = name; t.start = st; t.end = en; if ($("e-sure") && $("e-sure").checked) t.tentative = false; t.items.forEach(function (i) { i.day = map(i.day); }); (t.trash || []).forEach(function (e) { var nd = map(e.day); if (e.day && !nd) e.cut = true; e.day = nd; });
    if (state.dayTab !== "ov" && Number(state.dayTab) > nds.length) state.dayTab = "ov";
    closeSheet(); save(); render(); toast("Đã cập nhật chuyến đi", function () { restore(t, snap); save(); render(); });
  }

  /* ---------- tờ phủ ---------- */
  // Ngăn kéo chi tiết đi theo thẻ đầu bộ thẻ: quyết định xong thì chuyển sang thẻ kế, hết thẻ thì đóng
  function syncDrawer() {
    if (sheet.hidden || !sheet.classList.contains("drawer")) return;
    var c = screen.querySelector(".card.front"); if (c) openInfo(c.dataset.id); else closeSheet();
  }
  function showSheet(full, asDrawer) {
    lastFocus = document.activeElement; var drawer = !!asDrawer && drawerOK();
    panel.className = "panel" + (full ? " full" : ""); sheet.classList.toggle("drawer", drawer); document.body.classList.toggle("has-drawer", drawer);
    panel.setAttribute("aria-modal", drawer ? "false" : "true"); hintDates(panel); hintMoney(panel); sheet.hidden = false;
    var f = panel.querySelector("button:not([disabled]), input:not([disabled]), select, textarea"); if (f) f.focus();
  }
  function trapTab(e) {
    var f = Array.prototype.filter.call(panel.querySelectorAll("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"), function (x) { return x.offsetParent !== null; });
    if (!f.length) return; var a = document.activeElement;
    if (!panel.contains(a)) { e.preventDefault(); f[0].focus(); }
    else if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  function closeSheet() { if (sheet.hidden) return; if (bigMap) { bigMap.destroy(); bigMap = null; } sheetMaps.forEach(function (m) { m.destroy(); }); sheetMaps = []; sheet.hidden = true; panel.innerHTML = "";   /* không để mã/ô nhập còn trong DOM sau khi đóng */ sheet.classList.remove("drawer"); document.body.classList.remove("has-drawer"); editConfirm = false; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* bỏ qua */ } }
  /** Bản đồ nhỏ trong chi tiết: nơi này, mốc TP Hà Giang và đường nối với khoảng cách ước tính. */
  function mountMiniMap(p) {
    var host = $("mini-tm"); if (!host || p.lat == null) return;
    var m = new TerrainMap(host, { dest: DEST.id, interactive: false, towns: false, credit: false }); sheetMaps.push(m);
    m.setMode("route"); m.setMarkers([{ id: "hub", lat: HUB.lat, lon: HUB.lon, label: HUB.name, kind: "hub" }, { id: p.id, lat: p.lat, lon: p.lon, label: p.name, thumb: p.photos[0].src }]);
    var d = km(p, HUB); m.setRoute(["hub", p.id], [d ? "~" + Math.round(d) + " km" : ""]); m.fitTo(null, { animate: false, padding: 44 });
  }
  /** Lưới 6 thông tin nhanh của một nơi (thời gian, độ khó, mùa đẹp, khoảng cách, xe máy, buổi nên đi), đều từ kho biên tập hoặc ước tính có nhãn. */
  function infoFacts(p, a, tm) {
    var slots = TOD.filter(function (s) { return p.tod.slots.indexOf(s[0]) >= 0; }).map(function (s) { return s[1]; }).join(", ");
    var f = [["clock", p.dur, "Thời gian ghé"], ["gauge", p.level, "Độ khó"], ["calendar-event", p.best, "Mùa đẹp"], ["route", a ? "~" + a + " km" : "—", "Cách " + HUB.name], ["motorbike", tm || "—", "Đi xe máy, ước tính"], ["sun", slots || "—", "Nên đi buổi"]];
    return '<ul class="facts">' + f.map(function (x) { return '<li><span class="ib">' + ic(x[0]) + "</span><b>" + esc(x[1]) + "</b><span>" + esc(x[2]) + "</span></li>"; }).join("") + "</ul>";
  }
  function openInfo(id, tripItem) {
    var p = BY[id]; if (!p) return; state.infoId = id; state.infoItem = tripItem || null;
    var t = tripItem ? trip(state.tripId) : null, it = tripItem && t ? findItem(t, tripItem) : null, owner = state.role === "owner", cta = "", extra = "", c = catOf(p), a = away(p), a2 = away(p, HUB2), tm = a ? fmtT(hrs(km(p, HUB))) : "";
    if (it) {
      var pend = it.removal && it.removal.status === "pending";
      if (pend) { extra = '<div class="reqbox"><b>' + esc(it.removal.by) + " đề nghị xóa · " + esc(it.removal.when) + "</b><p>" + esc(it.removal.reason) + "</p></div>"; cta = owner ? '<button class="btn ghost" type="button" data-resolve="keep:' + it.id + '">Giữ lại</button><button class="btn danger" type="button" data-resolve="del:' + it.id + '">Đồng ý xóa</button>' : '<button class="btn ghost" type="button" data-resolve="withdraw:' + it.id + '">Rút đề nghị</button><button class="btn ghost" type="button" data-act="closeSheet">Đóng</button>'; }
      else cta = (extra = itemSummary(it), "") + '<button class="btn ghost" type="button" data-daypick="' + it.id + '">' + ic("calendar-event") + 'Chọn ngày</button><button class="btn ' + (owner || it.addedBy === mb() ? "danger" : "ghost") + '" type="button" data-resolve="' + (owner || it.addedBy === mb() ? "del" : "ask") + ":" + it.id + '">' + (owner || it.addedBy === mb() ? "Xóa" : "Đề nghị xóa") + "</button>";
    } else if (state.view === "deck" && !state.decisions[id]) cta = '<button class="btn ghost" type="button" data-sheet="l">' + ic("x") + 'Bỏ qua</button><button class="btn" type="button" data-sheet="r">' + ic("check") + "Chọn nơi này</button>";
    var rate = p.rate, rcls = rate.label === "Nên ghé" ? "" : rate.label === "Đáng đi" ? "mid" : "low", ricon = rate.label === "Nên ghé" ? "rosette-discount-check" : rate.label === "Đáng đi" ? "heart" : "clock";
    panel.innerHTML = '<div class="gal cat-' + p.cat + '"><div class="gallery" id="gal" tabindex="0" aria-label="Ảnh của ' + esc(p.name) + '">' + p.photos.map(function (ph) { return '<img alt="' + esc(p.name) + '" src="' + ph.src + '">'; }).join("") + '</div>' + (p.photos.length > 1 ? '<button class="gnav prev" type="button" data-gal="-1" aria-label="Ảnh trước" disabled>' + ic("chevron-left", "l") + '</button><button class="gnav next" type="button" data-gal="1" aria-label="Ảnh sau">' + ic("chevron-left", "l").replace('class="ic l"', 'class="ic l" style="transform:rotate(180deg)"') + '</button><span class="gcount" id="gcount" aria-live="polite">1 / ' + p.photos.length + '</span><div class="dots" id="gdots">' + p.photos.map(function (_, k) { return '<i class="' + (k === 0 ? "on" : "") + '"></i>'; }).join("") + "</div>" : "") + '<button class="iconbtn close" type="button" data-act="closeSheet" aria-label="Đóng">' + ic("x") + "</button>" +
      '<span class="chip cat">' + ic(c.icon, "s") + c.name + '</span><button class="credit-btn" type="button" data-credit="sheet" aria-label="Nguồn ảnh">' + ic("info-circle") + "</button></div>" +
      '<div class="pp cat-' + p.cat + '"><div class="stack" style="gap:8px"><h2>' + esc(p.name) + '</h2><p class="note" style="display:flex;align-items:center;gap:6px">' + ic("map-pin", "s") + esc(p.area) + ", " + esc(DEST.name) + "</p></div>" + extra +
      '<div class="rate ' + rcls + '"><span class="ib">' + ic(ricon, "l") + "</span><span><b>" + esc(rate.label) + "</b><span>" + esc(rate.why) + "</span><small>Wander gợi ý. Ý kiến biên tập, bản nháp.</small></span></div>" +
      infoFacts(p, a, tm) +
      '<div><h4>' + ic("sparkles") + 'Có gì ở đây</h4><div class="chips">' + p.feat.map(function (f) { return '<span class="chip tint">' + ic("check", "s") + esc(f) + "</span>"; }).join("") + "</div></div>" +
      '<div><h4>' + ic("sun") + 'Nên đi buổi nào</h4><div class="tod">' + TOD.map(function (s) { var on = p.tod.slots.indexOf(s[0]) >= 0; return '<div class="' + (on ? "on" : "") + '">' + ic(s[2], "l") + s[1] + (on ? "<small>Nên đi</small>" : "") + "</div>"; }).join("") + '</div><p class="note" style="margin-top:8px">' + esc(p.tod.why) + "</p></div>" +
      '<div><h4>' + ic("calendar-event") + 'Mùa đẹp</h4><div class="months">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return '<i class="' + (p.months.indexOf(m) >= 0 ? "best" : "") + '">' + m + "</i>"; }).join("") + '</div></div>' +
      '<div><h4>' + ic("route") + 'Đường đi' + '</h4><div class="minimap tm-mini" id="mini-tm"></div><p class="note" style="margin-top:8px">' + (a2 != null && a2 < a * .6 ? "~" + a2 + " km từ " + HUB2.name + ". " : "") + 'Sơ đồ minh họa, không phải bản đồ. Đường núi thực tế có thể lâu hơn.</p></div>' +
      '<div class="tipbox"><h4 style="margin:0">' + ic("bulb") + "Mẹo</h4>" + p.tips.map(function (x) { return "<p>" + ic("check", "s") + esc(x) + "</p>"; }).join("") + "</div>" +
      '<div><h4>' + ic("info-circle") + 'Về nơi này</h4><p class="body clamp" id="abt">' + esc(p.extract || "Chưa có mô tả.") + '</p><button class="linkbtn" type="button" data-act="more">Xem thêm</button></div>' +
      (p.lat ? '<p class="body"><a href="https://www.openstreetmap.org/?mlat=' + p.lat + "&mlon=" + p.lon + "#map=13/" + p.lat + "/" + p.lon + '" target="_blank" rel="noopener noreferrer">Mở vị trí trên OpenStreetMap</a></p>' : "") +
      '<details><summary>Về dữ liệu</summary><div class="credits" style="margin-top:8px"><span>Ảnh lấy từ Wikimedia Commons theo giấy phép Creative Commons. Chạm biểu tượng ⓘ trên ảnh để xem tác giả. Mô tả lấy từ Wikipedia tiếng Việt (CC BY-SA 4.0). Khoảng cách và thời gian đi là ước tính. Nhãn gợi ý, mùa đẹp, buổi nên đi và mẹo là bản nháp biên tập của Wander. Biểu tượng: Tabler Icons (MIT).</span>' +
      p.photos.map(function (ph, k) { return "<span>Ảnh " + (k + 1) + ": " + esc(ph.artist || "Không rõ tác giả") + " · " + esc(ph.license) + ' · <a href="' + ph.source + '" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a></span>'; }).join("") + '<span><a href="https://vi.wikipedia.org/wiki/' + encodeURIComponent(p.wikipedia.replace(/ /g, "_")) + '" target="_blank" rel="noopener noreferrer">Bài Wikipedia: ' + esc(p.wikipedia) + "</a></span></div></details></div>" + (cta ? '<div class="cta-bar">' + cta + "</div>" : "");
    showSheet(false, true); wireGallery(p.photos.length); mountMiniMap(p);
  }
  function galIndex() { var g = $("gal"); return g ? Math.round(g.scrollLeft / Math.max(1, g.clientWidth)) : 0; }
  function galGo(delta) { var g = $("gal"); if (!g) return; var n = g.children.length, i = Math.max(0, Math.min(n - 1, galIndex() + delta)); g.scrollTo({ left: i * g.clientWidth, behavior: reduce ? "auto" : "smooth" }); }
  function wireGallery(n) {
    var g = $("gal"); if (!g || n < 2) return;
    function sync() { var i = galIndex(), c = $("gcount"), dots = $("gdots"), pv = panel.querySelector(".gnav.prev"), nx = panel.querySelector(".gnav.next"), pl = panel.querySelector(".credit-pill");
      if (c) c.textContent = (i + 1) + " / " + n; if (dots) [].forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === i); });
      if (pv) pv.disabled = i === 0; if (nx) nx.disabled = i === n - 1; if (pl) pl.remove(); }
    g.addEventListener("scroll", sync, { passive: true });
    var sx = 0, sl = 0, down = false;
    g.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") { down = true; sx = e.clientX; sl = g.scrollLeft; g.style.scrollSnapType = "none"; g.setPointerCapture(e.pointerId); } });
    g.addEventListener("pointermove", function (e) { if (down) g.scrollLeft = sl - (e.clientX - sx); });
    function up() { if (!down) return; down = false; g.style.scrollSnapType = ""; g.scrollTo({ left: galIndex() * g.clientWidth, behavior: "auto" }); }
    g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
  }
  function openDayPicker(itemId) {
    var t = trip(state.tripId), it = findItem(t, itemId), ds = days(t);
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Xếp «' + esc(itemName(it)) + '» vào ngày nào?</h2></div><div class="daylist"><button type="button" data-assign="' + itemId + ':0"' + (!it.day ? ' aria-current="true"' : "") + "><span>Chưa có ngày</span></button>" + ds.map(function (d, k) { return '<button type="button" style="--tc:' + dayColor(k) + '" data-assign="' + itemId + ":" + (k + 1) + '"' + (it.day === d ? ' aria-current="true"' : "") + "><span>Ngày " + (k + 1) + "</span><span>" + dayName(d) + "</span></button>"; }).join("") + "</div></div>"; showSheet();
  }
  /* gỡ thành viên (G8, DG-2 A9, 1b, KHUNG): hệ quả là ĐỀ XUẤT, chưa là quyết định (Q6–Q9 còn mở) */
  function memberList(t) {
    var others = members(t).filter(function (n) { return n !== "Bạn"; });
    return '<div class="seccard"><h2 class="h2">Người đi cùng (' + others.length + ')</h2>' + (others.length ? '<ul class="who" aria-label="Người đi cùng">' + others.map(function (n) { return "<li>" + avatar(n) + "<span>" + esc(n) + '</span><button class="btn ghost" type="button" data-act="rmMember:' + esc(n) + '" aria-label="Gỡ ' + esc(n) + ' khỏi chuyến đi">Gỡ</button></li>'; }).join("") + "</ul>" : '<p class="note">Chưa có ai vào chuyến đi bằng liên kết.</p>') + (t.removed && t.removed.length ? '<p class="note">Đã gỡ: ' + t.removed.map(esc).join(", ") + ".</p>" : "") + "</div>";
  }
  function openRmMember(name) {
    panel.innerHTML = '<div class="pp"><div><span class="pill warn" style="display:inline-block;margin-bottom:8px">BẢN THỬ 1b · đề xuất, chưa là quyết định</span><h2 style="font-size:26px">Gỡ «' + esc(name) + '» khỏi chuyến đi?</h2></div><p class="note">Các điểm dưới đây là <b>đề xuất</b> để PO xem, chưa phải cách Wander sẽ làm.</p><ul class="wzsum"><li>(Đề xuất) ' + esc(name) + ' sẽ không mở được chuyến đi này nữa; cách chặn việc vào lại bằng liên kết do phần nhóm (1b) quyết.</li><li>(Đề xuất) Mục ' + esc(name) + ' đã thêm vẫn ở lại chuyến đi; bạn có thể xóa từng mục.</li><li>(Đề xuất) Đề nghị xóa ' + esc(name) + ' đang gửi (nếu có) bị hủy.</li><li>Trong bản thử, gỡ nhầm thì bấm Hoàn tác ngay sau đó.</li></ul><div class="stack"><button class="btn danger block" type="button" data-act="rmMemberYes:' + esc(name) + '">Gỡ ' + esc(name) + '</button><button class="btn ghost block" type="button" data-act="closeSheet">Hủy</button></div></div>';
    var lf1 = sheet.hidden ? null : lastFocus; showSheet(); if (lf1) lastFocus = lf1;
  }
  function rmMember(name) {
    var t = trip(state.tripId); if (!t || state.role !== "owner") return;   // chỉ người tạo gỡ được (đề xuất, Q6–Q9 còn mở)
    var cancelled = [];
    t.items.forEach(function (i) { if (i.removal && i.removal.by === name && i.removal.status === "pending") { cancelled.push([i, i.removal]); i.removal = null; } });
    t.removed = (t.removed || []).concat([name]); var wasMember = state.role === "member"; if (wasMember) state.role = "owner";
    save(); closeSheet(); render();
    toast("Đã gỡ " + name + " khỏi chuyến đi.", function () { t.removed = t.removed.filter(function (n) { return n !== name; }); cancelled.forEach(function (c) { c[0].removal = c[1]; }); if (wasMember) state.role = "member"; save(); render(); });
  }
  function openShare() {
    var t = trip(state.tripId);
    panel.innerHTML = '<div class="pp"><div><h2>Mời người đi cùng</h2><p class="note" style="margin-top:6px">Thành viên thêm địa điểm thì tự vào chuyến đi. Muốn xóa phải gửi đề nghị để bạn duyệt.</p></div>' +
      (t.shared ? '<div class="sharebox" id="lnk">https://wander.example/t/' + (t.link || t.id) + '</div><button class="btn block" type="button" data-act="copy">' + ic("share-2") + 'Sao chép liên kết</button><button class="btn ghost block" type="button" data-act="unshare">Tắt chia sẻ</button><div class="protobox"><b>BẢN THỬ 1b</b><button class="btn ghost" type="button" data-act="protoJoin">Giả lập: người được mời mở liên kết</button><button class="btn ghost" type="button" data-act="protoJoinOff">Giả lập: mở liên kết đã tắt</button></div>' : '<button class="btn block" type="button" data-act="doshare">Bật liên kết mời</button>') + '' + (t.shared && state.role === "owner" ? memberList(t) : "") + '<div class="seccard"><h2 class="h2">Lưu hoặc gửi lịch trình</h2><p class="note">Bản chỉ để xem, không cần mời ai.</p><div class="row"><button class="btn ghost" type="button" data-act="exportStub" data-what="Ảnh">Ảnh</button><button class="btn ghost" type="button" data-act="exportStub" data-what="PDF">PDF</button><button class="btn ghost" type="button" data-act="exportStub" data-what="Lịch">Thêm vào lịch</button></div></div><p class="note">Bản thử, thiết kế cho Lát 1b: liên kết chỉ để minh họa.</p></div>'; showSheet();
  }
  function renameMember(from, to) {
    state.trips.forEach(function (t) {
      function fix(i) { if (i.addedBy === from) i.addedBy = to; if (i.removal && i.removal.by === from) i.removal.by = to; if (i.done && from in i.done) { i.done[to] = i.done[from]; delete i.done[from]; } }
      t.items.forEach(fix); (t.trash || []).forEach(function (e) { if (e.by === from) e.by = to; fix(e.item); });
    });
  }
  function cleanName(s) { return String(s || "").normalize("NFC").replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g, "").replace(/\s+/g, " ").trim(); }
  function nameKey(s) { return noAccent(cleanName(s)).replace(/[^a-z0-9]/g, ""); }   // "Bạn", "Ban", "BẠN.", "B a n" cùng một khóa
  function allMembers() { var seen = []; state.trips.forEach(function (t) { members(t).forEach(function (m) { if (seen.indexOf(m) < 0) seen.push(m); }); }); return seen; }
  function openJoin() {
    var t = trip(state.tripId);
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Bạn được mời vào «' + esc(t.name) + '»</h2><p class="note" style="margin-top:6px">Chuyến đi của người tạo · ' + dateRange(t) + " · " + countText(t) + '</p></div>' +
      '<ul class="rights"><li>' + ic("check", "s") + 'Xem lịch và bản đồ của cả chuyến</li><li>' + ic("check", "s") + 'Thêm địa điểm, mục tự vào chuyến</li><li>' + ic("check", "s") + 'Tự tích việc cần làm của riêng bạn</li><li>' + ic("clock", "s") + 'Xóa mục của người khác: gửi đề nghị, người tạo duyệt</li></ul>' +
      '<label class="field"><span>Tên hiển thị</span><input id="j-name" maxlength="40" autocomplete="off" value="' + esc(state.memberName || "") + '" placeholder="Tên bạn muốn mọi người thấy" aria-describedby="j-help"></label><p class="note" id="j-help">Không cần tài khoản. Tên chỉ hiện trong chuyến này để mọi người nhận ra bạn.</p><div id="j-warn" aria-live="polite"></div>' +
      '<div class="stack"><button class="btn block" type="button" data-act="joinGo">Vào chuyến</button><button class="btn ghost block" type="button" data-act="closeSheet">Để sau</button></div><p class="note">Bản thử, thiết kế cho Lát 1b.</p></div>'; showSheet();
  }
  function openJoinOff() {
    panel.innerHTML = '<div class="pp"><div><h2 style="font-size:26px">Liên kết này không còn dùng được</h2></div><div class="warnbox" role="alert">Người tạo chuyến đã tắt liên kết mời. Hãy nhờ họ gửi liên kết mới.</div><div class="stack"><button class="btn block" type="button" data-act="closeSheet">Đã hiểu</button></div><p class="note">Bản thử, thiết kế cho Lát 1b.</p></div>'; showSheet();
  }
  function joinGo() {
    var name = cleanName($("j-name").value), w = $("j-warn"), key = nameKey(name), clash = ["ban", "nguoitao", "toi", "chuchuyen"].indexOf(key) >= 0 || allMembers().some(function (m) { return nameKey(m) === key && m !== mb(); });
    if (!key) { w.innerHTML = '<div class="warnbox" role="alert">Hãy nhập tên (chữ hoặc số) để mọi người nhận ra bạn.</div>'; $("j-name").focus(); return; }
    if (clash) { w.innerHTML = '<div class="warnbox" role="alert">Tên này đã được dùng hoặc dành riêng. Hãy chọn tên khác.</div>'; $("j-name").focus(); return; }
    if (name !== mb()) { renameMember(mb(), name); state.memberName = name; }
    state.role = "member"; closeSheet(); save(); render(); toast("Chào " + name + "! Bạn đã vào chuyến.");
  }
  function openReview() { var t = trip(state.tripId); reviewList = pendingOf(t).map(function (i) { return i.id; }); if (reviewList.length) drawReview(); }
  function reviewDecide(itemId, dir) {
    var t = trip(state.tripId), it = findItem(t, itemId); reviewList = reviewList.filter(function (x) { return x !== itemId; });
    if (it) { if (dir === "r") { it.removal.status = "rejected"; toast("Giữ lại «" + itemName(it) + "»", function () { it.removal.status = "pending"; save(); render(); }); } else { trashItem(t, it); } }
    save(); drawReview();
  }
  function drawReview() {
    var t = trip(state.tripId), list = reviewList.map(function (id) { return findItem(t, id); }).filter(Boolean);
    if (!list.length) { closeSheet(); render(); return; }
    var cards = list.slice(0, 3).map(function (it, i) { var p = placeOf(it) || pseudoPlace(it), oo = { aria: "Quẹt phải để giữ lại, quẹt trái để đồng ý xóa.", rLabel: "GIỮ", lLabel: "XÓA", banner: '<div class="banner-top"><b>' + esc(it.removal.by) + " đề nghị xóa · " + esc(it.removal.when) + "</b>" + esc(it.removal.reason) + "</div>" }; return cardHtml(p, i, oo).replace('data-id="' + p.id + '"', 'data-id="' + it.id + '" data-place="' + p.id + '"'); }).reverse().join("");
    panel.innerHTML = '<div class="deckbar pad-x" style="padding-top:18px"><button class="iconbtn" type="button" data-act="closeSheet" aria-label="Đóng" style="background:var(--surface)">' + ic("x") + '</button><div class="mid"><h1>Đề nghị xóa</h1><p class="note">Còn ' + list.length + ' · quẹt phải giữ lại, quẹt trái xóa</p></div><span></span></div>' +
      '<div class="deckwrap pad-x"><div class="deck">' + cards + '</div><div class="actions"><div class="act"><button class="round l" type="button" data-act="rdel" aria-label="Đồng ý xóa">' + ic("trash") + "</button>Xóa</div>" + '<div class="act"><button class="round r" type="button" data-act="rkeep" aria-label="Giữ lại">' + ic("check") + "</button>Giữ lại</div></div></div>";
    showSheet(true); attachDrag(panel.querySelector(".card.front"), reviewDecide, { noTap: true });
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go],[data-act],[data-info],[data-unpick],[data-trip],[data-assign],[data-role],[data-item-open],[data-resolve],[data-daypick],[data-sheet],[data-mode],[data-dtab],[data-guide],[data-pack],[data-cat],[data-catgo],[data-tpl],[data-style],[data-pace],[data-wz-kind],[data-wz-int],[data-route-day],[data-export-kind],[data-credit],[data-gal]");
    if (!t) { if (e.target === sheet) { if (issueLocked()) toast(panel.querySelector("#savedcode") ? "Bấm Xong khi bạn đã lưu mã." : "Mã mới chưa có hiệu lực. Dùng nút Hủy nếu muốn thoát."); else closeSheet(); } return; }
    var d = t.dataset;
    if (d.go) { state.addTripId = null; if (d.go !== "security") state.recovered = false; go(d.go); return; }
    if (d.info) { openInfo(d.info); return; }
    if (d.unpick) { delete state.decisions[d.unpick]; state.history = state.history.filter(function (h) { return h !== d.unpick; }); save(); render(); return; }
    if (d.trip) { state.role = "owner"; go("trip", { tripId: d.trip, dayTab: "ov" }); return; }
    if (d.exportKind) { state.exportKind = d.exportKind; save(); render(); return; }
    if (d.routeDay) { state.dayTab = d.routeDay; state.sortMode = false; save(); render(); return; }
    if (d.dtab) { state.dayTab = d.dtab; state.sortMode = false; save(); render(); return; }
    if (d.role) { state.role = d.role; save(); render(); return; }
    if (d.guide) { state.guide = state.guide === d.guide ? null : d.guide; save(); var sv = screen.scrollTop; render(); screen.scrollTop = sv; return; }
    if (d.pack) { state.pack[d.pack] = !state.pack[d.pack]; save(); t.setAttribute("aria-pressed", !!state.pack[d.pack]); return; }
    if (d.cat) { state.cat = d.cat; save(); render(); return; }
    if (d.tpl) { var tp = UI.TEMPLATES.filter(function (x) { return x.id === d.tpl; })[0]; if (tp) createFromTemplate(tp); return; }
    if (d.catgo) { state.cat = d.catgo; state.addTripId = null; go("deck"); return; }   // từ trang chủ: quẹt riêng một loại
    if (d.gal) { galGo(Number(d.gal)); return; }
    if (d.style) { var ix = pickStyles.indexOf(d.style); if (ix >= 0) pickStyles.splice(ix, 1); else if (pickStyles.length < 5) pickStyles.push(d.style); else toast("Chọn tối đa 5 phong cách."); t.setAttribute("aria-pressed", pickStyles.indexOf(d.style) >= 0); panel.querySelectorAll("[data-style]").forEach(function (b) { b.setAttribute("aria-pressed", pickStyles.indexOf(b.dataset.style) >= 0); }); return; }
    if (d.wzKind) { wz.kind = wz.kind === d.wzKind ? null : d.wzKind; panel.querySelectorAll("[data-wz-kind]").forEach(function (b) { b.setAttribute("aria-pressed", wz.kind === b.dataset.wzKind); }); return; }
    if (d.wzInt) { var wi = wz.interests.indexOf(d.wzInt); if (wi >= 0) wz.interests.splice(wi, 1); else wz.interests.push(d.wzInt); t.setAttribute("aria-pressed", wi < 0); return; }
    if (d.pace) { pickPace = pickPace === d.pace ? null : d.pace; panel.querySelectorAll("[data-pace]").forEach(function (b) { b.setAttribute("aria-pressed", pickPace === b.dataset.pace); }); return; }
    if (d.credit) {
      var host = d.credit === "card" ? t.closest(".card") : t.closest(".gal"), old = host.querySelector(".credit-pill"); if (old) { old.remove(); return; }
      var pidv = d.credit === "card" ? pid(host) : state.infoId, p = BY[pidv || ""]; var idx = 0;
      if (d.credit === "card") idx = state.photo[p.id] || 0; else { var g = $("gal"); idx = Math.round(g.scrollLeft / Math.max(1, g.clientWidth)); p = BY[state.infoId]; }
      var pl = document.createElement("div"); pl.className = "credit-pill"; pl.innerHTML = credit(p, idx); host.appendChild(pl); setTimeout(function () { if (pl.parentNode) pl.remove(); }, 6000); return;
    }
    if (d.mode) { saveMode = d.mode; panel.querySelectorAll(".opt").forEach(function (o) { var on = o.dataset.mode === saveMode; o.classList.toggle("on", on); o.setAttribute("aria-checked", on); }); return; }
    var tr = trip(state.tripId);
    if (d.itemOpen) { if (t.dataset.moved) return; var it = findItem(tr, d.itemOpen); if (!it.placeId) { openItemEditor(it.id); return; } openInfo(it.placeId, it.id); return; }
    if (d.assign) { var a = d.assign.split(":"); closeSheet(); assignDay(tr, findItem(tr, a[0]), Number(a[1])); return; }
    if (d.daypick) { openDayPicker(d.daypick); return; }
    if (d.resolve) { var r = d.resolve.split(":"), it3 = findItem(tr, r[1]); closeSheet(); if (r[0] === "keep") resolveRequest(tr, it3, true); else if (r[0] === "del") removeItem(tr, it3, true); else if (r[0] === "ask") removeItem(tr, it3, false); else if (r[0] === "withdraw") { it3.removal = null; save(); render(); toast("Đã rút đề nghị."); } return; }
    if (d.sheet) { var c = screen.querySelector(".card.front"); if (c) { closeSheet(); fling(c, d.sheet, function () { decide(c.dataset.id, d.sheet); }); } return; }
    if (d.act) {
      var ap = d.act.split(":");
      if (ap[0] === "newItem") { openItemEditor(null, ap[1]); return; }
      if (ap[0] === "editItem") { openItemEditor(ap[1]); return; }
      if (ap[0] === "reqSend") { sendRequest(ap[1]); return; }
      if (ap[0] === "move") { moveItem(ap[1], ap[2]); return; }
      if (ap[0] === "task") { toggleTask(ap[1]); return; }
      if (ap[0] === "theme") { state.theme = ap[1] === "dark" || ap[1] === "system" ? ap[1] : "light"; save(); applyTheme(); render(); announce("Đã chọn giao diện " + (state.theme === "dark" ? "tối" : state.theme === "system" ? "theo hệ thống" : "sáng")); return; }
      if (ap[0] === "errGo") { closeSheet(); go(ap[1]); return; }
      if (ap[0] === "rmMember") { openRmMember(ap[1]); return; }
      if (ap[0] === "rmMemberYes") { rmMember(ap[1]); return; }
      if (ap[0] === "simErr") { showError(ap[1]); return; }
      if (ap[0] === "expBranch") { state.expiredBranch = ap[1]; save(); render(); return; }
      if (ap[0] === "todaySim") { todaySim(ap[1] === undefined ? "" : ap[1]); return; }
      if (ap[0] === "restore") { var tt = trip(state.tripId), ee = (tt.trash || []).filter(function (x) { return x.id === ap[1]; })[0]; if (ee) restoreItem(tt, ee); return; }
      if (ap[0] === "purge") { askPurge(ap[1]); return; }
      if (ap[0] === "purgeYes") { doPurge(ap[1]); return; }
      if (ap[0] === "reauthMode") { reauth.mode = ap[1]; reauth.sent = false; reauth.denied = false; drawReauth(); return; }
      if (ap[0] === "recMode") { recov.mode = ap[1]; recov.expired = false; renderRecover(); return; }
      if (ap[0] === "revoke") { openRevoke(ap[1]); return; }
      if (ap[0] === "revokeYes") { state.identity.devices = state.identity.devices.filter(function (x) { return x.id !== ap[1]; }); state.recovered = false; logEvent("Đã thu hồi một thiết bị"); syncServerFromState(); save(); closeSheet(); render(); toast("Đã thu hồi thiết bị."); return; }
      if (ap[0] === "book") { itemDraft.booking = ap[1]; panel.querySelectorAll('[data-act^="book:"]').forEach(function (bb) { bb.setAttribute("aria-pressed", bb.dataset.act === "book:" + ap[1]); }); return; }
    }
    switch (d.act) {
      case "undo": undo(); break;
      case "addItem": openAddItem(); break;
      case "protoConflict": openConflict(); break;
      case "conflictReload": closeSheet(); render(); toast("Đã tải bản mới nhất."); break;
      case "idSkip": codeCtx = { purpose: "first", pendingIdentity: { code: null, created: Date.now(), devices: [{ id: uid(), name: "Thiết bị này", current: true, at: Date.now() }] }, onDone: idCtx.done }; finishIssue(true); break;
      case "idCreate": var idn0 = { code: null, created: Date.now(), devices: [{ id: uid(), name: "Thiết bị này", current: true, at: Date.now() }] }, dn = idCtx.done; openIssueCode({ purpose: "first", pendingIdentity: idn0, onDone: dn }); break;
      case "regenCode": openReauth("Tạo mã khôi phục mới", "Mã cũ vẫn dùng được cho tới khi bạn xác nhận mã mới.", function (viaCode) { if (viaCode) { render(); toast("Đã đổi mã khôi phục."); } else openIssueCode({ purpose: "regen", onDone: function () { render(); toast("Đã đổi mã khôi phục."); } }); }); break;
      case "issueNow": openIssueCode({ purpose: "first", onDone: function () { render(); toast("Đã tạo mã khôi phục."); } }); break;
      case "protoPair": state.pairing = { code: pairCode(), at: Date.now(), name: "Máy tính mới", region: "Hà Nội" }; save(); render(); break;
      case "pairApprove": pairApprove(); break;
      case "pairYes": var pp = state.pairing; state.identity.devices.push({ id: uid(), name: pp.name || "Thiết bị mới", current: false, at: Date.now() }); logEvent("Đã thêm «" + (pp.name || "Thiết bị mới") + "» bằng mã ghép"); state.pairing = null; pairTries = 0; syncServerFromState(); save(); closeSheet(); render(); toast("Đã duyệt thiết bị mới."); break;
      case "pairNo": state.pairing = null; logEvent("Đã từ chối một yêu cầu ghép thiết bị"); save(); closeSheet(); render(); toast("Đã từ chối."); break;
      case "protoRemote": logEvent("Một thiết bị khác vừa khôi phục chuyến đi bằng mã khôi phục", true); save(); render(); break;
      case "recCode": recoverWithCode(); break;
      case "recPair": recov.pair = { code: pairCode(), at: Date.now() }; recov.expired = false; renderRecover(); break;
      case "recApprove": recoverWithDevice(); break;
      case "recExpire": recov.pair = null; recov.expired = true; renderRecover(); break;
      case "reauthSend": reauth.sent = true; reauth.denied = false; drawReauth(); break;
      case "reauthApprove": var okd = reauth.onOk; reauth = null; okd(false); break;
      case "reauthDeny": reauth.sent = false; reauth.denied = true; drawReauth(); break;
      case "reauthCode": reauthWithCode(); break;
      case "issueFirst": var back = reauth; openIssueCode({ purpose: "first", onDone: function () { reauth = back; drawReauth(); } }); break;
      case "codeDone": codeDone(); break;
      case "codeDownload": codeDownload(codeCtx.newCode); break;
      case "codePrint": codePrint(codeCtx.newCode); break;
      case "codeCopy": try { navigator.clipboard.writeText(codeCtx.newCode).then(function () { toast("Đã sao chép mã. Dán vào nơi an toàn rồi xóa khỏi bộ nhớ tạm của máy."); }, function () { toast("Không sao chép tự động được, hãy chép tay."); }); } catch (er2) { toast("Không sao chép tự động được, hãy chép tay."); } break;
      case "codeNext": codeCtx.step = 2; drawIssue(); break;
      case "codeBack": codeCtx.step = 1; drawIssue(); break;
      case "codeCancel": codeCtx = null; closeSheet(); break;
      case "codeSkip": finishIssue(true); break;   // PO 26/10/2026: để sau thì đi tiếp ngay, cảnh báo nhẹ một dòng (không hộp xác nhận)
      case "codeConfirm": if (codeCtx.attempt && Date.now() > codeCtx.attempt.expires) { codeCtx = null; closeSheet(); renderRecover(); toast("Lần thử đã hết hạn. Hãy bắt đầu lại; mã mới vừa hiện không còn hiệu lực."); break; } if (codeNorm($("c-re").value) === codeNorm(codeCtx.newCode)) finishIssue(false); else { $("c-warn").innerHTML = '<div class="warnbox" role="alert">Mã nhập lại chưa khớp. Kiểm tra từng nhóm ký tự hoặc quay lại xem mã.</div>'; $("c-re").focus(); } break;
      case "saveItem": saveItem(); break;
      case "sortToggle": state.sortMode = !state.sortMode; save(); render(); var stg = screen.querySelector('[data-act="sortToggle"]'); if (stg) stg.focus(); break;
      case "restart": PLACES.forEach(function (p) { if (state.decisions[p.id] === "skip") delete state.decisions[p.id]; }); state.history = []; save(); render(); break;
      case "like": swipeTop("r", decide); break;
      case "skip": swipeTop("l", decide); break;
      case "info": var cc = screen.querySelector(".card.front"); if (cc) openInfo(cc.dataset.id); break;
      case "create": openCreate(); break;
      case "openMap": openMapSheet(); break;
      case "wizard": openWizard(); break;
      case "wzNext": wzRead(); var we = wzError(); if (we) { drawWizard(we); break; } if (wz.step === WZ_STEPS.length - 1) wzCreate(); else { wz.step++; drawWizard(""); } break;
      case "wzBack": wzRead(); if (wz.step > 0) { wz.step--; drawWizard(""); } break;
      case "doCreate": doCreate(); break;
      case "closeSheet": closeSheet(); if (state.view === "trip") render(); break;
      case "obNext": if (obStep < OB.length - 1) { obStep++; paintOnboard(); } else obDone(); break;
      case "obBack": if (obStep > 0) { obStep--; paintOnboard(); } break;
      case "obSkip": obDone(); break;
      case "replayIntro": obStep = 0; go("onboard"); break;
      case "simExpire": state.expiredBranch = null; go("expired"); break;
      case "saveDevName": var dn0 = $("st-dev").value.trim(); if (!dn0) { toast("Hãy nhập tên thiết bị."); break; } state.identity.devices.forEach(function (d) { if (d.current) d.name = dn0; }); syncServerFromState(); save(); toast("Đã lưu tên thiết bị."); break;
      case "more": var ab = $("abt"); ab.classList.toggle("clamp"); t.textContent = ab.classList.contains("clamp") ? "Xem thêm" : "Thu gọn"; break;
      case "shareSheet": openShare(); break;
      case "clearSearch": var qi = $("q"); qi.value = ""; drawExplore(""); qi.focus(); break;
      case "protoJoin": openJoin(); break;
      case "protoJoinOff": openJoinOff(); break;
      case "joinGo": joinGo(); break;
      case "exportStub": closeSheet(); state.exportKind = d.what; go("export"); break;
      case "doshare": tr.shared = true; tr.link = newLink(); save(); openShare(); break;
      case "unshare": tr.shared = false; tr.link = null; save(); closeSheet(); render(); toast("Đã tắt chia sẻ."); break;
      case "copy": try { navigator.clipboard.writeText($("lnk").textContent).then(function () { toast("Đã sao chép liên kết."); }, function () { toast("Không sao chép tự động được, hãy chép tay."); }); } catch (er) { toast("Không sao chép tự động được, hãy chép tay."); } break;
      case "review": openReview(); break;
      case "rdel": case "rkeep": var rc = panel.querySelector(".card.front"); if (rc) fling(rc, d.act === "rkeep" ? "r" : "l", function () { reviewDecide(rc.dataset.id, d.act === "rkeep" ? "r" : "l"); }); break;
      case "addMore": closeSheet(); state.skipped = []; state.addTripId = tr.id; go("deck"); break;
      case "autoPlan": openAutoPlan(); break;
      case "applyPlan": applyPlan(); break;
      case "addToDay": openAddToDay(); break;
      case "doAddToDay": var kk = Number(state.dayTab), picks = panel.querySelectorAll("[data-pick]:checked"), dsx = days(tr), snapA = snapshot(tr); if (!picks.length) { toast("Hãy chọn ít nhất một địa điểm."); break; } picks.forEach(function (cb) { var it4 = findItem(tr, cb.dataset.pick); it4.day = dsx[kk - 1]; it4.ord = null; }); closeSheet(); save(); render(); toast("Đã thêm " + picks.length + " địa điểm vào Ngày " + kk, function () { restore(tr, snapA); save(); render(); }); break;
      case "editTrip": openEditTrip(); break;
      case "doEdit": doEdit(); break;
    }
  });
  
  /* ảnh lỗi (mạng yếu, nguồn Wikimedia chậm hoặc sập): khung giữ nguyên, nền màu thay cho ảnh, chữ vẫn đọc được */
  document.addEventListener("error", function (e) { var im = e.target; if (im && im.tagName === "IMG" && !im.dataset.failed) { im.dataset.failed = "1"; im.removeAttribute("srcset"); im.classList.add("imgfail"); im.src = BLANK; } }, true);
  var BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";   // ảnh trong suốt 1×1: bỏ biểu tượng ảnh vỡ của trình duyệt, để nền màu hiện ra
  [].forEach.call(document.images, function (im) { if (im.complete && !im.naturalWidth && im.getAttribute("src") && !im.dataset.failed) { im.dataset.failed = "1"; im.classList.add("imgfail"); im.src = BLANK; } });   // ảnh đã hỏng trước khi bộ lắng nghe này được gắn
  document.addEventListener("input", function (e) { if (e.target.type === "date") hintDates(panel); if (/^(i-cost|i-ref|s-budget)$/.test(e.target.id)) hintMoney(panel); });
  document.addEventListener("change", function (e) {
    if (e.target.id === "i-inc") { $("i-ref-wrap").hidden = !e.target.checked; return; }
    if (e.target.id === "i-type") { $("i-priced").hidden = plainType(e.target.value); itemDraft.okClear = false; return; }
    if (e.target.id === "w-tent") { $("w-n-wrap").hidden = !e.target.checked; $("w-end").closest("label").hidden = e.target.checked; return; }
    if (e.target.id !== "s-tent") return;
    $("s-n-wrap").hidden = !e.target.checked; var endIn = $("s-end"); if (endIn) endIn.closest("label").hidden = e.target.checked;
  });
  document.addEventListener("keydown", function (e) {
    if (!sheet.hidden) { if (e.key === "Tab" && !sheet.classList.contains("drawer")) trapTab(e); if (e.key === "Escape") { if (issueLocked()) toast(panel.querySelector("#savedcode") ? "Bấm Xong khi bạn đã lưu mã." : "Mã mới chưa có hiệu lực. Dùng nút Hủy nếu muốn thoát."); else closeSheet(); } else if ($("gal") && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); galGo(e.key === "ArrowRight" ? 1 : -1); } return; }
    if (state.view !== "deck") return;
    if (e.key === "ArrowRight") { e.preventDefault(); swipeTop("r", decide); } else if (e.key === "ArrowLeft") { e.preventDefault(); swipeTop("l", decide); }
    else if (e.key === "ArrowUp") { e.preventDefault(); var c = screen.querySelector(".card.front"); if (c) openInfo(c.dataset.id); } else if (e.key === "Backspace" || e.key === "z") undo();
  });
  ["(min-width: 768px)", "(min-width: 1280px)"].forEach(function (q) {
    window.matchMedia(q).addEventListener("change", function () {
      var info = !sheet.hidden && $("gal") ? state.infoId : null;
      if (info) { closeSheet(); render(); openInfo(info, state.infoItem); } else render();
    });
  });
  if (FRESH && !state.onboarded && !/[?&]intro=0(&|$)/.test(location.search)) state.view = "onboard";   // người mới hoàn toàn thấy giới thiệu trước; ?fresh=1&intro=0 bỏ qua (dùng cho luồng thử khác)
  if ((state.view === "trip" || state.view === "trash" || state.view === "today" || state.view === "export") && !trip(state.tripId)) state.view = "explore";
  if (state.view === "settings" || state.view === "expired") state.view = "trips";
  if (state.view === "deck" && state.addTripId && !trip(state.addTripId)) state.addTripId = null;
  render();
})();
