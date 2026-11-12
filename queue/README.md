# QR queue – DEMO

A fully client-side demo of a "scan a QR, get a number, get alerted" queue for Jigokumushi Kobo Kannawa.
**No backend, no accounts, no personal data.** Everything is stored in your browser (`localStorage`).

| Page | URL |
|---|---|
| Customer (what the QR opens) | `/queue/` |
| Printable QR poster | `/queue/poster.html` |
| Projector QR for the class demo | `/queue/qr.html#c=<session>` (made by the staff page) |

The staff console is a **private page**: it is not linked from the customer pages and is opened only through a private link whose secret key
lives in the URL fragment (never sent to a server). The key itself is not in this repository (only its SHA-256, in `gate.js`).

QR image: `assets/queue-qr.png` → `https://network26.github.io/jigokumushi-demo/queue/` (made offline with Python `qrcode`).

## Same-browser demo
Customer tabs and the staff console sync inside one browser (`localStorage` + `BroadcastChannel`). Each customer tab is one "customer" (`sessionStorage`).
Sound needs a tap on the page first; when the tab is in the background a system notification is shown (if allowed).

## Class demo (live, many phones, no accounts)
From the private staff page, **Start / resume class demo** creates a session and a QR code. Classmates scan it with their own phones and
join; staff calls them from the staff page; each phone gets the alert in the language it joined in. Realtime transport is the free public
relay **ntfy.sh** (no account, no server of ours):

- Two random topics per session (`jgkm-<128-bit id>-j` phones→staff, `-s` staff→phones). The id exists only inside the QR link.
- The staff device signs every queue snapshot with an ECDSA P-256 key (kept in its own localStorage). The matching public key is inside the QR link,
  so phones verify snapshots and nobody can fake a "your turn" call. Snapshots are sequence-numbered (replays ignored).
- Staff state lives in the staff browser's localStorage. Joins made while the staff page is closed are recovered from ntfy's cached history (~12 h).
- A phone keeps its ticket in localStorage, re-syncs on return from lock/background (visibility, focus, pageshow, online) and falls back to slow polling
  if the relay refuses more streams from one IP.
- Data: party size, language, the meal/reception ticket number, and an optional nickname. Messages pass through a public relay: don't enter personal info.
- Limits (ntfy.sh anonymous tier, per IP): ~250 messages/day, ~30 concurrent streams, a small request rate. Locked phones cannot be woken (no Web Push):
  they alert when the page is opened again.


## Ticket number and “I’m coming” (demo)
Customers must enter the number on their meal / reception ticket (1–6 digits) to join. That number is shown on the staff row and on the customer ticket view.
When staff calls a party, the alert’s **I’m coming / 向かっています** button (the previous OK control) dismisses the alert and tells the staff page. Staff see a highlighted badge with the time, plus a short banner and beep. In the live class-demo relay this acknowledgement is signed with the phone’s ticket secret (same as leave), recovered from ntfy history, and included in the signed snapshot so the phone can show “Staff notified”.

## Files
`queue-core.js` (state + adapters), `relay.js` (ntfy client, signatures, class-demo adapters), `customer.js`, `staff.js`, `gate.js` (private-link gate),
`qr.html` (projector page), `vendor/qrcode.js` (MIT, QR generator, embedded), `sw.js`, `i18n.js`.

## Swapping in a real backend
`queue-core.js` defines one adapter interface (see the comment at the top). `customer.js` and `staff.js` only call that interface.
Replace `JKQueue.create()` to return a `RemoteAdapter` that talks to:

- **Cloudflare Workers + D1** – tables `queue_entries`, `queue_state`; endpoints e.g. `POST /api/queue/join`, `GET /api/queue/ticket/:id`, `POST /api/staff/call-next|seat|no-show|close|reset`.
- **Live updates** – a Durable Object WebSocket / SSE (or 3–5 s polling) feeding `subscribe(fn)`.
- **Turnstile** on `join` (bot protection), random non-guessable ticket ids server-side (already random here).
- **Cloudflare Access** in front of `/queue/staff*` and `/api/staff/*` (replaces the private-link key).
- Optional later: Web Push for alerts when the customer's page is closed (the demo only alerts while the page is open).

## Notes
- Same-browser demo: customer = one browser **tab** (`sessionStorage`). Class demo: ticket kept in the phone's localStorage.
- Wait estimate is a placeholder (`AVG_MIN_PER_GROUP = 8` minutes per group).
- No phone number or email is collected – only party size and an optional nickname.
- Customer text is translated in 13 languages (`queue/i18n.js`); staff page is English + Japanese.

## Alerts follow the ticket language
`join()` stores the language the customer joined in as `ticket.lang` (one of the 13 codes). Every alert for that ticket —
called banner + OK button, sound hint/status line, tab-title flash, Test alert, no-show message and the system
notification (built inside `sw.js` from the same `i18n.js` dictionary, so a future Web Push payload `{kind, lang, no}` works too) —
uses that language, even if the page UI language is switched later. Staff rows show the ticket language as a small tag.
Check translations with `node tools/check-queue-i18n.js` (fails on a missing key or an untranslated English copy).
