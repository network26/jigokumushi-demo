/* Members area DEMO for Jigoku Mushikobo Kanawa. Browser-local only (localStorage). No login, no payment, no server.
   Steamer fee for this demo: ¥400 per 15-min slot (official basic steamer fee from jigokumushi.com). Size labels are not used.
   Hours from the website: 10:00–19:00 JST, last steamer reception 18:00; closed 3rd Wednesday (holiday shift not modelled). */
(function () {
  'use strict';
  var KB = 'jk-members-demo-v1', KS = 'jk-members-demo-session', KL = 'jk-members-demo-lang';
  var SLOT = 15, PENALTY = 200;   // every new booking = exactly one steamer x one 15-min slot; EXAMPLE cancel/no-show fee per steamer-slot
  var STEAMERS = ['A', 'B', 'C'], OPEN = 10 * 60, LAST_START = 18 * 60, CLOSE = 19 * 60, STEP = 15;
  var RATE = 400;   // official basic steamer fee (15 min), jigokumushi.com/pages/18/
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
      dateL: 'Date (JST)', durL: 'Duration (minutes)',
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
      dateL: '日付（日本時間）', durL: '利用時間（分）',
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
  Object.assign(T.en, {"feeNote": "Fee estimate from the official price list (revised July 1, 2021): basic fee covers up to 15 min, then each extra 10 min (or part). No separate local-resident steamer rate is published on the official site, so standard rates are shown; local pricing is unconfirmed. Admission is free; ingredients are bought separately. Subscription pricing: to be confirmed.", "feeSrc": "Official price list (jigokumushi.com)", "polH": "Example cancellation / no-show policy (proposed for this demo, not the facility’s official rules):", "pol": "Cancellation fee ¥200 or no-show fee ¥200 — one or the other, never both for the same booking. Nothing is actually charged in this demo; cancelling still frees the slot immediately.", "closedNote": "Closed on this date (3rd Wednesday of the month). Please choose another day.", "pastNote": "This date is outside the bookable range (past, after today’s 18:00 JST last reception, or more than 12 months ahead). Please choose another date.", "polShort": "Example policy: ¥200 cancellation or ¥200 no-show fee (not both; demo only, not charged)."});
  Object.assign(T.ja, {"feeNote": "公式料金表（令和3年7月1日改定）による概算：基本使用料は15分以内、以降は延長10分（又は端数）ごと。公式サイトには地元住民向けの釜料金の記載がないため通常料金を表示しています（地元向け料金は未確認）。入館料は無料、食材は別途購入です。サブスク料金：未定。", "feeSrc": "公式料金表（jigokumushi.com）", "polH": "キャンセル・無断不参加の例示ポリシー（このデモ用の提案であり、施設の公式ルールではありません）：", "pol": "キャンセル料200円 または 無断不参加料200円 — どちらか一方のみで、同じ予約に両方はかかりません。このデモでは実際の請求は一切なく、キャンセルすると枠はすぐに空きます。", "closedNote": "この日は休館日です（毎月第3水曜日）。別の日を選んでください。", "pastNote": "予約できる期間外です（過去の日付、本日18:00の最終受付後、または12か月より先）。別の日付を選んでください。", "polShort": "例示ポリシー：キャンセル料200円 または 無断不参加料200円（両方はかかりません。デモのため請求なし）。"});
  Object.assign(T.en, {"durFixed": "Each booking is exactly 15 minutes for one steamer. For longer use (e.g. 30 minutes) or more steamers, book each 15-minute slot on each steamer separately.", "gridHelp": "Tap a free cell to book that steamer for that 15-minute slot (ends by 19:00 JST).", "lead": "A concept for local subscribers: sign in, then reserve one of the 3 hell-steamers, one 15-minute slot at a time, during opening hours.", "durOne": "15 min (fixed)", "rent": "Steamer fee (est.)", "exFee": "EXAMPLE cancel/no-show fee", "exFeeSub": "per steamer per 15-min slot (example only, not charged)", "polH": "EXAMPLE cancellation / no-show fees (examples for this demo only — not the facility’s official rates or rules, and nothing is collected):", "pol": "¥200 per steamer per 15-minute slot. Either the cancellation fee OR the no-show fee applies to a booked slot, never both. Examples: 1 steamer × 1 slot = ¥200; 2 steamers in the same slot = ¥400; 2 steamers × 2 back-to-back slots (30 min) = 4 slots = ¥800 (¥400 for the first slot + ¥400 for the second). Cancelling frees the slot immediately.", "polShort": "EXAMPLE fee if cancelled or no-show: ¥200 for this steamer slot (one or the other, not both; not charged in this demo).", "exTotal": "EXAMPLE exposure if all were cancelled or missed: {n} steamer-slots × ¥200 = {y} (not charged)."});
  Object.assign(T.ja, {"durFixed": "1回の予約は釜1つにつき15分ちょうどです。30分など長く使う場合や複数の釜を使う場合は、釜ごと・15分枠ごとに別々に予約してください。", "gridHelp": "空いている枠を押すと、その釜をその15分枠で予約できます（19:00までに終了）。", "lead": "地元の会員向けの構想です。ログインして、営業時間内に3つの地獄蒸し釜のいずれかを15分枠ずつ予約できます。", "durOne": "15分（固定）", "rent": "釜の使用料（概算）", "exFee": "キャンセル・無断不参加料の例", "exFeeSub": "釜1つ・15分枠ごと（例示のみ・請求なし）", "polH": "キャンセル・無断不参加料の例（このデモ用の例示であり、施設の公式料金・ルールではありません。請求は一切ありません）：", "pol": "釜1つ・15分枠ごとに200円。予約した枠には、キャンセル料 または 無断不参加料 のどちらか一方のみがかかり、両方はかかりません。例：釜1つ×1枠＝200円、同じ時間に釜2つ＝400円、釜2つ×連続2枠（30分）＝4枠＝800円（1枠目400円＋2枠目400円）。キャンセルすると枠はすぐに空きます。", "polShort": "キャンセル・無断不参加時の例示料金：この釜の枠につき200円（どちらか一方のみ、両方はかかりません。デモのため請求なし）。", "exTotal": "すべてキャンセル・無断不参加の場合の例：{n}枠 × 200円 ＝ {y}（請求なし）。"});
  Object.assign(T.en, {"feeH": "Example cancellation and no-show fees", "feeC": "Cancellation: ¥200 per steamer per 15-minute booked slot.", "feeN": "No-show: ¥200 per steamer per 15-minute booked slot.", "feeOne": "Each booked slot is charged either the cancellation fee or the no-show fee — never both.", "feeEx": "Example: 2 steamers × 2 back-to-back 15-min slots = 4 slots = ¥800.", "feeDemo": "Examples for this demo only — not the facility’s official rules, and nothing is collected."});
  Object.assign(T.ja, {"feeH": "キャンセル料・無断不参加料の例", "feeC": "キャンセル：予約した釜1つ・15分枠ごとに200円。", "feeN": "無断不参加：予約した釜1つ・15分枠ごとに200円。", "feeOne": "1つの予約枠にかかるのはキャンセル料か無断不参加料のどちらか一方のみで、両方はかかりません。", "feeEx": "例：釜2つ × 連続した15分枠2つ ＝ 4枠 ＝ 800円。", "feeDemo": "このデモ用の例であり、施設の公式ルールではありません。請求は一切ありません。"});
  Object.assign(T.en, {"feeNote": "Steaming cost for this demo: ¥400 per 15-minute slot (official walk-in basic use fee for 15 minutes or less, revised July 1, 2021). No separate local-resident rate is published. Example cancellation/no-show fees are listed separately. Subscription pricing: to be confirmed.", "feeSrc": "Official price list (jigokumushi.com)", "rent": "Steamer fee (est.)", "stCancelled": "Cancelled", "small": "Steamer", "large": "Steamer", "sizeL": "Steamer", "sz": "Steamer"});
  Object.assign(T.ja, {"feeNote": "このデモの蒸し料金：15分枠ごとに400円（公式の一般・基本使用料・15分以内、令和3年7月1日改定）。地元住民向け料金の記載はありません。キャンセル・無断不参加料の例は別に表示します。サブスク料金：未定。", "feeSrc": "公式料金表（jigokumushi.com）", "rent": "釜の使用料（概算）", "stCancelled": "キャンセル済", "small": "釜", "large": "釜", "sizeL": "釜", "sz": "釜"});
  Object.assign(T.en, {"steamCost": "Steaming cost (official walk-in)", "steamRate": "¥400 per steamer per 15-min slot", "total": "Total", "costTotal": "Steaming cost {steam} ({n} × ¥400 official walk-in) + EXAMPLE cancel/no-show fees {fees} ({n} × ¥200) = Total {total} (example fees not charged).", "fee": "Steaming cost (official walk-in)", "rent": "Steaming cost (official walk-in)"});
  Object.assign(T.ja, {"steamCost": "蒸し料金（公式の一般利用料金）", "steamRate": "釜1つ・15分枠ごとに400円", "total": "合計", "costTotal": "蒸し料金 {steam}（{n}枠 × 400円・公式の一般利用料金）＋ キャンセル・無断不参加料の例 {fees}（{n}枠 × 200円）＝ 合計 {total}（例示料金は請求なし）。", "fee": "蒸し料金（公式の一般利用料金）", "rent": "蒸し料金（公式の一般利用料金）"});
  var lang = 'en'; try { lang = localStorage.getItem(KL) || (/^ja/.test(navigator.language) ? 'ja' : 'en'); } catch (e) {}
  try { var q = new URL(location.href).searchParams.get('lang'); if (T[q]) lang = q; } catch (e) {}
  if (!T[lang]) lang = 'en';
  function t(k, o) { var s = (T[lang][k] != null ? T[lang][k] : T.en[k]) || k; if (o) for (var x in o) s = s.split('{' + x + '}').join(o[x]); return s; }
  var $ = function (s) { return document.querySelector(s); };

  function load() { try { var a = JSON.parse(localStorage.getItem(KB)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(a) { localStorage.setItem(KB, JSON.stringify(a)); try { localStorage.setItem(KB + '-rev', String(Date.now())); } catch (e) {} }
  function active(a) { return (a || load()).filter(function (x) { return x.status !== 'cancelled'; }); }
  function hm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function yen(n) { return '¥' + n.toLocaleString('en-US'); }
  function fee(d) { return RATE * Math.max(1, Math.round((d || SLOT) / SLOT)); }   // official walk-in basic use fee ¥400 / 15-min steamer-slot
  function steamYen(n) { return RATE * n; }
  function feeYen(n) { return PENALTY * n; }
  function totalYen(n) { return (RATE + PENALTY) * n; }
  function costText(n) { return t('costTotal', { n: n, steam: yen(steamYen(n)), fees: yen(feeYen(n)), total: yen(totalYen(n)) }); }
  function jstNow() { var d = new Date(Date.now() + 9 * 3600e3); return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), da: d.getUTCDate(), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; }
  function iso(y, mo, da) { var d = new Date(Date.UTC(y, mo, da)); return d.toISOString().slice(0, 10); }
  function isClosed(isoD) { var d = new Date(isoD + 'T00:00:00Z'); return d.getUTCDay() === 3 && d.getUTCDate() >= 15 && d.getUTCDate() <= 21; }
  function days_unused() {
    var n = jstNow(), out = [];
    for (var i = 0; out.length < 7 && i < 14; i++) { var s = iso(n.y, n.mo, n.da + i); if (isClosed(s)) continue; if (i === 0 && n.min >= LAST_START) continue; out.push(s); }
    return out;
  }
  function units(x) { return Math.max(1, Math.round((x.end - x.start) / SLOT)); }   // legacy longer bookings count each 15-min steamer-slot
  function overlaps(a, s, start, end, date) { return active(a).some(function (b) { return b.date === date && b.steamer === s && b.start < end && start < b.end; }); }

  var sel = null;   // {steamer, start}
  function texts() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    document.querySelectorAll('.langs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
    document.title = t('h1') + ' · Jigoku Mushikobo Kanawa';
  }
  var MAX_MONTHS = 12;   // bookable up to 12 months ahead (demo)
  function firstOpen() { var n = jstNow(), i = (n.min >= LAST_START) ? 1 : 0, d; do { d = iso(n.y, n.mo, n.da + i++); } while (isClosed(d)); return d; }
  function fillDates() {
    var n = jstNow(), el = $('#date');
    el.min = iso(n.y, n.mo, n.da + (n.min >= LAST_START ? 1 : 0)); el.max = iso(n.y, n.mo + MAX_MONTHS, n.da);
    if (!el.value || el.value < el.min || el.value > el.max) el.value = firstOpen();
  }
  function dayState(date) { var n = jstNow(), today = iso(n.y, n.mo, n.da); if (!date || date < today || (date === today && n.min >= LAST_START) || date > $('#date').max) return 'past'; return isClosed(date) ? 'closed' : 'open'; }
  function render() {
    var a = load(), live = active(a), date = $('#date').value, dur = SLOT, n = jstNow(), today = iso(n.y, n.mo, n.da) === date, ds = dayState(date);
    $('#dayNote').hidden = ds === 'open'; $('#dayNote').textContent = ds === 'closed' ? t('closedNote') : ds === 'past' ? t('pastNote') : '';
    if (ds !== 'open') sel = null;
    var h = '<thead><tr><th>' + t('time') + '</th>' + STEAMERS.map(function (s) { return '<th>' + t('steamer') + ' ' + s + '</th>'; }).join('') + '</tr></thead><tbody>';
    for (var m = OPEN; m < CLOSE; m += STEP) {
      var cells = '', taken = 0;
      STEAMERS.forEach(function (s) {
        var b = live.filter(function (x) { return x.date === date && x.steamer === s && x.start <= m && m < x.end; })[0];
        var isSel = sel && sel.steamer === s && sel.start <= m && m < sel.start + dur;
        if (b) { taken++; cells += '<td><button type="button" disabled class="' + (b.mine ? 'mine' : 'taken') + '" data-s="' + s + '" data-m="' + m + '">' + (b.mine ? t('lgMine') : t('lgTaken')) + '</button></td>'; return; }
        var canStart = ds === 'open' && m <= LAST_START && m + dur <= CLOSE && !(today && m <= n.min) && !overlaps(live, s, m, m + dur, date);
        cells += '<td><button type="button" class="' + (isSel ? 'sel' : canStart ? '' : 'na') + '" data-s="' + s + '" data-m="' + m + '"' + (canStart ? '' : ' disabled') + '>' + (isSel ? t('lgSel') : canStart ? t('lgFree') : (today && m <= n.min ? t('past') : '—')) + '</button></td>';
      });
      h += '<tr class="' + (taken === 3 ? 'full' : '') + '" data-m="' + m + '"><td class="t">' + hm(m) + (taken === 3 ? ' · ' + t('full') : '') + '</td>' + cells + '</tr>';
    }
    $('#grid').innerHTML = '<caption class="sr">' + t('gridCap') + '</caption>' + h + '</tbody>';
    $('#grid').querySelectorAll('button:not([disabled])').forEach(function (b) { b.onclick = function () { sel = { steamer: b.dataset.s, start: +b.dataset.m }; render(); }; });
    // summary
    if (sel) {
      $('#sum').innerHTML = [[t('dt'), date], [t('tm'), hm(sel.start) + '–' + hm(sel.start + dur) + ' JST'], [t('st'), sel.steamer], [t('du'), t('durOne')], [t('steamCost'), yen(fee(dur)) + ' · ' + t('steamRate')], [t('exFee'), yen(PENALTY) + ' ' + t('exFeeSub')], [t('total'), yen(totalYen(1))]]
        .map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');
    }
    $('#checkout').hidden = !sel;
    var mine = live.filter(function (x) { return x.mine; }).sort(function (x, y) { return (x.date + hm(x.start)).localeCompare(y.date + hm(y.start)); });
    var tot = mine.reduce(function (q, x) { return q + units(x); }, 0);
    $('#mineTotal').hidden = !mine.length; $('#mineTotal').textContent = tot ? costText(tot) : '';
    $('#mine').innerHTML = mine.length ? mine.map(function (x) { var n = units(x); return '<li><span>' + x.date + ' ' + hm(x.start) + '–' + hm(x.end) + ' JST · ' + t('steamer') + ' ' + x.steamer + ' · ' + t('steamCost') + ' ' + yen(x.fee != null ? x.fee : steamYen(n)) + ' · ' + t('exFee') + ' ' + yen(feeYen(n)) + (n > 1 ? ' (' + n + ' × ' + yen(PENALTY) + ')' : '') + ' · ' + t('total') + ' ' + yen(totalYen(n)) + ' · DEMO</span><button type="button" class="btn ghost sm" data-cancel="' + x.id + '">' + t('cancel') + '</button></li>'; }).join('') : '<li>' + t('none') + '</li>';
    $('#mine').querySelectorAll('[data-cancel]').forEach(function (b) { b.onclick = function () { cancel(b.dataset.cancel); }; });
    $('#all').innerHTML = a.length ? a.map(function (x) { var n = units(x); return '<li>' + x.date + ' ' + hm(x.start) + '–' + hm(x.end) + ' · ' + t('steamer') + ' ' + x.steamer + ' · ' + t('steamCost') + ' ' + yen(x.fee != null ? x.fee : steamYen(n)) + ' · ' + t('exFee') + ' ' + yen(feeYen(n)) + ' · ' + t('total') + ' ' + yen(totalYen(n)) + (x.status === 'cancelled' ? ' · ' + t('stCancelled') : '') + '</li>'; }).join('') : '<li>' + t('none') + '</li>';
  }
  function say(s) { $('#msg').textContent = s; $('#msg').hidden = false; }
  function book() {
    if (!sel) return;
    var a = load(), date = $('#date').value, dur = SLOT, s = sel.steamer, st = sel.start, en = st + dur;
    if (dayState(date) !== 'open' || st < OPEN || st > LAST_START || en > CLOSE || st % STEP || overlaps(a, s, st, en, date)) { say(t('clash')); sel = null; render(); return; }
    var b = { id: 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: date, steamer: s, start: st, end: en, fee: fee(dur), mine: true, member: 'Demo Subscriber', status: 'booked', paid: 'simulated', createdAt: Date.now() };
    a.push(b); save(a); sel = null;
    say(t('ok', { s: s, d: date, t1: hm(st), t2: hm(en), y: yen(b.fee) }) + ' ' + costText(1) + ' ' + t('polShort')); render();
  }
  function cancel(id) {
    var a = load(), b = null;
    a.forEach(function (x) { if (x.id === id) { b = x; x.status = 'cancelled'; x.cancelledAt = Date.now(); } });
    if (!b) return; save(a);
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
  $('#date').onchange = $('#date').oninput = function () { sel = null; render(); };
  $('#pay').onclick = book;
  $('#clearSel').onclick = function () { sel = null; render(); };
  $('#reset').onclick = function () { if (confirm(t('resetQ'))) { localStorage.removeItem(KB); sel = null; $('#msg').hidden = true; render(); } };
  window.addEventListener('storage', function (e) { if (e.key === KB || e.key === KS) show(); });
  show();
  window.__membersDemo = { fee: fee, RATE: RATE, PENALTY: PENALTY, totalYen: totalYen, costText: costText };
})();
