/* Customer page for the queue DEMO. All data goes through window.JKQueue (see queue-core.js). */
(function () {
  'use strict';
  var Q = JKQueue, api = Q.create();
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var LANGS = [['en','English'],['ja','日本語'],['ko','한국어'],['zh-Hans','简体中文'],['zh-Hant','繁體中文'],['fr','Français'],['vi','Tiếng Việt'],['es','Español'],['de','Deutsch'],['th','ไทย'],['id','Bahasa Indonesia'],['pt','Português'],['it','Italiano']];
  var TICKET_KEY = 'jk-q-ticket'; // sessionStorage = one "customer" per tab, so Nathan can test several customers in several tabs.
                                  // (A real version would keep the ticket id in a cookie / localStorage on the phone.)

  /* ---------- language ---------- */
  var lang = 'en';
  (function () {
    var q = null, saved = null;
    try { q = new URL(location.href).searchParams.get('lang'); } catch (e) {}
    try { saved = localStorage.getItem('jk-lang'); } catch (e) {}
    var nav = navigator.language || 'en';
    var guess = /^zh-(TW|HK|MO)|Hant/i.test(nav) ? 'zh-Hant' : /^zh/i.test(nav) ? 'zh-Hans' : nav.slice(0, 2);
    [q, saved, guess].some(function (c) { if (c && QI18N[c]) { lang = c; return true; } });
  })();
  function tt(l, k, o) {
    var s = (QI18N[l] && QI18N[l][k] != null) ? QI18N[l][k] : (QI18N.en[k] != null ? QI18N.en[k] : k);
    return o ? s.replace(/\{n\}/g, o.n) : s;
  }
  function t(k, o) { return tt(lang, k, o); }                 // page UI: follows the language selector
  // ALERTS: always use the language the ticket was joined in (ticket.lang) = source of truth, even if the page UI language is switched later.
  var alertLang = lang;
  function ta(k, o) { return tt(alertLang, k, o); }
  var sel = $('#q-lang');
  LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = l[1]; sel.appendChild(o); });
  sel.addEventListener('change', function () { lang = sel.value; try { localStorage.setItem('jk-lang', lang); } catch (e) {} applyLang(); render(); });

  function applyLang() {
    document.documentElement.lang = lang;
    sel.value = lang;
    $$('[data-q]').forEach(function (el) { el.textContent = t(el.getAttribute('data-q')); });
    $('#called-ok').textContent = ta('ok');
    var fs = $('#f-size'), cur = fs.value || '2';
    fs.innerHTML = '';
    for (var i = 1; i <= 12; i++) { var o = document.createElement('option'); o.value = i; o.textContent = t('party', { n: i }); fs.appendChild(o); }
    fs.value = cur;
    syncAlertLang();
  }
  var baseTitle = '';
  function syncAlertLang() {
    var st = api.getState(), id = ticketId(), me = id ? Q.findById(st, id) : null;
    alertLang = (me && me.lang && QI18N[me.lang]) ? me.lang : lang;
    curNo = me ? me.no : null;
    baseTitle = ta('title') + ' | 地獄蒸し工房 鉄輪';
    $('#called-ok').textContent = ta('ok');
    $('#called-banner').setAttribute('lang', alertLang);
    if (!$('#called-banner').hidden && alarmTimer) $('#called-msg').textContent = ta('calledMsg');
  }

  /* ---------- alerts: sound + vibration + banner + title flash + system notification ----------
   * Browsers only allow sound after a user tap, and throttle/freeze background tabs. So:
   *  - ONE AudioContext is created + resumed inside a tap (Join / Enable alerts / Test alert, or the first tap
   *    on the page after a reload) and a pre-generated WAV <audio> element is unlocked on the same tap as fallback.
   *  - Calls are detected by a signature (ticket + call counter + time) from the stored state, on every
   *    storage/BroadcastChannel event, a 1 s poll, and on visibilitychange / focus / pageshow, so a tab that was in
   *    the background alerts as soon as it can, and "Call again" re-alerts.
   *  - If the tab is hidden/unfocused, a system notification is shown (Notification API via a tiny service worker).
   */
  var ALERT_KEY = 'jk-q-alerts', DISMISS_KEY = 'jk-q-dismissed';
  var curNo = null, ac = null, audioEl = null, audioUnlocked = false, soundBlocked = false, swReg = null;
  var alertsEnabled = ss(ALERT_KEY) === '1';
  var alarmTimer = null, flashTimer = null, alarmStop = null, testTimer = null, alertedSig = null, dismissedSig = ss(DISMISS_KEY);
  var dbg = window.JKAlertDebug = { chimes: 0, audioPlays: 0, notified: 0, rings: 0, acState: function () { return ac ? ac.state : 'none'; } };
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }

  function makeWav() { // 1.5 s chime as a 16-bit mono WAV blob (fallback when WebAudio is unavailable/suspended)
    var sr = 22050, n = Math.floor(sr * 1.5), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    function w(o, str) { for (var i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    var notes = [[880, 0], [1174.66, .2], [1568, .4], [1174.66, .8], [1568, 1.0]];
    for (var i = 0; i < n; i++) {
      var t0 = i / sr, x = 0;
      notes.forEach(function (nt) { var d = t0 - nt[1]; if (d >= 0 && d < .3) x += Math.sin(2 * Math.PI * nt[0] * d) * Math.sin(Math.PI * d / .3) * .5; });
      v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 32000, true);
    }
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function setupAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !ac) { try { ac = new AC(); ac.onstatechange = updateStatus; } catch (e) { ac = null; } }
    if (!audioEl) { try { audioEl = new Audio(makeWav()); audioEl.preload = 'auto'; } catch (e) { audioEl = null; } }
  }
  // Must run inside a user gesture: creates/resumes the single AudioContext and unlocks the <audio> fallback.
  function unlockAudio(playReal) {
    setupAudio();
    try { if (ac && ac.resume) { var r = ac.resume(); if (r && r.then) r.then(updateStatus, updateStatus);
      var b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); } } catch (e) {}
    if (audioEl) { try {
      audioEl.muted = !playReal; audioEl.currentTime = 0;
      var p = audioEl.play();
      var done = function () { audioUnlocked = true; if (!playReal) { audioEl.pause(); } audioEl.muted = false; soundBlocked = false; updateStatus(); };
      if (p && p.then) p.then(done, function () { audioEl.muted = false; updateStatus(); }); else done();
    } catch (e) {} }
    updateStatus();
  }
  function soundReady() { return !!((ac && ac.state === 'running') || audioUnlocked); }
  function enableAlerts() {   // called from a tap
    alertsEnabled = true; ss(ALERT_KEY, '1');
    unlockAudio(false);
    chime();
    vibrate([80]);
    askNotifications();
    render();
  }
  function askNotifications() {
    try {
      if ('serviceWorker' in navigator && !swReg) {
        navigator.serviceWorker.register('sw.js', { scope: './' }).then(function () { return navigator.serviceWorker.ready; }).then(function (r) { swReg = r; }).catch(function () {});
      }
      if ('Notification' in window && Notification.permission === 'default') {
        var p = Notification.requestPermission(function () { updateStatus(); });
        if (p && p.then) p.then(updateStatus, updateStatus);
      }
    } catch (e) {}
    updateStatus();
  }
  function chime() {   // plays the sound; returns false if the browser blocked it
    dbg.chimes++;
    if (ac && ac.state === 'running') {
      try {
        var now = ac.currentTime;
        [[880, 0], [1174.66, .2], [1568, .4], [1174.66, .8], [1568, 1.0]].forEach(function (n) {
          var o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = n[0];
          g.gain.setValueAtTime(0.0001, now + n[1]);
          g.gain.exponentialRampToValueAtTime(0.4, now + n[1] + .03);
          g.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + .28);
          o.connect(g); g.connect(ac.destination); o.start(now + n[1]); o.stop(now + n[1] + .3);
        });
        soundBlocked = false; updateStatus(); return true;
      } catch (e) {}
    }
    if (ac && ac.resume) { try { ac.resume().then(updateStatus, function () {}); } catch (e) {} }
    if (audioEl) {
      try {
        audioEl.muted = false; audioEl.currentTime = 0;
        var p = audioEl.play(); dbg.audioPlays++;
        if (p && p.then) p.then(function () { audioUnlocked = true; soundBlocked = false; updateStatus(); }, function () { soundBlocked = true; updateStatus(); });
        return true;
      } catch (e) {}
    }
    soundBlocked = true; updateStatus(); return false;
  }
  function vibrate(p) { try { if (navigator.vibrate && !(navigator.userActivation && !navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) {} } // browsers ignore it until the page has been tapped once
  // System notification. Text is built from the TICKET language: by the service worker (sw.js, same dictionary) when it is
  // active, else locally. kind = 'called' | 'test' | 'noshow'
  function getReg() {
    if (swReg && swReg.active) return Promise.resolve(swReg);
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);
    return navigator.serviceWorker.getRegistration().then(function (r) { if (r) { swReg = r; if (!r.active) return navigator.serviceWorker.ready; } return r || null; }).catch(function () { return null; });
  }
  function notifText(l, kind, no) {
    return { title: '地獄蒸し工房 · ' + tt(l, 'yourNo') + ' ' + no,
             body: kind === 'called' ? tt(l, 'calledMsg') : kind === 'test' ? tt(l, 'testMsg') : tt(l, 's.noshow') };
  }
  function notify(kind, test) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      if (!test && !document.hidden && document.hasFocus()) return;   // only needed when the user is not looking at this tab
      var l = alertLang, no = curNo || '';
      var x = notifText(l, kind, no);
      var opts = { body: x.body, lang: l, tag: 'jk-queue-' + no, renotify: true, requireInteraction: kind === 'called', vibrate: [400, 150, 400, 150, 800] };
      var fallback = function () { var n = new Notification(x.title, opts); n.onclick = function () { try { window.focus(); } catch (e) {} n.close(); }; dbg.notified++; dbg.lastNotif = { title: x.title, body: x.body, lang: l, by: 'page' }; };
      getReg().then(function (r) {
        if (r && r.active) r.active.postMessage({ type: 'show', kind: kind, lang: l, no: no });   // sw.js builds + shows it
        else if (r && r.showNotification) r.showNotification(x.title, opts).then(function () { dbg.notified++; dbg.lastNotif = { title: x.title, body: x.body, lang: l, by: 'page-sw' }; }, function () { try { fallback(); } catch (e) {} });
        else fallback();
      });
    } catch (e) {}
  }
  try { if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'shown') { dbg.notified++; dbg.lastNotif = { title: e.data.title, body: e.data.body, lang: e.data.lang, by: 'sw' }; } }); } catch (e) {}
  function updateStatus() {
    var el = $('#alert-status'); if (!el) return;
    var snd = soundReady() ? ta('stSoundOk') : ta('stSoundTap');
    var nt = !('Notification' in window) ? ta('stNotifNA') : Notification.permission === 'granted' ? ta('stNotifOn') : ta('stNotifOff');
    el.textContent = snd + ' · ' + nt;
    el.className = 'meta alert-status' + (soundReady() ? ' ok' : ' warn');
    var h = $('#called-hint'); if (h) { h.hidden = !(soundBlocked && !soundReady()); h.textContent = ta('stSoundTap'); }
  }
  // Any tap/key re-unlocks sound (e.g. after a page reload, when the browser forgot the earlier tap).
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (alertsEnabled && !soundReady()) { unlockAudio(false); if (alarmTimer) chime(); }
      else if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    }, true);
  });

  function showBanner(msg) { $('#called-msg').textContent = msg; $('#called-banner').hidden = false; document.body.classList.add('is-called'); }
  function hideBanner() { $('#called-banner').hidden = true; document.body.classList.remove('is-called'); }
  function startFlash() {
    clearInterval(flashTimer); var on = false;
    flashTimer = setInterval(function () { on = !on; document.title = on ? ta('tab') : baseTitle; }, 900);
  }
  function startAlarm() {
    stopAlarm();
    dbg.rings++;
    showBanner(ta('calledMsg'));
    var ring = function () { chime(); vibrate([400, 150, 400, 150, 800]); };
    ring(); alarmTimer = setInterval(ring, 3500);
    startFlash();
    notify('called', false);
    alarmStop = setTimeout(stopAlarm, 90000); // never ring forever
  }
  function stopAlarm() {
    clearInterval(alarmTimer); clearInterval(flashTimer); clearTimeout(alarmStop); clearTimeout(testTimer);
    alarmTimer = flashTimer = alarmStop = testTimer = null;
    vibrate(0);
    hideBanner();
    document.title = baseTitle;
    try { if (swReg && swReg.getNotifications) swReg.getNotifications({ tag: 'jk-queue-' + curNo }).then(function (l) { l.forEach(function (n) { n.close(); }); }); } catch (e) {}
  }
  function testAlert() {      // sound + vibration + banner + notification, same path as a real call but short
    unlockAudio(false); askNotifications();
    chime(); vibrate([200, 100, 200]);
    showBanner(ta('testMsg'));
    clearTimeout(testTimer); testTimer = setTimeout(function () { if (!alarmTimer) hideBanner(); }, 6000);
    notify('test', true);
  }
  $('#called-ok').addEventListener('click', function () { dismissedSig = alertedSig; ss(DISMISS_KEY, dismissedSig); stopAlarm(); });
  $('#alerts-btn').addEventListener('click', enableAlerts);
  $('#test-btn').addEventListener('click', testAlert);

  /* ---------- ticket ---------- */
  function ticketId() { try { return sessionStorage.getItem(TICKET_KEY); } catch (e) { return null; } }
  function setTicket(id) { try { id ? sessionStorage.setItem(TICKET_KEY, id) : sessionStorage.removeItem(TICKET_KEY); } catch (e) {} }

  $('#join-form').addEventListener('submit', function (e) {
    e.preventDefault();
    enableAlerts();   // the Join tap is a user gesture: unlock sound + ask for notifications right here
    api.join({ size: $('#f-size').value, nick: $('#f-nick').value, lang: lang }).then(function (en) {
      setTicket(en.id); $('#f-nick').value = ''; render(); $('#t-no').focus();
    }).catch(function (err) { if (err && err.code === 'closed') render(); });
  });
  $('#leave-btn').addEventListener('click', function () { if (confirm(t('leaveQ'))) { var id = ticketId(); api.leave(id); } });
  $('#again-btn').addEventListener('click', function () { setTicket(null); alertedSig = null; stopAlarm(); render(); $('#f-size').focus(); });

  /* ---------- render ---------- */
  var lastStatus = null, lastLive = '', lastRev = -1;
  function render() {
    var st = api.getState(), id = ticketId(), me = id ? Q.findById(st, id) : null;
    lastRev = st.rev;
    if (id && !me) { setTicket(null); id = null; }   // queue was reset by staff
    syncAlertLang();
    var waitingN = Q.waiting(st).length;

    $('#join-view').hidden = !!me;
    $('#ticket-view').hidden = !me;
    var b = $('#q-open-badge'); b.textContent = st.open ? t('open') : t('closedB'); b.className = 'badge' + (st.open ? '' : ' closed');
    $('#q-waiting-now').textContent = t('waitingNow', { n: waitingN });
    $('#f-join').disabled = !st.open; $('#closed-msg').hidden = st.open;

    if (!me) { lastStatus = null; stopAlarm(); document.title = baseTitle; return; }

    var live = me.status === 'waiting' && me.status !== lastStatus;
    $('#t-no').textContent = me.no; $('#t-no').setAttribute('aria-label', t('yourNo') + ' ' + me.no);
    $('#t-id').textContent = me.id;
    $('#t-party').textContent = t('party', { n: me.size }) + (me.nick ? ' · ' + me.nick : '');
    var s = $('#t-status'); s.textContent = t('s.' + me.status); s.className = 'status ' + me.status;

    var active = me.status === 'waiting';
    var ahead = active ? Q.groupsAhead(st, me) : 0;
    $('#t-ahead').hidden = !active; $('#t-wait').hidden = !active;
    if (active) {
      $('#t-ahead').innerHTML = ''; var a = $('#t-ahead');
      if (ahead === 0) a.textContent = t('next');
      else { var txt = t('ahead', { n: '\u0001' }).split('\u0001'); a.appendChild(document.createTextNode(txt[0])); var bb = document.createElement('b'); bb.textContent = ahead; a.appendChild(bb); a.appendChild(document.createTextNode(txt[1] || '')); }
      $('#t-wait').textContent = ahead === 0 ? '' : t('wait', { n: ahead * Q.AVG_MIN_PER_GROUP });
      $('#t-wait').hidden = ahead === 0;
    }
    var done = !(me.status === 'waiting' || me.status === 'called');
    $('#leave-btn').hidden = done; $('#again-btn').hidden = !done;
    $('#alert-row').hidden = done; $('#alerts-btn').hidden = alertsEnabled; $('#test-btn').hidden = !alertsEnabled; $('#alerts-on').hidden = !alertsEnabled || done;
    $('#alert-status').hidden = !alertsEnabled || done; updateStatus();

    // transitions: a "call" is identified by ticket + call counter + time, so Call again re-alerts
    if (me.status === 'called') {
      var sig = me.id + ':' + (me.calls || 1) + ':' + me.calledAt;
      if (alertedSig !== sig) { alertedSig = sig; if (dismissedSig !== sig) startAlarm(); }
      else if (!$('#called-banner').hidden) $('#called-msg').textContent = ta('calledMsg');
    } else { alertedSig = null; stopAlarm(); }
    if (me.status === 'waiting') document.title = '#' + me.no + ' · ' + (ahead ? ta('ahead', { n: ahead }) : ta('next')) + ' | ' + baseTitle;
    if (me.status === 'noshow' && (lastStatus === 'waiting' || lastStatus === 'called')) {   // staff marked no-show: alert in the ticket language
      showBanner(ta('s.noshow')); clearTimeout(testTimer); testTimer = setTimeout(hideBanner, 8000); notify('noshow', false); document.title = ta('s.noshow') + ' | ' + baseTitle;
    }
    else if (me.status !== 'called' && me.status !== 'noshow') document.title = baseTitle;

    var msg = me.status === 'called' ? ta('calledMsg') : me.status === 'waiting' ? ta('yourNo') + ' ' + me.no + '. ' + (ahead ? ta('ahead', { n: ahead }) : ta('next')) : ta('s.' + me.status);
    if (msg !== lastLive) { $('#q-live').textContent = msg; lastLive = msg; }
    lastStatus = me.status;
  }

  applyLang();
  render();
  api.subscribe(render);
  // Background tabs: timers are throttled and mobile tabs may be frozen, so re-read the stored state whenever we
  // can (return to the tab, focus, back/forward cache, network back) and poll once a second as a safety net.
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) {} } render(); } });
  window.addEventListener('focus', render);
  window.addEventListener('pageshow', render);
  window.addEventListener('online', render);
  setInterval(function () { var r = api.getState().rev; if (r !== lastRev) render(); }, 1000);
  if (alertsEnabled) { setupAudio(); askNotifications(); }
  // embedded in the demo console: hide page chrome
  if (/[?&]embed=1/.test(location.search)) document.body.classList.add('embed');
})();
