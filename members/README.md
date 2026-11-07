# Members area (DEMO)

`/members/` is a **class demonstration** of a possible local-subscriber login for Jigoku Mushikobo Kanawa.
It is not an official service and nothing here is real:

- "Enter as demo subscriber" is a button, not a login. No email, password or personal data is collected.
- "Simulate payment & reserve" charges nothing and asks for no card details.
- Bookings live only in this browser's `localStorage` (key `jk-members-demo-v1`); they are not shared between phones/classmates.
  "Reset demo data" deletes only that key (queue data is untouched). Tabs in the same browser stay in sync.
- Subscription pricing and terms: to be confirmed (no amount shown).

Data used from the main website: hours 10:00–19:00 JST, last steamer reception 18:00, closed 3rd Wednesday
(the "next day if a public holiday" rule is not modelled). Fee estimate follows the published steamer price list:
small ¥400 basic (up to 15 min) + ¥200 per extra 10 min or part; large ¥600 + ¥300. Which of the 3 steamers is
small or large is not published, so the member picks a size. Durations: 15/30/45/60 min, in 15-minute slots.
