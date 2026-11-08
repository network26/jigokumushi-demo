/* Members area DEMO for Jigoku Mushikobo Kanawa. Browser-local only (localStorage). No login, no payment, no server.
   Fees come from the public website (fees.* : small ¥400 basic up to 15 min, +¥200 per extra 10 min or part; large ¥600 / +¥300).
   Hours from the website: 10:00–19:00 JST, last steamer reception 18:00; closed 3rd Wednesday (holiday shift not modelled). */
(function () {
  'use strict';
  var KB = 'jk-members-demo-v1', KS = 'jk-members-demo-session', KL = 'jk-members-demo-lang';
  var STEAMERS = ['A', 'B', 'C'], OPEN = 10 * 60, LAST_START = 18 * 60, CLOSE = 19 * 60, STEP = 15;
  var FEES = { small: { base: 400, ext: 200 }, large: { base: 600, ext: 300 } };
  var T = {
    en: {
      bar: 'Class demonstration only: no real accounts, no real bookings, no money collected. Data stays in this browser and is not shared with classmates.',
      back: '← Jigoku Mushikobo Kanawa (demo site)', kicker: 'LOCAL MEMBERS · SUBSCRIBERS', h1: 'Members login (demo)',
      lead: 'A concept for local subscribers: sign in, then reserve one of the 3 hell-steamers in 15-minute steps during opening hours.',
      perk1: 'Reserve a steamer slot ahead instead of waiting in line', perk2: 'Cancel anytime: the slot is released immediately', perk3: 'Pay the steamer fee in advance (simulated here)',
      subPrice: 'Subscription pricing and terms: to be confirmed. This is a student concept, not an official Jigoku Mushikobo Kanawa service.',
      enter: 'Enter as demo subscriber', noCred: 'No email, password or personal details are requested. This button just opens the demo dashboard.',
      dashK: 'MEMBER DASHBOARD', dashH: 'Welcome, Demo Subscriber', badge: 'Active subscription — demo', logout: 'Log out',
      bookH: 'Reserve a steamer', hoursNote: 'Opening hours (from the website): 10:00–19:00 JST, last steamer reception 18:00. Closed on the 3rd Wednesday of each month. All times are JST.',
      dateL: 'Date (JST)', sizeL: 'Steamer size', durL: 'Duration (minutes)', small: 'Small steamer', large: 'Large steamer',
      gridHelp: 'Tap a free cell to start your booking there. The whole duration must be free on that steamer and end by 19:00.',
      lgFree: 'Free', lgMine: 'My booking', lgTaken: 'Booked', lgSel: 'Selected', gridCap: 'Steamer availability in 15-minute steps', time: 'Time', steamer: 'Steamer', full: 'FULL',
      sumH: 'Booking summary', feeNote: 'Fee estimate from the website price list: basic fee covers up to 15 min, then each extra 10 min (or part). Demo estimate only; the facility sets actual charges.',
      pay: 'Simulate payment & reserve', clear: 'Clear', payNote: 'No card details are asked for and nothing is charged.',
      mineH: 'My reservations', none: 'No reservations yet.', cancel: 'Cancel', ovH: 'Demo overview (this browser only)',
      ovNote: 'All demo bookings stored in this browser. This is not the queue staff page and gives no staff access.', reset: 'Reset demo data',
      resetQ: 'Delete all members-demo bookings in this browser? (Queue data is not touched.)',
      ok: 'Reserved (DEMO). Steamer {s}, {d} {t1}–{t2} JST. Simulated payment {y}. Status: confirmed (demo).',
      cancelled: 'Cancelled. Steamer {s} is free again for {d} {t1}–{t2}.', clash: 'That time overlaps another booking on this steamer, or runs past closing.',
      dt: 'Date', tm: 'Time', st: 'Steamer', sz: 'Size', du: 'Duration', fee: 'Fee (estimate)', min: 'min', closedDay: '(closed)', past: 'past',
      foot: 'DEMO · student project · not affiliated booking system · no money collected'
    },
    ja: {
      bar: '授業用デモです：実際のアカウント・予約・支払いはありません。データはこのブラウザ内のみで、他の人とは共有されません。',
      back: '← 地獄蒸し工房 鉄輪（デモサイト）', kicker: '地域会員・サブスクリプション', h1: '会員ログイン（デモ）',
      lead: '地元の会員向けの構想です。ログインして、営業時間内に3つの地獄蒸し釜のいずれかを15分単位で予約できます。',
      perk1: '列に並ばずに釜の時間を事前予約', perk2: 'いつでもキャンセル可能：枠はすぐに解放されます', perk3: '釜の使用料を事前に支払い（ここでは模擬）',
      subPrice: 'サブスクリプションの料金・条件：未定。学生による構想であり、地獄蒸し工房 鉄輪の公式サービスではありません。',
      enter: 'デモ会員として入る', noCred: 'メールアドレス・パスワード・個人情報は一切不要です。このボタンでデモ画面が開くだけです。',
      dashK: '会員ダッシュボード', dashH: 'ようこそ、デモ会員さん', badge: 'サブスク有効 — デモ', logout: 'ログアウト',
      bookH: '釜を予約する', hoursNote: '営業時間（公式サイト記載）：10:00〜19:00（日本時間）、釜の最終受付18:00。毎月第3水曜日は休館。時刻はすべて日本時間です。',
      dateL: '日付（日本時間）', sizeL: '釜の大きさ', durL: '利用時間（分）', small: '地獄蒸し釜（小）', large: '地獄蒸し釜（大）',
      gridHelp: '空いている枠を押すと、そこから予約が始まります。利用時間すべてが空いていて、19:00までに終わる必要があります。',
      lgFree: '空き', lgMine: '自分の予約', lgTaken: '予約済み', lgSel: '選択中', gridCap: '15分単位の釜の空き状況', time: '時刻', steamer: '釜', full: '満枠',
      sumH: '予約内容', feeNote: '公式サイトの料金表による概算：基本使用料は15分以内、以降は延長10分（又は端数）ごと。デモの概算であり、実際の料金は施設が定めます。',
      pay: '模擬支払いで予約', clear: 'クリア', payNote: 'カード情報は不要で、請求は一切発生しません。',
      mineH: 'マイ予約', none: 'まだ予約はありません。', cancel: 'キャンセル', ovH: 'デモ全体表示（このブラウザのみ）',
      ovNote: 'このブラウザに保存されたデモ予約の一覧です。順番待ちのスタッフ画面ではなく、スタッフ権限もありません。', reset: 'デモデータをリセット',
      resetQ: 'このブラウザの会員デモ予約をすべて削除しますか？（順番待ちのデータは削除されません）',
      ok: '予約しました（デモ）。釜{s}、{d} {t1}〜{t2}（日本時間）。模擬支払い {y}。状態：確定（デモ）。',
      cancelled: 'キャンセルしました。釜{s}の {d} {t1}〜{t2} が空きになりました。', clash: 'この釜の他の予約と重なるか、閉館時刻を過ぎます。',
      dt: '日付', tm: '時刻', st: '釜', sz: '大きさ', du: '利用時間', fee: '料金（概算）', min: '分', closedDay: '（休館）', past: '終了',
      foot: 'デモ・学生プロジェクト・公式予約システムではありません・支払いは発生しません'
    }
  };
  var lang = 'en'; try { lang = localStorage.getItem(KL) || (/^ja/.test(navigator.language) ? 'ja' : 'en'); } catch (e) {}
  try { var q = new URL(location.href).searchParams.get('lang'); if (T[q]) lang = q; } catch (e) {}
  if (!T[lang]) lang = 'en';
  function t(k, o) { var s = (T[lang][k] != null ? T[lang][k] : T.en[k]) || k; if (o) for (var x in o) s = s.split('{' + x + '}').join(o[x]); return s; }
  var $ = function (s) { return document.querySelector(s); };

  function load() { try { var a = JSON.parse(localStorage.getItem(KB)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(a) { localStorage.setItem(KB, JSON.stringify(a)); }
  function hm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function yen(n) { return '¥' + n.toLocaleString('en-US'); }
  function fee(size, d) { var f = FEES[size]; return f.base + Math.max(0, Math.ceil((d - 15) / 10)) * f.ext; }
  function jstNow() { var d = new Date(Date.now() + 9 * 3600e3); return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), da: d.getUTCDate(), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; }
  function iso(y, mo, da) { var d = new Date(Date.UTC(y, mo, da)); return d.toISOString().slice(0, 10); }
  function isClosed(isoD) { var d = new Date(isoD + 'T00:00:00Z'); return d.getUTCDay() === 3 && d.getUTCDate() >= 15 && d.getUTCDate() <= 21; }
  function days() {
    var n = jstNow(), out = [];
    for (var i = 0; out.length < 7 && i < 14; i++) { var s = iso(n.y, n.mo, n.da + i); if (isClosed(s)) continue; if (i === 0 && n.min >= LAST_START) continue; out.push(s); }
    return out;
  }
  function overlaps(a, s, start, end, date) { return a.some(function (b) { return b.date === date && b.steamer === s && b.start < end && start < b.end; }); }

  var sel = null;   // {steamer, start}
  function texts() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
    document.title = t('h1') + ' · Jigoku Mushikobo Kanawa';
  }
  function fillDates() {
    var cur = $('#date').value, ds = days();
    $('#date').innerHTML = ds.map(function (d) { var w = new Date(d + 'T00:00:00Z').toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }); return '<option value="' + d + '">' + w + '</option>'; }).join('');
    if (ds.indexOf(cur) >= 0) $('#date').value = cur;
  }
  function render() {
    var a = load(), date = $('#date').value, dur = +$('#dur').value, n = jstNow(), today = iso(n.y, n.mo, n.da) === date;
    var h = '<thead><tr><th>' + t('time') + '</th>' + STEAMERS.map(function (s) { return '<th>' + t('steamer') + ' ' + s + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (var m = OPEN; m < CLOSE; m += STEP) {
      var cells = '', taken = 0;
      STEAMERS.forEach(function (s) {
        var b = a.filter(function (x) { return x.date === date && x.steamer === s && x.start <= m && m < x.end; })[0];
        var isSel = sel && sel.steamer === s && sel.start <= m && m < sel.start + dur;
        if (b) { taken++; cells += '<td><button type="button" disabled class="' + (b.mine ? 'mine' : 'taken') + '" data-s="' + s + '" data-m="' + m + '">' + (b.mine ? t('lgMine') : t('lgTaken')) + '</button></td>'; return; }
        var canStart = m <= LAST_START && m + dur <= CLOSE && !(today && m <= n.min) && !overlaps(a, s, m, m + dur, date);
        cells += '<td><button type="button" class="' + (isSel ? 'sel' : canStart ? '' : 'na') + '" data-s="' + s + '" data-m="' + m + '"' + (canStart ? '' : ' disabled') + '>' + (isSel ? t('lgSel') : canStart ? t('lgFree') : (today && m <= n.min ? t('past') : '—')) + '</button></td>';
      });
      h += '<tr class="' + (taken === 3 ? 'full' : '') + '" data-m="' + m + '"><td class="t">' + hm(m) + (taken === 3 ? ' · ' + t('full') : '') + '</td>' + cells + '</tr>';
    }
    $('#grid').innerHTML = '<caption class="sr">' + t('gridCap') + '</caption>' + h + '</tbody>';
    $('#grid').querySelectorAll('button:not([disabled])').forEach(function (b) { b.onclick = function () { sel = { steamer: b.dataset.s, start: +b.dataset.m }; render(); }; });
    // summary
    if (sel) {
      var sz = $('#size').value;
      $('#sum').innerHTML = [[t('dt'), date], [t('tm'), hm(sel.start) + '–' + hm(sel.start + dur) + ' JST'], [t('st'), sel.steamer], [t('sz'), t(sz)], [t('du'), dur + ' ' + t('min')], [t('fee'), yen(fee(sz, dur))]]
        .map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');
    }
    $('#checkout').hidden = !sel;
    var mine = a.filter(function (x) { return x.mine; }).sort(function (x, y) { return (x.date + hm(x.start)).localeCompare(y.date + hm(y.start)); });
    $('#mine').innerHTML = mine.length ? mine.map(function (x) { return '<li><span>' + x.date + ' ' + hm(x.start) + '–' + hm(x.end) + ' JST · ' + t('steamer') + ' ' + x.steamer + ' · ' + t(x.size) + ' · ' + yen(x.fee) + ' · DEMO</span><button type="button" class="btn ghost sm" data-cancel="' + x.id + '">' + t('cancel') + '</button></li>'; }).join('') : '<li>' + t('none') + '</li>';
    $('#mine').querySelectorAll('[data-cancel]').forEach(function (b) { b.onclick = function () { cancel(b.dataset.cancel); }; });
    $('#all').innerHTML = a.length ? a.map(function (x) { return '<li>' + x.date + ' ' + hm(x.start) + '–' + hm(x.end) + ' · ' + x.steamer + ' · ' + x.size + ' · ' + yen(x.fee) + '</li>'; }).join('') : '<li>' + t('none') + '</li>';
  }
  function say(s) { $('#msg').textContent = s; $('#msg').hidden = false; }
  function book() {
    if (!sel) return;
    var a = load(), date = $('#date').value, dur = +$('#dur').value, sz = $('#size').value, s = sel.steamer, st = sel.start, en = st + dur;
    if (st < OPEN || st > LAST_START || en > CLOSE || st % STEP || overlaps(a, s, st, en, date)) { say(t('clash')); sel = null; render(); return; }
    var b = { id: 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: date, steamer: s, start: st, end: en, size: sz, fee: fee(sz, dur), mine: true, status: 'confirmed-demo', paid: 'simulated' };
    a.push(b); save(a); sel = null;
    say(t('ok', { s: s, d: date, t1: hm(st), t2: hm(en), y: yen(b.fee) })); render();
  }
  function cancel(id) {
    var a = load(), b = a.filter(function (x) { return x.id === id; })[0]; if (!b) return;
    save(a.filter(function (x) { return x.id !== id; }));
    say(t('cancelled', { s: b.steamer, d: b.date, t1: hm(b.start), t2: hm(b.end) })); render();
  }
  function show() {
    var inside = false; try { inside = sessionStorage.getItem(KS) === '1' || localStorage.getItem(KS) === '1'; } catch (e) {}
    $('#landing').hidden = inside; $('#dash').hidden = !inside;
    if (inside) { fillDates(); render(); }
  }
  texts();
  document.querySelectorAll('.langs button').forEach(function (b) { b.onclick = function () { lang = b.dataset.lang; try { localStorage.setItem(KL, lang); } catch (e) {} texts(); show(); }; });
  $('#enter').onclick = function () { localStorage.setItem(KS, '1'); show(); };
  $('#logout').onclick = function () { localStorage.removeItem(KS); sel = null; show(); };
  $('#date').onchange = $('#dur').onchange = function () { sel = null; render(); };
  $('#size').onchange = render;
  $('#pay').onclick = book;
  $('#clearSel').onclick = function () { sel = null; render(); };
  $('#reset').onclick = function () { if (confirm(t('resetQ'))) { localStorage.removeItem(KB); sel = null; $('#msg').hidden = true; render(); } };
  window.addEventListener('storage', function (e) { if (e.key === KB || e.key === KS) show(); });
  show();
  window.__membersDemo = { fee: fee, FEES: FEES };
})();
