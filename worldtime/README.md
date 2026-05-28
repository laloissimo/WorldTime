# WorldTime — Global Time Zone Planner

A beautiful, mobile-first time zone comparison app.

## Features (Free Tier)
- Live multi-timezone comparison with drag-and-drop reordering
- Click-to-edit times with smart keyboard input (type `1330` → `13:30`) or clock dial picker
- DST (daylight saving) warnings for upcoming transitions
- 5 languages: English, German, French, Portuguese, Italian (auto-detected)
- Shareable meeting links
- Remembers your zones and language between visits (localStorage)

## Tech Stack
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- No external time libraries — all native Intl APIs

---

## Getting Started Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (via Claude Code)

Tell Claude Code:
> "Install dependencies, push this project to GitHub, and deploy it to Vercel"

Claude Code will:
1. Run `npm install`
2. Initialize a git repo and push to your GitHub
3. Deploy to Vercel and give you a live URL

---

## Project Structure

```
worldtime/
├── app/
│   ├── globals.css       # Global styles + Google Fonts
│   ├── layout.jsx        # Root layout + metadata
│   └── page.jsx          # Entry page
├── components/
│   └── WorldTimeApp.jsx  # Main app (all UI + logic)
├── lib/
│   ├── i18n.js           # Translations for 5 languages
│   └── timezones.js      # Timezone DB + helpers + localStorage
├── package.json
├── vercel.json
└── next.config.js
```

---

## Adding More Languages

Edit `lib/i18n.js` — add a new entry to `LANGUAGES` and a matching key block in `T`.

## Adding More Cities

Edit `lib/timezones.js` — add a new object to `TIMEZONE_DB` following the existing pattern.
