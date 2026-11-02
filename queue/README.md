# QR queue – DEMO

A fully client-side demo of a "scan a QR, get a number, get alerted" queue for Jigokumushi Kobo Kannawa.
**No backend, no accounts, no personal data.** Everything is stored in your browser (`localStorage`).

| Page | URL |
|---|---|
| Customer (what the QR opens) | `/queue/` |
| Staff console | `/queue/staff.html` – **demo PIN `2468`** (shown on the page; *not* security) |
| Printable QR poster | `/queue/poster.html` |

QR image: `assets/queue-qr.png` → `https://network26.github.io/jigokumushi-demo/queue/` (made offline with Python `qrcode`).

## Test it (two tabs of the SAME browser)
1. Open `/queue/staff.html`, enter PIN `2468`.
2. In another tab/window open `/queue/`, pick a party size, press **Get my queue number**. Press **Turn on sound & vibration alerts** (browsers need a tap before sound).
3. (Optional) open more customer tabs – each tab is a separate "customer"; or press **Add walk-in party** on the staff page. Customers show "Groups ahead of you: N" live.
4. On the staff page press **Call next** (or **Call** on a row). The customer tab shows a flashing banner, plays a chime, vibrates (Android/Chrome only; iOS ignores vibration) and flashes the page title.
5. Press **Seat** or **No-show**; the customer sees the new state. **Close queue** blocks new joins; **Reset** clears everything.

Tabs sync through `BroadcastChannel` (+ `storage` events as fallback). Different browsers/phones do **not** share data – that is what the real backend is for.

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
