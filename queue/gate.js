/* Private-link gate for the staff page and the demo console (window.JKGate).
 * Not a server-side lock (this is a static demo): the staff link carries a secret key in the URL FRAGMENT
 * (staff.html#k=...), which browsers never send to any server. Only its SHA-256 is stored in this file.
 * After the first successful open the key is remembered in this browser (localStorage) and removed from the address bar. */
(function (g) {
  'use strict';
  var HASH = 'a895656ef2a94fc57272ead96597357e1ba933453e0d9911ce18c6ddad6f47b0', K = 'jk-staff-key';
  var params = new URLSearchParams((g.location.hash || '').replace(/^#/, ''));
  function sha(s) { return g.crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
  function check(k) { return k ? sha(k).then(function (h) { return h === HASH; }) : Promise.resolve(false); }
  var stored = null; try { stored = g.localStorage.getItem(K); } catch (e) {}
  var given = params.get('k');
  var ready = check(given).then(function (ok) {
    if (ok) { try { g.localStorage.setItem(K, given); } catch (e) {} stored = given; return true; }
    return check(stored).then(function (ok2) { if (!ok2 && stored) { try { g.localStorage.removeItem(K); } catch (e) {} } return ok2; });
  }).then(function (ok) { if (ok && given && g.history && g.history.replaceState) { g.history.replaceState(null, '', g.location.pathname + g.location.search); } return ok; });
  g.JKGate = { ready: ready, params: params, key: function () { return stored; }, lock: function () { try { g.localStorage.removeItem(K); } catch (e) {} stored = null; } };
})(window);
