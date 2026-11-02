/* Staff page for the queue DEMO (English + Japanese). Opened through a private link (see gate.js); no PIN is shown anywhere. */
(function () {
  'use strict';
  var Q = JKQueue;
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var EMBED = /[?&]embed=1/.test(location.search);
  var K_SESS = 'jk-class-session', K_ACTIVE = 'jk-class-active';
  var api = null, authed = false, sess = null, relay = null;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function loadSess() { try { var s = JSON.parse(lsGet(K_SESS)); return s && s.sid && s.pk && s.jwk ? s : null; } catch (e) { return null; } }

  function boot() {
    // a private link may carry a session backup (s=...) so another browser/device can take over the same class demo
    var blob = JKGate.params.get('s');
    if (blob && !EMBED && authed) { try { var o = JSON.parse(new TextDecoder().decode(JKRelay.unb64u(blob))); if (o.sid && o.pk && o.jwk) { lsSet(K_SESS, JSON.stringify(o)); lsSet(K_ACTIVE, '1'); } } catch (e) {} }
    sess = loadSess();
    var live = !EMBED && sess && lsGet(K_ACTIVE) === '1';
    api = live ? Q.create({ key: 'jk-queue-class-' + sess.sid, channel: 'jk-queue-class-' + sess.sid }) : Q.create();
    $('#pin-view').hidden = authed; $('#console').hidden = !authed;
    if (!authed) return;
    $('#class-panel').hidden = EMBED;
    initButtons();
    if (live) { document.body.classList.add('class-live'); setupClass(); }
    else { $('#cd-off').hidden = false; $('#cd-on').hidden = true; }
    render();
  }
  $('#b-lock').addEventListener('click', function () { JKGate.lock(); location.reload(); });

  /* ---- class demo panel ---- */
  function setupClass() {
    $('#cd-off').hidden = true; $('#cd-on').hidden = false; $('#cd-badge').hidden = false;
    var link = JKRelay.joinUrl(sess.sid, sess.pk);
    $('#cd-link').textContent = link;
    $('#cd-qr').innerHTML = JKRelay.qrSvg(link, 170);
    relay = JKRelay.staff(sess, api);
    var fmt = { live: 'listening', polling: 'listening (slow)', connecting: 'connecting…', offline: 'OFFLINE' };
    function paint() {
      var s = relay.status();
      $('#cd-status').textContent = 'Relay: ' + (fmt[s.listen] || s.listen) + ' · publishing: ' + s.pub + (s.err ? ' (' + s.err + ')' : '') + ' · joins received this visit: ' + s.joins + (s.lastPub ? ' · last sent ' + new Date(s.lastPub).toLocaleTimeString() : '');
    }
    relay.onStatus(paint); paint();
    $('#cd-proj').addEventListener('click', function () { window.open('qr.html#c=' + sess.sid + '.' + sess.pk, '_blank'); });
    $('#cd-copy').addEventListener('click', function () { copy(link, 'Join link copied'); });
    $('#cd-backup').addEventListener('click', function () {
      var blob = JKRelay.b64u(new TextEncoder().encode(JSON.stringify({ sid: sess.sid, pk: sess.pk, jwk: sess.jwk })));
      copy(new URL('staff.html', location.href).href.split('#')[0] + '#k=' + JKGate.key() + '&s=' + blob, 'Private staff link copied – keep it secret');
    });
    $('#cd-local').addEventListener('click', function () { lsSet(K_ACTIVE, null); location.reload(); });
    $('#cd-end').addEventListener('click', function () {
      if (!confirm('End the class demo? Phones will see the queue as closed and this session (QR code) stops working.\nクラスデモを終了しますか？QRは無効になります。')) return;
      api.setOpen(false).then(function () { relay.republish(); return new Promise(function (r) { setTimeout(r, 2500); }); }).then(function () {
        lsSet(K_SESS, null); lsSet(K_ACTIVE, null); location.reload();
      });
    });
  }
  function copy(text, msg) {
    var done = function () { say(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { prompt('Copy:', text); });
    else prompt('Copy:', text);
  }
  $('#cd-start').addEventListener('click', function () {
    var go = function () { lsSet(K_ACTIVE, '1'); location.reload(); };
    if (loadSess()) go(); else JKRelay.createSession().then(function (s) { lsSet(K_SESS, JSON.stringify(s)); go(); });
  });

  var ST = { waiting: 'Waiting / 待ち', called: 'Called / 呼出中', seated: 'Seated / 案内済', noshow: 'No-show / 不在', left: 'Left / 退出' };
  function mins(ms) { return Math.max(0, Math.round(ms / 60000)) + ' min'; }
  var LT = { en: 'EN', ja: '日本語', ko: '한국어', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', fr: 'FR', vi: 'VI', es: 'ES', de: 'DE', th: 'ไทย', id: 'ID', pt: 'PT', it: 'IT' };
  var NAMES = ['Walk-in', 'Table-for', 'Guest'];

  function initButtons() {
  $('#b-next').addEventListener('click', function () { api.callNext().then(function (e) { say(e ? 'Called No. ' + e.no + ' / ' + e.no + '番を呼びました' : 'Nobody is waiting / 待ちはありません'); }); });
  $('#b-open').addEventListener('click', function () { api.setOpen(!api.getState().open); });
  $('#b-add').addEventListener('click', function () { api.join({ size: 1 + Math.floor(Math.random() * 4), nick: NAMES[0], lang: 'ja' }).catch(function () { say('Queue is closed / 受付終了中です'); }); });
  $('#b-reset').addEventListener('click', function () { if (confirm('Clear the whole queue and restart numbers at 1?\n待ちリストをすべて消して番号を1に戻しますか？')) api.reset(); });
  $('#rows').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.getAttribute('data-id'), act = b.getAttribute('data-act');
    api[act === 'noshow' ? 'noShow' : act](id);
  });
  }
  function say(m) { $('#s-live').textContent = m; }

  function render() {
    if (!authed || !api) return;
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
  setInterval(render, 30000); // refresh elapsed minutes
  if (EMBED) document.body.classList.add('embed');
  JKGate.ready.then(function (ok) { authed = ok; boot(); api && api.subscribe(function () { render(); }); });
})();
