/*
 * Jigokumushi Kobo – QR queue  (DEMO, fully client-side)
 * ------------------------------------------------------------------
 * Everything the UI needs goes through ONE small "adapter" interface, so the
 * localStorage demo below can be swapped for a real backend without touching
 * customer.js / staff.js:
 *
 *   adapter.getState()          -> { open:Boolean, nextNo:Number, entries:[Entry] }
 *   adapter.subscribe(fn)       -> unsubscribe()   fn(state) is called on every change (any tab/device)
 *   adapter.join({size,nick,lang}) -> Promise<Entry>  (server assigns number + random ticket id)
 *   adapter.leave(id)           -> Promise         (customer leaves)
 *   adapter.callNext()          -> Promise<Entry|null>   first waiting -> called
 *   adapter.call(id)            -> Promise         waiting -> called
 *   adapter.seat(id)            -> Promise         called  -> seated
 *   adapter.noShow(id)          -> Promise         waiting/called -> noshow
 *   adapter.setOpen(bool)       -> Promise         close / reopen the queue
 *   adapter.reset()             -> Promise         clear everything, numbers restart at 1
 *
 *   Entry = { id:'K7F2-9QXD' (random ticket id), no:12, size:2, nick:'', status:
 *             'waiting'|'called'|'seated'|'noshow'|'left', joinedAt:ms, calledAt:ms|null, calls:int, doneAt:ms|null }
 *
 * Planned production backend (recommended): Cloudflare Workers + D1 (queue tables),
 * a Durable Object or SSE/WebSocket for live pushes, Turnstile on join (bot protection) and
 * Cloudflare Access in front of /queue/staff* (real staff login instead of the private-link key).
 * See queue/README.md for the endpoint sketch. RemoteAdapter below is the stub to fill in.
 */
(function (global) {
  'use strict';

  var KEY = 'jk-queue-demo-v1';
  var CH = 'jk-queue-demo';
  var AVG_MIN_PER_GROUP = 8; // demo estimate only

  function randomId() {
    // random, non-guessable ticket id (no personal data). Unambiguous alphabet.
    var A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', b = new Uint8Array(8), s = '';
    (global.crypto || global.msCrypto).getRandomValues(b);
    for (var i = 0; i < 8; i++) { s += A[b[i] % A.length]; if (i === 3) s += '-'; }
    return s;
  }

  function fresh() { return { open: true, nextNo: 1, entries: [], rev: 0, epoch: randomId(), resetAt: 0 }; }

  /* ---------------- Local (demo) adapter ---------------- */
  function LocalAdapter(opts) {
    var KEY_ = (opts && opts.key) || KEY, CH_ = (opts && opts.channel) || CH;   // class-demo staff state lives under its own key
    var subs = [];
    var chan = null;
    try { chan = ('BroadcastChannel' in global) ? new BroadcastChannel(CH_) : null; } catch (e) { chan = null; }

    function read() {
      try {
        var s = JSON.parse(global.localStorage.getItem(KEY_));
        if (s && Array.isArray(s.entries)) return s;
      } catch (e) {}
      return fresh();
    }
    function emit() { var st = read(); subs.slice().forEach(function (f) { try { f(st); } catch (e) { if (global.console) console.error(e); } }); }
    function write(st) {
      st.rev = (st.rev || 0) + 1;
      global.localStorage.setItem(KEY_, JSON.stringify(st));
      if (chan) { try { chan.postMessage({ t: 'changed', rev: st.rev }); } catch (e) {} }
      emit(); // this tab (storage events don't fire in the writing tab)
      return st;
    }
    // other tabs/windows of the same browser
    if (chan) chan.onmessage = function () { emit(); };
    global.addEventListener('storage', function (e) { if (e.key === KEY_ || e.key === null) emit(); });

    function find(st, id) { for (var i = 0; i < st.entries.length; i++) if (st.entries[i].id === id) return st.entries[i]; return null; }
    function mutate(fn) { try { var st = read(); var r = fn(st); write(st); return Promise.resolve(r); } catch (e) { return Promise.reject(e); } }

    return {
      kind: 'local-demo',
      getState: read,
      subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (x) { return x !== fn; }); }; },
      join: function (o) {
        return mutate(function (st) {
          if (!st.open) { var err = new Error('closed'); err.code = 'closed'; throw err; }
          var rid = /^[A-Za-z0-9-]{6,16}$/.test(o.id || '') ? o.id : null;   // class demo: the phone chooses its own (secret-derived) id; joining twice = no-op
          if (rid) { var ex = find(st, rid); if (ex) return ex; }
          var e = { id: rid || randomId(), no: st.nextNo++, size: Math.min(20, Math.max(1, parseInt(o.size, 10) || 1)),
                    nick: String(o.nick || '').trim().slice(0, 20), lang: /^[A-Za-z]{2,3}(-[A-Za-z]{2,4})?$/.test(o.lang || '') ? o.lang : 'en', status: 'waiting', joinedAt: Math.min(Date.now(), +o.ts || Date.now()), calledAt: null, doneAt: null };
          st.entries.push(e); return e;
        });
      },
      leave: function (id) { return mutate(function (st) { var e = find(st, id); if (e && (e.status === 'waiting' || e.status === 'called')) { e.status = 'left'; e.doneAt = Date.now(); } }); },
      callNext: function () {
        return mutate(function (st) {
          var w = st.entries.filter(function (e) { return e.status === 'waiting'; }).sort(function (a, b) { return a.no - b.no; })[0];
          if (w) { w.status = 'called'; w.calledAt = Date.now(); w.calls = (w.calls || 0) + 1; }
          return w || null;
        });
      },
      call: function (id) { return mutate(function (st) { var e = find(st, id); if (e && (e.status === 'waiting' || e.status === 'called')) { e.status = 'called'; e.calledAt = Date.now(); e.calls = (e.calls || 0) + 1; } }); }, // also "Call again"
      seat: function (id) { return mutate(function (st) { var e = find(st, id); if (e && e.status === 'called') { e.status = 'seated'; e.doneAt = Date.now(); } }); },
      noShow: function (id) { return mutate(function (st) { var e = find(st, id); if (e && (e.status === 'waiting' || e.status === 'called')) { e.status = 'noshow'; e.doneAt = Date.now(); } }); },
      setOpen: function (v) { return mutate(function (st) { st.open = !!v; }); },
      reset: function () { return mutate(function (st) { var f = fresh(); st.open = true; st.nextNo = 1; st.entries = f.entries; st.epoch = f.epoch; st.resetAt = Date.now(); }); }
    };
  }

  /* ---------------- Remote adapter (stub for the real backend) ----------------
   * Later: fetch('/api/queue/...') against a Cloudflare Worker (D1 for storage),
   * subscribe() via EventSource / WebSocket (Durable Object) or short polling.
   * Keep the same method names + Entry shape and nothing else needs to change.   */
  function RemoteAdapter(/* baseUrl */) {
    function nope() { return Promise.reject(new Error('RemoteAdapter not implemented yet – demo uses LocalAdapter')); }
    return { kind: 'remote', getState: fresh, subscribe: function () { return function () {}; },
             join: nope, leave: nope, callNext: nope, call: nope, seat: nope, noShow: nope, setOpen: nope, reset: nope };
  }

  /* ---------------- helpers shared by both pages ---------------- */
  function waiting(st) { return st.entries.filter(function (e) { return e.status === 'waiting'; }).sort(function (a, b) { return a.no - b.no; }); }
  function groupsAhead(st, entry) { return waiting(st).filter(function (e) { return e.no < entry.no; }).length; }
  function findById(st, id) { for (var i = 0; i < st.entries.length; i++) if (st.entries[i].id === id) return st.entries[i]; return null; }

  global.JKQueue = {
    create: function (opts) { return LocalAdapter(opts); }, // <- switch to RemoteAdapter(baseUrl) when the backend exists
    LocalAdapter: LocalAdapter, RemoteAdapter: RemoteAdapter,
    waiting: waiting, groupsAhead: groupsAhead, findById: findById,
    AVG_MIN_PER_GROUP: AVG_MIN_PER_GROUP
  };
})(window);
