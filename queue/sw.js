/* Tiny service worker for the queue DEMO. It builds + shows the "your turn" notification in the TICKET's language
   (same dictionary as the pages: i18n.js) so it also works for a future real Web Push ('push' event with
   { kind, lang, no }). No caching, no fetch handling. */
self.window = self;
importScripts('i18n.js');
var D = self.QI18N;
function tr(l, k) { return (D[l] && D[l][k] != null) ? D[l][k] : D.en[k]; }
function build(d) {
  d = d || {}; var l = D[d.lang] ? d.lang : 'en', kind = d.kind || 'called';
  return { title: 'Jigoku Mushikobo Kanawa · ' + tr(l, 'yourNo') + ' ' + (d.no || ''),
           opts: { body: kind === 'called' ? tr(l, 'calledMsg') : kind === 'test' ? tr(l, 'testMsg') : 'Jigoku Mushikobo Kanawa: ' + tr(l, 's.noshow'), lang: l, tag: 'jk-queue-' + (d.no || ''), renotify: true,
                   requireInteraction: kind === 'called', vibrate: [400, 150, 400, 150, 800] }, lang: l };
}
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function (e) {
  if (!e.data || e.data.type !== 'show') return;
  var n = build(e.data), src = e.source;
  e.waitUntil(self.registration.showNotification(n.title, n.opts).then(function () {
    if (src && src.postMessage) src.postMessage({ type: 'shown', title: n.title, body: n.opts.body, lang: n.lang });
  }));
});
self.addEventListener('push', function (e) {   // future real backend (Web Push): payload { kind, lang, no }
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  var n = build(d); e.waitUntil(self.registration.showNotification(n.title, n.opts));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) if ('focus' in l[i]) return l[i].focus();
    return self.clients.openWindow('./');
  }));
});
