/* Staff view for the members-booking DEMO. Same-browser localStorage only (jk-members-demo-v1). Not linked from public pages. */
(function () {
  'use strict';
  var KB = 'jk-members-demo-v1', KR = KB + '-rev', KL = 'jk-members-staff-lang';
  var STEAMERS = ['A', 'B', 'C'], OPEN = 10 * 60, CLOSE = 19 * 60, STEP = 15, RATE = 400, PENALTY = 200;
  var T = {
    en: { bar: 'Class demo staff view — browser-local only. Bookings appear here only if made in THIS browser. Not linked from the public site. No real data.', brand: 'Members bookings (staff · DEMO)', kicker: 'STAFF · DEMO', h1: 'All member bookings', local: 'This page reads the same localStorage as the member demo. Open the member page in another tab of this browser to book; this view updates automatically.', dateL: 'Date (JST)', refresh: 'Refresh', occH: 'Occupancy (this day)', listH: 'Bookings (this day)', foot: 'DEMO · not the queue staff page · no money collected', steamer: 'Steamer', booked: 'Booked', cancelled: 'Cancelled', member: 'Demo Subscriber', rent: 'Steamer fee', ex: 'EXAMPLE cancel/no-show', none: 'No bookings for this day.', cntAll: 'All: {n}', cntBooked: 'Booked: {n}', cntCanc: 'Cancelled: {n}', cntOpen: 'Open slots: {n}', free: 'Free' },
    ja: { bar: '授業用デモのスタッフ画面 — このブラウザ内のみ。このブラウザで会員デモから予約したものだけが表示されます。公開ページからはリンクされていません。実データはありません。', brand: '会員予約一覧（スタッフ · DEMO）', kicker: 'スタッフ · DEMO', h1: '会員の予約一覧', local: 'このページは会員デモと同じ localStorage を読みます。別タブで会員ページから予約すると、ここに自動で反映されます。', dateL: '日付（日本時間）', refresh: '更新', occH: '空き状況（当日）', listH: '予約一覧（当日）', foot: 'DEMO · 順番待ちスタッフ画面ではありません · 請求なし', steamer: '釜', booked: '予約済', cancelled: 'キャンセル済', member: 'デモ会員', rent: '釜の使用料', ex: 'キャンセル・無断不参加料の例', none: 'この日の予約はありません。', cntAll: 'すべて: {n}', cntBooked: '予約済: {n}', cntCanc: 'キャンセル: {n}', cntOpen: '空き枠: {n}', free: '空き' }
  };
  var lang = 'en'; try { lang = localStorage.getItem(KL) || 'en'; } catch (e) {} if (!T[lang]) lang = 'en';
  function t(k, o) { var s = (T[lang][k] != null ? T[lang][k] : T.en[k]) || k; if (o) for (var x in o) s = s.split('{' + x + '}').join(o[x]); return s; }
  var $ = function (s) { return document.querySelector(s); };
  function load() { try { var a = JSON.parse(localStorage.getItem(KB)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function hm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  function yen(n) { return '¥' + n.toLocaleString('en-US'); }
  function units(x) { return Math.max(1, Math.round((x.end - x.start) / STEP)); }
  function jstNow() { var d = new Date(Date.now() + 9 * 3600e3); return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), da: d.getUTCDate() }; }
  function iso(y, mo, da) { return new Date(Date.UTC(y, mo, da)).toISOString().slice(0, 10); }
  function texts() { document.documentElement.lang = lang; document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); }); document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang); }); document.title = t('h1') + ' · DEMO'; }
  function render() {
    var date = $('#date').value, a = load().filter(function (x) { return x.date === date; }).sort(function (x, y) { return x.start - y.start || x.steamer.localeCompare(y.steamer); });
    var booked = a.filter(function (x) { return x.status !== 'cancelled'; }), canc = a.filter(function (x) { return x.status === 'cancelled'; });
    var slots = 0; for (var m = OPEN; m < CLOSE; m += STEP) slots += STEAMERS.length;
    $('#counts').innerHTML = [t('cntAll', { n: a.length }), t('cntBooked', { n: booked.length }), t('cntCanc', { n: canc.length }), t('cntOpen', { n: slots - booked.reduce(function (q, x) { return q + units(x); }, 0) })].map(function (s) { return '<span>' + s + '</span>'; }).join('');
    var h = '<thead><tr><th></th>' + STEAMERS.map(function (s) { return '<th>' + t('steamer') + ' ' + s + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (var m = OPEN; m < CLOSE; m += STEP) {
      h += '<tr><td>' + hm(m) + '</td>';
      STEAMERS.forEach(function (s) {
        var b = a.filter(function (x) { return x.steamer === s && x.start <= m && m < x.end; })[0];
        var cls = !b ? 'free' : b.status === 'cancelled' ? 'canc' : 'booked';
        h += '<td class="' + cls + '">' + (!b ? t('free') : b.status === 'cancelled' ? t('cancelled') : (b.member || t('member'))) + '</td>';
      });
      h += '</tr>';
    }
    $('#occ').innerHTML = h + '</tbody>';
    $('#list').innerHTML = a.length ? a.map(function (x) {
      var st = x.status === 'cancelled' ? 'cancelled' : 'booked';
      return '<li><span><span class="tag ' + st + '">' + t(st) + '</span> ' + x.date + ' ' + hm(x.start) + '–' + hm(x.end) + ' JST · ' + t('steamer') + ' ' + x.steamer + ' · ' + (x.member || t('member')) + ' · ' + t('rent') + ' ' + yen(x.fee || RATE * units(x)) + ' · ' + t('ex') + ' ' + yen(PENALTY * units(x)) + '</span></li>';
    }).join('') : '<li>' + t('none') + '</li>';
  }
  texts();
  var n = jstNow(); $('#date').value = iso(n.y, n.mo, n.da);
  document.querySelectorAll('.langs button').forEach(function (b) { b.onclick = function () { lang = b.dataset.lang; try { localStorage.setItem(KL, lang); } catch (e) {} texts(); render(); }; });
  $('#date').onchange = $('#date').oninput = render; $('#refresh').onclick = render;
  window.addEventListener('storage', function (e) { if (e.key === KB || e.key === KR) render(); });
  setInterval(render, 2000);
  render();
})();
