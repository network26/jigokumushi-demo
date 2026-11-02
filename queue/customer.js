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
  function t(k, o) {
    var s = (QI18N[lang] && QI18N[lang][k] != null) ? QI18N[lang][k] : (QI18N.en[k] != null ? QI18N.en[k] : k);
    return o ? s.replace(/\{n\}/g, o.n) : s;
  }
  var sel = $('#q-lang');
  LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = l[1]; sel.appendChild(o); });
  sel.addEventListener('change', function () { lang = sel.value; try { localStorage.setItem('jk-lang', lang); } catch (e) {} applyLang(); render(); });

  function applyLang() {
    document.documentElement.lang = lang;
    sel.value = lang;
    $$('[data-q]').forEach(function (el) { el.textContent = t(el.getAttribute('data-q')); });
    $('#called-ok').textContent = t('ok');
    var fs = $('#f-size'), cur = fs.value || '2';
    fs.innerHTML = '';
    for (var i = 1; i <= 12; i++) { var o = document.createElement('option'); o.value = i; o.textContent = t('party', { n: i }); fs.appendChild(o); }
    fs.value = cur;
    baseTitle = t('title') + ' | 地獄蒸し工房 鉄輪';
  }
  var baseTitle = '';

  /* ---------- alerts: sound + vibration + banner + tab title flash ---------- */
  var ac = null, alertsEnabled = false, alarmTimer = null, flashTimer = null, alarmStop = null, dismissed = {};
  function enableAlerts() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !ac) ac = new AC();
      if (ac && ac.resume) ac.resume();
    } catch (e) { ac = null; }
    alertsEnabled = true;       // set from a user tap, as browsers require
    chime(); vibrate([80]);
    render();
  }
  function chime() {
    if (!ac) return;
    try {
      var now = ac.currentTime;
      [[880, 0], [1174.66, .2], [1568, .4], [1174.66, .8], [1568, 1.0]].forEach(function (n) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, now + n[1]);
        g.gain.exponentialRampToValueAtTime(0.35, now + n[1] + .03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + .28);
        o.connect(g); g.connect(ac.destination); o.start(now + n[1]); o.stop(now + n[1] + .3);
      });
    } catch (e) {}
  }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  var origTitle = null;
  function startAlarm() {
    stopAlarm();
    $('#called-msg').textContent = t('calledMsg');
    $('#called-banner').hidden = false;
    document.body.classList.add('is-called');
    var ring = function () { chime(); vibrate([400, 150, 400, 150, 800]); };
    ring(); alarmTimer = setInterval(ring, 3500);
    var on = false;
    flashTimer = setInterval(function () { on = !on; document.title = on ? t('tab') : baseTitle; }, 900);
    alarmStop = setTimeout(stopAlarm, 90000); // never ring forever
  }
  function stopAlarm() {
    clearInterval(alarmTimer); clearInterval(flashTimer); clearTimeout(alarmStop);
    alarmTimer = flashTimer = alarmStop = null;
    vibrate(0);
    $('#called-banner').hidden = true;
    document.body.classList.remove('is-called');
    document.title = baseTitle;
  }
  $('#called-ok').addEventListener('click', function () { var id = ticketId(); if (id) dismissed[id] = true; stopAlarm(); });
  $('#alerts-btn').addEventListener('click', enableAlerts);
  $('#test-btn').addEventListener('click', function () { chime(); vibrate([200, 100, 200]); });

  /* ---------- ticket ---------- */
  function ticketId() { try { return sessionStorage.getItem(TICKET_KEY); } catch (e) { return null; } }
  function setTicket(id) { try { id ? sessionStorage.setItem(TICKET_KEY, id) : sessionStorage.removeItem(TICKET_KEY); } catch (e) {} }

  $('#join-form').addEventListener('submit', function (e) {
    e.preventDefault();
    api.join({ size: $('#f-size').value, nick: $('#f-nick').value }).then(function (en) {
      setTicket(en.id); $('#f-nick').value = ''; render(); $('#t-no').focus();
    }).catch(function (err) { if (err && err.code === 'closed') render(); });
  });
  $('#leave-btn').addEventListener('click', function () { if (confirm(t('leaveQ'))) { var id = ticketId(); api.leave(id); } });
  $('#again-btn').addEventListener('click', function () { setTicket(null); stopAlarm(); render(); $('#f-size').focus(); });

  /* ---------- render ---------- */
  var lastStatus = null, lastLive = '';
  function render() {
    var st = api.getState(), id = ticketId(), me = id ? Q.findById(st, id) : null;
    if (id && !me) { setTicket(null); id = null; }   // queue was reset by staff
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

    // transitions
    if (me.status === 'called') { if (lastStatus !== 'called' && !dismissed[me.id]) startAlarm(); else if ($('#called-banner').hidden === false) $('#called-msg').textContent = t('calledMsg'); }
    else { stopAlarm(); }
    if (me.status === 'waiting') document.title = '#' + me.no + ' · ' + (ahead ? t('ahead', { n: ahead }) : t('next')) + ' | ' + baseTitle;
    else if (me.status !== 'called') document.title = baseTitle;

    var msg = me.status === 'called' ? t('calledMsg') : me.status === 'waiting' ? t('yourNo') + ' ' + me.no + '. ' + (ahead ? t('ahead', { n: ahead }) : t('next')) : t('s.' + me.status);
    if (msg !== lastLive) { $('#q-live').textContent = msg; lastLive = msg; }
    lastStatus = me.status;
  }

  applyLang();
  render();
  api.subscribe(render);
  // keep "tab title" fresh if user returns to the tab
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
})();
