# QR queue – DEMO

A fully client-side demo of a "scan a QR, get a number, get alerted" queue for Jigokumushi Kobo Kannawa.
**No backend, no accounts, no personal data.** Everything is stored in your browser (`localStorage`).

| Page | URL |
|---|---|
| Customer (what the QR opens) | `/queue/` |
| Staff console | `/queue/staff.html` – **demo PIN `2468`** (shown on the page; *not* security) |
| Printable QR poster | `/queue/poster.html` |

QR image: `assets/queue-qr.png` → `https://network26.github.io/jigokumushi-demo/queue/` (made offline with Python `qrcode`).

## Test it
**Easiest (computer or phone): `/queue/demo.html`** – the customer view and the staff controls on one screen (stacked with tabs on a phone), PIN filled in automatically.
1. Customer pane: press **Get my queue number** (this tap also unlocks sound and asks for notification permission – tap *Allow*).
2. Staff pane: press **Add walk-in party** a couple of times, then **Call next** (or a row's **Call**; **Call again** re-alerts).
3. Customer pane: flashing banner, chime, vibration (Android Chrome only), title flash. Use **Test alert** any time to check sound/banner/notification.

**Two windows (computer, desktop Chrome):** open `/queue/staff.html` (PIN `2468`) and `/queue/` in two *windows side by side* (not a background tab). Join on the customer window, then press Call next on the staff window.

Notes on alerts: sound needs a tap on the page first (join/Enable/Test alert, or any tap after a reload – the page says "Sound: tap this page once to unlock" until then). If the customer tab is in the background when staff call, a system notification is shown (if allowed) and the banner + sound fire the moment you return. Mobile browsers freeze background tabs, and iOS Safari only shows notifications for sites added to the Home Screen – so on a phone use the demo console, and the real version needs Web Push from the backend.
Other tests: each customer tab is one "customer"; **Close queue** blocks new joins; **Reset** clears everything.

## Swapping in a real backend
`queue-core.js` defines one adapter interface (see the comment at the top). `customer.js` and `staff.js` only call that interface.
Replace `JKQueue.create()` to return a `RemoteAdapter` that talks to:

- **Cloudflare Workers + D1** – tables `queue_entries`, `queue_state`; endpoints e.g. `POST /api/queue/join`, `GET /api/queue/ticket/:id`, `POST /api/staff/call-next|seat|no-show|close|reset`.
- **Live updates** – a Durable Object WebSocket / SSE (or 3–5 s polling) feeding `subscribe(fn)`.
- **Turnstile** on `join` (bot protection), random non-guessable ticket ids server-side (already random here).
- **Cloudflare Access** in front of `/queue/staff*` and `/api/staff/*` (replaces the demo PIN).
- Optional later: Web Push for alerts when the customer's page is closed (the demo only alerts while the page is open).

## Notes
- Customer = one browser **tab** (ticket id kept in `sessionStorage`) so one person can test several customers. A real build would keep it on the phone (cookie/localStorage).
- Wait estimate is a placeholder (`AVG_MIN_PER_GROUP = 8` minutes per group).
- No phone number or email is collected – only party size and an optional nickname.
- Customer text is translated in 13 languages (`queue/i18n.js`); staff page is English + Japanese.

## Alerts follow the ticket language
`join()` stores the language the customer joined in as `ticket.lang` (one of the 13 codes). Every alert for that ticket —
called banner + OK button, sound hint/status line, tab-title flash, Test alert, no-show message and the system
notification (built inside `sw.js` from the same `i18n.js` dictionary, so a future Web Push payload `{kind, lang, no}` works too) —
uses that language, even if the page UI language is switched later. Staff rows show the ticket language as a small tag.
Check translations with `node tools/check-queue-i18n.js` (fails on a missing key or an untranslated English copy).
