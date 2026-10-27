/* Định dạng hiển thị dùng chung (prototype và, sau DG-1, mã web thật phải cho cùng kết quả).
   Tiền: đầy đủ VND, dấu chấm hàng nghìn, khoảng trắng KHÔNG ngắt trước ₫ (D17). Ngày: dd/mm/yyyy (ô ngày gốc hiển thị theo hệ điều hành). */
(function () {
  var NBSP = ' ';
  var WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  function money(vnd) {
    var n = Math.round(Number(vnd));
    if (!isFinite(n)) return '';
    return String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + NBSP + '₫';
  }
  /** Nghìn đồng (đơn vị nhập liệu, D17) -> "150 = 150.000 ₫" xem trước. */
  function moneyFromK(k) { return money(Number(k) * 1000); }
  function parts(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? { y: m[1], m: m[2], d: m[3] } : null; }
  function dateVi(iso) { var p = parts(iso); return p ? p.d + '/' + p.m + '/' + p.y : ''; }
  function dayLabel(iso) { var p = parts(iso); if (!p) return ''; var d = new Date(Date.UTC(+p.y, +p.m - 1, +p.d)); return WD[d.getUTCDay()] + ' ' + p.d + '/' + p.m; }
  function hydrate(root) {
    (root || document).querySelectorAll('[data-money]').forEach(function (el) { el.textContent = money(el.getAttribute('data-money')); });
    (root || document).querySelectorAll('[data-date-for]').forEach(function (el) {
      var input = document.getElementById(el.getAttribute('data-date-for'));
      var upd = function () { el.textContent = input && input.value ? dayLabel(input.value).split(' ')[0] + ', ' + dateVi(input.value) : ''; };
      if (input) { input.addEventListener('input', upd); upd(); }
    });
  }
  window.WF = { money: money, moneyFromK: moneyFromK, dateVi: dateVi, dayLabel: dayLabel, hydrate: hydrate };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hydrate(); });
  else hydrate();
})();
