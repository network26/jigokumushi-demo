/* Staff page for the queue DEMO (English + Japanese). The PIN below is NOT security – demo gate only. */
(function () {
  'use strict';
  var Q = JKQueue, api = Q.create();
  var $ = function (s) { return document.querySelector(s); };
  var AUTH = 'jk-q-staff-demo';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  try { if (/[?&]demo=1/.test(location.search)) sessionStorage.setItem(AUTH, '1'); } catch (e) {} // demo console auto-unlock
  function authed() { try { return sessionStorage.getItem(AUTH) === '1'; } catch (e) { return false; } }
  function show() { var a = authed(); $('#pin-view').hidden = a; $('#console').hidden = !a; if (a) render(); }
  $('#pin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('#pin').value === Q.DEMO_PIN) { try { sessionStorage.setItem(AUTH, '1'); } catch (x) {} $('#pin').value = ''; $('#pin-err').textContent = ''; show(); $('#b-next').focus(); }
    else { $('#pin-err').textContent = 'Wrong PIN / PINが違います'; $('#pin').select(); }
  });
  $('#b-lock').addEventListener('click', function () { try { sessionStorage.removeItem(AUTH); } catch (e) {} show(); $('#pin').focus(); });

  var ST = { waiting: 'Waiting / 待ち', called: 'Called / 呼出中', seated: 'Seated / 案内済', noshow: 'No-show / 不在', left: 'Left / 退出' };
  function mins(ms) { return Math.max(0, Math.round(ms / 60000)) + ' min'; }
  var LT = { en: 'EN', ja: '日本語', ko: '한국어', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', fr: 'FR', vi: 'VI', es: 'ES', de: 'DE', th: 'ไทย', id: 'ID', pt: 'PT', it: 'IT' };
  var NAMES = ['Walk-in', 'Table-for', 'Guest'];

  $('#b-next').addEventListener('click', function () { api.callNext().then(function (e) { say(e ? 'Called No. ' + e.no + ' / ' + e.no + '番を呼びました' : 'Nobody is waiting / 待ちはありません'); }); });
  $('#b-open').addEventListener('click', function () { api.setOpen(!api.getState().open); });
  $('#b-add').addEventListener('click', function () { api.join({ size: 1 + Math.floor(Math.random() * 4), nick: NAMES[0], lang: 'ja' }).catch(function () { say('Queue is closed / 受付終了中です'); }); });
  $('#b-reset').addEventListener('click', function () { if (confirm('Clear the whole queue and restart numbers at 1?\n待ちリストをすべて消して番号を1に戻しますか？')) api.reset(); });
  $('#rows').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.getAttribute('data-id'), act = b.getAttribute('data-act');
    api[act === 'noshow' ? 'noShow' : act](id);
  });
  function say(m) { $('#s-live').textContent = m; }

  function render() {
    if (!authed()) return;
    var st = api.getState(), now = Date.now(), c = { waiting: 0, called: 0, seated: 0, noshow: 0 };
    st.entries.forEach(function (e) { if (c[e.status] != null) c[e.status]++; });
    $('#n-wait').textContent = c.waiting; $('#n-called').textContent = c.called; $('#n-seated').textContent = c.seated; $('#n-no').textContent = c.noshow;
    var o = $('#s-open'); o.textContent = st.open ? 'Queue open' : 'Queue closed'; o.className = 'badge' + (st.open ? '' : ' closed');
    $('#s-open-ja').textContent = st.open ? '受付中' : '受付終了';
    $('#b-open').innerHTML = st.open ? 'Close queue <span lang="ja">受付終了</span>' : 'Reopen queue <span lang="ja">受付再開</span>';
    $('#b-next').disabled = c.waiting === 0;
    // active first (called, waiting by number), then finished (latest first)
    var act = st.entries.filter(function (e) { return e.status === 'called'; }).concat(Q.waiting(st));
    var fin = st.entries.filter(function (e) { return e.status !== 'called' && e.status !== 'waiting'; }).sort(function (a, b) { return b.no - a.no; });
    var all = act.concat(fin);
    $('#empty').hidden = all.length > 0;
    $('#rows').innerHTML = all.map(function (e) {
      var live = e.status === 'waiting' || e.status === 'called', btns = '';
      if (e.status === 'waiting') btns += '<button type="button" class="btn btn-fire sm" data-act="call" data-id="' + esc(e.id) + '">Call <span lang="ja">呼出</span></button>';
      if (e.status === 'called') btns += '<button type="button" class="btn btn-ghost sm" data-act="call" data-id="' + esc(e.id) + '">Call again <span lang="ja">再呼出</span></button>';
      if (e.status === 'called') btns += '<button type="button" class="btn btn-gold sm" data-act="seat" data-id="' + esc(e.id) + '">Seat <span lang="ja">案内</span></button>';
      if (live) btns += '<button type="button" class="btn btn-ghost sm" data-act="noshow" data-id="' + esc(e.id) + '">No-show <span lang="ja">不在</span></button>';
      return '<tr class="' + esc(e.status) + '"><td class="no">' + e.no + '</td><td>' + e.size + '</td><td>' + (e.nick ? esc(e.nick) : '<span class="tag">—</span>') + '<br><small class="meta">' + esc(e.id) + '</small> ' + (e.lang ? '<span class="tag lang" lang="' + esc(e.lang) + '" title="Ticket language / 言語">' + esc(LT[e.lang] || e.lang) + '</span>' : '') + '</td><td><span class="tag ' + esc(e.status) + '">' + (ST[e.status] || esc(e.status)) + '</span></td><td>' + mins((e.doneAt || now) - e.joinedAt) + '</td><td class="act"><div>' + btns + '</div></td></tr>';
    }).join('');
  }
  api.subscribe(function () { render(); });
  setInterval(render, 30000); // refresh elapsed minutes
  if (/[?&]embed=1/.test(location.search)) document.body.classList.add("embed");
  show();
})();
