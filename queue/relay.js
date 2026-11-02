/*
 * Class-demo relay for the queue DEMO  (window.JKRelay)
 * ---------------------------------------------------------------------------------------------
 * Lets several phones share one queue with NO account and NO server of ours, using the free public
 * relay ntfy.sh (HTTP publish + SSE/JSON subscribe, CORS enabled).  Two topics per session:
 *     jgkm-<sid>-j   phones -> staff   {t:'join'|'leave', id, ...}     (public write; staff only reads)
 *     jgkm-<sid>-s   staff -> phones   signed queue snapshots           (public write, but SIGNED)
 * <sid> is 128 random bits (unguessable) and travels only inside the QR code.
 *
 * Security model (demo level):
 *  - The staff device holds an ECDSA P-256 private key (created once per session, kept in its localStorage).
 *    Its PUBLIC key is inside the QR link (#c=<sid>.<pubkey>). Phones verify every snapshot's signature, so
 *    nobody else can fake "it's your turn", even though anyone who scans the QR can technically post to the topic.
 *  - Snapshots carry an increasing sequence number (old/replayed ones are ignored) and an epoch (queue reset).
 *  - A phone's ticket id is derived from a secret only that phone knows (id = hash(secret)), and "leave" needs
 *    the secret, so others cannot cancel your ticket although ids are visible in snapshots.
 *  - Joins are NOT authenticated (anyone with the QR can join, like a real queue QR). No personal data: only an
 *    optional nickname, party size and language.  Messages pass through a PUBLIC relay: do not enter personal info.
 *  - The staff page keeps the authoritative queue in its own localStorage and recovers joins made while it was
 *    closed from ntfy's cached history (ntfy.sh keeps messages ~12 hours).
 */
(function (g) {
  'use strict';
  var BASE = 'https://ntfy.sh', ENC = new TextEncoder(), DEC = new TextDecoder();
  var EC = { name: 'ECDSA', namedCurve: 'P-256' }, SIG = { name: 'ECDSA', hash: 'SHA-256' };
  var ST = ['waiting', 'called', 'seated', 'noshow', 'left'];

  function b64u(buf) { var b = new Uint8Array(buf), s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  function rand(n) { var b = new Uint8Array(n); g.crypto.getRandomValues(b); return b; }
  function topicJ(sid) { return 'jgkm-' + sid + '-j'; }
  function topicS(sid) { return 'jgkm-' + sid + '-s'; }
  function signedText(topic, body) { return ENC.encode('jgkm1|' + topic + '|' + body); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function lsj(k, v) { if (v === undefined) { try { return JSON.parse(ls(k)); } catch (e) { return null; } } ls(k, v === null ? null : JSON.stringify(v)); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ticket id = 8 chars of the same unambiguous alphabet, derived from the phone's secret */
  var A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function idFromSecret(secret) {
    return g.crypto.subtle.digest('SHA-256', ENC.encode('jgkm-ticket|' + secret)).then(function (h) {
      var b = new Uint8Array(h), s = ''; for (var i = 0; i < 8; i++) { s += A[b[i] % A.length]; if (i === 3) s += '-'; } return s;
    });
  }

  /* ---------------- ntfy client: publish / poll / stream ---------------- */
  function publish(topic, body) {
    return fetch(BASE + '/' + topic, { method: 'POST', body: body, cache: 'no-store' }).then(function (r) {
      if (!r.ok) { var e = new Error('ntfy ' + r.status); e.status = r.status; throw e; } return r.json();
    });
  }
  function pollMsgs(topic, since) {   // -> [{id,time,message}] oldest first
    return fetch(BASE + '/' + topic + '/json?poll=1&since=' + encodeURIComponent(since || 'all'), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) { var e = new Error('ntfy ' + r.status); e.status = r.status; throw e; } return r.text();
    }).then(function (txt) {
      var out = []; txt.split('\n').forEach(function (l) { if (!l) return; try { var m = JSON.parse(l); if (m.event === 'message') out.push(m); } catch (e) {} });
      return out;
    });
  }
  /* live stream with reconnect + fall back to slow polling when the relay refuses many streams from one IP (30/IP on ntfy.sh) */
  function Stream(topic, getSince, onMsgs, onState) {
    var es = null, fails = 0, timer = null, polling = false, stopped = false, busy = false;
    function state(s) { try { onState && onState(s); } catch (e) {} }
    function pollOnce() {
      if (busy) return Promise.resolve(); busy = true;
      return pollMsgs(topic, getSince()).then(function (m) { busy = false; if (m.length) onMsgs(m); state(es ? 'live' : 'polling'); }, function (e) { busy = false; state(es ? 'live' : 'offline'); });
    }
    function open() {
      if (stopped || es || polling) return;
      try { es = new EventSource(BASE + '/' + topic + '/sse?since=' + encodeURIComponent(getSince())); } catch (e) { fail(); return; }
      es.addEventListener('message', function (ev) { try { onMsgs([JSON.parse(ev.data)]); } catch (e) {} });
      es.onopen = function () { fails = 0; state('live'); };
      es.onerror = function () { if (es) { es.close(); es = null; } fail(); };
    }
    function fail() {
      state('offline'); fails++;
      if (fails >= 3 && !polling) { polling = true; schedulePoll(); setTimeout(function () { polling = false; fails = 0; open(); }, 300000); return; }  // retry streaming in 5 min
      clearTimeout(timer); timer = setTimeout(open, Math.min(30000, 2500 * Math.pow(2, fails)));
    }
    function schedulePoll() { if (stopped || !polling) return; pollOnce(); setTimeout(schedulePoll, 60000 + Math.random() * 40000); }
    return {
      start: function () { open(); return Promise.resolve(); },   // one request only: the stream itself replays cached history (free tier allows few requests per IP)
      resync: function () { return pollOnce().then(function () { if (!es && !polling) open(); }); },
      stop: function () { stopped = true; if (es) es.close(); es = null; clearTimeout(timer); }
    };
  }
  function onWake(fn) {
    var last = 0, f = function () { var n = Date.now(); if (n - last < 800) return; last = n; fn(); };
    document.addEventListener('visibilitychange', function () { if (!document.hidden) f(); });
    g.addEventListener('focus', f); g.addEventListener('pageshow', f); g.addEventListener('online', f);
  }

  /* ---------------- links ---------------- */
  function joinUrl(sid, pk) { return new URL('./', g.location.href).href.split('#')[0].split('?')[0] + '#c=' + sid + '.' + pk; }
  function parseClass(h) { var m = /[#&]c=([A-Za-z0-9_-]{16,32})\.([A-Za-z0-9_-]{80,90})/.exec(h || ''); return m ? { sid: m[1], pk: m[2] } : null; }

  /* =========================== customer (phone) side =========================== */
  function Customer(cfg) {
    var sid = cfg.sid, pk = cfg.pk, tS = topicS(sid), tJ = topicJ(sid), K_ME = 'jk-class-me-' + sid, K_SNAP = 'jk-class-snap-' + sid, K_LAST = 'jk-class-last-' + sid;
    var verifyKey = g.crypto.subtle.importKey('raw', unb64u(pk), EC, false, ['verify']);
    var subs = [], me = lsj(K_ME), snap = lsj(K_SNAP), seq = snap ? snap.s : 0, rev = 1, lastId = ls(K_LAST) || '', net = 'connecting';
    var stream;

    function emit() { rev++; subs.slice().forEach(function (f) { try { f(getState()); } catch (e) { if (g.console) console.error(e); } }); }
    function saveMe() { lsj(K_ME, me); }
    function getState() {
      var s = snap || { s: 0, o: 1, n: 1, ep: '', ra: 0, e: [] };
      var entries = s.e.map(function (a) { return { id: a[0], no: a[1], status: ST[a[2]] || 'left', calls: a[3] || 0, calledAt: a[4] ? a[4] * 1000 : null, size: 1, nick: '', lang: null }; });
      var pending = null;
      if (me) {
        var mine = null; entries.forEach(function (e) { if (e.id === me.id) mine = e; });
        if (mine) { mine.size = me.size; mine.nick = me.nick; mine.lang = me.lang; mine.joinedAt = me.joinedAt; if (me.left) mine.status = 'left'; }
        else if (me.seen || me.left) entries.push({ id: me.id, no: me.no || 0, size: me.size, nick: me.nick, lang: me.lang, status: 'left', calls: 0, calledAt: null, joinedAt: me.joinedAt });
        else pending = { id: me.id, no: 0, pending: true, size: me.size, nick: me.nick, lang: me.lang, status: 'waiting', calls: 0, calledAt: null, joinedAt: me.joinedAt };
      }
      return { open: !!s.o, nextNo: s.n, entries: entries, pending: pending, rev: rev, net: net };
    }

    function verifyMsg(m) {
      var body = m.message || '', i = body.lastIndexOf('|'); if (i < 0) return Promise.resolve(null);
      var json = body.slice(0, i), sig; try { sig = unb64u(body.slice(i + 1)); } catch (e) { return Promise.resolve(null); }
      return verifyKey.then(function (k) { return g.crypto.subtle.verify(SIG, k, sig, signedText(tS, json)); }).then(function (ok) {
        if (!ok) return null; try { var p = JSON.parse(json); return (p && typeof p.s === 'number' && Array.isArray(p.e)) ? p : null; } catch (e) { return null; }
      }, function () { return null; });
    }
    var chain = Promise.resolve();
    function onMsgs(list) {
      chain = chain.then(function () {
        var best = null;
        // newest first; the first valid one wins (a flood of junk cannot hide the real snapshot, but costs us a few verifies)
        var arr = list.slice().reverse(), idx = 0;
        function next() {
          if (idx >= arr.length) return Promise.resolve();
          var m = arr[idx++];
          return verifyMsg(m).then(function (p) { if (p) { best = p; return; } return next(); });
        }
        return next().then(function () {
          if (list.length) { lastId = list[list.length - 1].id || lastId; ls(K_LAST, lastId); }
          if (best && best.s > seq) apply(best);
        });
      });
      return chain;
    }
    function apply(p) {
      seq = p.s; snap = p; lsj(K_SNAP, p);
      if (me) {
        if (p.ra && p.ra - me.joinedAt > 120000) { me = null; lsj(K_ME, null); }                       // queue was reset by staff after we joined
        else if (me && snap.ep && me.ep && snap.ep !== me.ep) { me = null; lsj(K_ME, null); }
        else if (me) {
          var found = null; p.e.forEach(function (a) { if (a[0] === me.id) found = a; });
          if (found) { me.seen = true; me.no = found[1]; me.ep = p.ep; saveMe(); }
        }
      }
      emit();
    }
    function setNet(s) { if (s !== net) { net = s; emit(); } }

    stream = Stream(tS, function () { return lastId || 'all'; }, onMsgs, setNet);
    onWake(function () { stream.resync(); tryPost(); });
    stream.start();

    var posting = false;
    function post(obj) { return publish(tJ, JSON.stringify(obj)); }
    function tryPost() {
      if (!me || me.posted || posting || (me.tries || 0) >= 30) return;
      posting = true; me.tries = (me.tries || 0) + 1; saveMe();
      post({ t: 'join', id: me.id, size: me.size, nick: me.nick, lang: me.lang, ts: me.joinedAt }).then(function () { me.posted = true; saveMe(); posting = false; },
        function () { posting = false; setTimeout(tryPost, Math.min(20000, 3000 * me.tries)); });
    }

    return {
      kind: 'class-relay', sid: sid,
      getState: getState,
      subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (x) { return x !== fn; }); }; },
      sync: function () { return stream.resync(); },
      myId: function () { return me && me.id || null; },
      clearMe: function () { me = null; lsj(K_ME, null); emit(); },
      join: function (o) {
        if (me && !me.seen && !me.left) return Promise.resolve(getState().entries.filter(function (e) { return e.id === me.id; })[0]);
        var secret = b64u(rand(12));
        return idFromSecret(secret).then(function (id) {
          me = { id: id, secret: secret, size: Math.min(20, Math.max(1, parseInt(o.size, 10) || 1)), nick: String(o.nick || '').trim().slice(0, 20), lang: o.lang || 'en', joinedAt: Date.now(), posted: false, tries: 0, seen: false };
          saveMe(); tryPost(); emit();
          return getState().entries.filter(function (e) { return e.id === id; })[0];
        });
      },
      leave: function () { if (!me) return Promise.resolve(); var m = me; me.left = true; saveMe(); emit(); return post({ t: 'leave', id: m.id, secret: m.secret }).catch(function () {}); }
    };
  }

  /* =========================== staff side =========================== */
  function importPriv(jwk) { return g.crypto.subtle.importKey('jwk', jwk, EC, false, ['sign']); }
  function createSession() {
    return g.crypto.subtle.generateKey(EC, true, ['sign', 'verify']).then(function (kp) {
      return Promise.all([g.crypto.subtle.exportKey('jwk', kp.privateKey), g.crypto.subtle.exportKey('raw', kp.publicKey)]).then(function (r) {
        return { sid: b64u(rand(16)), pk: b64u(r[1]), jwk: r[0], created: Date.now() };
      });
    });
  }
  function Staff(sess, local) {
    var sid = sess.sid, tS = topicS(sid), tJ = topicJ(sid), K_SEQ = 'jk-class-seq-' + sid, K_CUR = 'jk-class-jcur-' + sid, K_LAST = 'jk-class-lastbody-' + sid;
    var priv = importPriv(sess.jwk), cur = ls(K_CUR) || '', subs = [], status = { pub: 'idle', listen: 'connecting', joins: 0, lastPub: 0, err: '' };
    function emitStatus() { subs.slice().forEach(function (f) { try { f(status); } catch (e) {} }); }

    /* intake: joins/leaves from phones (history first, then live) */
    var chain = Promise.resolve();
    function intake(list) {
      chain = chain.then(function () {
        return list.reduce(function (p, m) {
          return p.then(function () {
            var o; try { o = JSON.parse(m.message); } catch (e) { return; }
            if (!o || typeof o.id !== 'string') return;
            if (o.t === 'join') {
              var lang = typeof o.lang === 'string' ? o.lang.slice(0, 8) : 'en';
              return local.join({ id: o.id, size: o.size, nick: o.nick, lang: lang, ts: o.ts }).then(function () { status.joins++; schedule(3000); }, function () {});   // joins are batched (free tier: 250 messages/day per IP)
            }
            if (o.t === 'leave' && typeof o.secret === 'string') {
              return idFromSecret(o.secret).then(function (id) { if (id === o.id) return local.leave(o.id); });
            }
          });
        }, Promise.resolve()).then(function () { if (list.length) { cur = list[list.length - 1].id || cur; ls(K_CUR, cur); } emitStatus(); });
      });
      return chain;
    }
    var stream = Stream(tJ, function () { return cur || 'all'; }, intake, function (s) { status.listen = s; emitStatus(); });
    onWake(function () { stream.resync(); });
    stream.start();

    /* publish signed snapshots (debounced; identical content is not re-sent) */
    var pubTimer = null, pubBusy = false, again = false;
    function build(seqNo) {
      var st = local.getState(), act = [], fin = [];
      st.entries.forEach(function (e) { var a = [e.id, e.no, Math.max(0, ST.indexOf(e.status)), e.calls || 0, e.calledAt ? Math.round(e.calledAt / 1000) : 0]; (e.status === 'waiting' || e.status === 'called' ? act : fin).push(a); });
      fin.sort(function (a, b) { return b[1] - a[1]; });
      var p = { s: seqNo, o: st.open ? 1 : 0, n: st.nextNo, ep: st.epoch || '', ra: st.resetAt || 0, e: act.concat(fin) };
      while (JSON.stringify(p).length > 3500 && p.e.length > act.length) p.e.pop();   // keep the newest finished ones, drop the oldest (phones show "left")
      return p;
    }
    function publishNow() {
      if (pubBusy) { again = true; return; }
      var body0 = JSON.stringify(build(0)).replace(/^\{"s":0,/, '');
      if (ls(K_LAST) === body0 && !publishNow.force) return;
      pubBusy = true; publishNow.force = false;
      var seqNo = Math.max(Date.now(), (+ls(K_SEQ) || 0) + 1); ls(K_SEQ, String(seqNo));
      var json = JSON.stringify(build(seqNo));
      status.pub = 'sending'; emitStatus();
      priv.then(function (k) { return g.crypto.subtle.sign(SIG, k, signedText(tS, json)); }).then(function (sig) {
        return publish(tS, json + '|' + b64u(sig));
      }).then(function () { ls(K_LAST, body0); status.pub = 'ok'; status.lastPub = Date.now(); status.err = ''; }, function (e) {
        status.pub = 'error'; status.err = String(e && e.message || e); setTimeout(function () { publishNow.force = true; schedule(); }, e && e.status === 429 ? 30000 : 5000);
      }).then(function () { pubBusy = false; emitStatus(); if (again) { again = false; schedule(); } });
    }
    function schedule(d) { clearTimeout(pubTimer); pubTimer = setTimeout(publishNow, typeof d === 'number' ? d : 350); }
    local.subscribe(function () { schedule(); });
    setTimeout(function () { publishNow.force = !ls(K_LAST); publishNow(); }, 1500);   // on open: publish if never published or changed

    return {
      status: function () { return status; }, onStatus: function (fn) { subs.push(fn); },
      republish: function () { publishNow.force = true; schedule(); },
      stop: function () { stream.stop(); }
    };
  }

  g.JKRelay = {
    BASE: BASE, b64u: b64u, unb64u: unb64u,
    joinUrl: joinUrl, parseClass: parseClass, createSession: createSession,
    customer: function (cfg) { return Customer(cfg); },
    staff: function (sess, local) { return Staff(sess, local); },
    qrSvg: function (text, px) {
      var q = g.qrcode(0, 'M'); q.addData(text); q.make();
      var n = q.getModuleCount(), quiet = 4, size = n + quiet * 2, d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" ' + (px ? 'width="' + px + '" height="' + px + '" ' : '') + 'shape-rendering="crispEdges" role="img"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    }
  };
})(window);
