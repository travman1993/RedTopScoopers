# RedTopScoopers
Mobile-first web app for Red Top Scoopers — pet waste removal business. Public landing page with instant quote form + admin CRM dashboard for lead tracking, customer management, scheduling, and route planning. Built with Supabase.
# Red Top Scoopers — Web App

Pet waste removal business website + admin CRM for Red Top Scoopers LLC.

**Live site:** [redtopscoopers.com](https://redtopscoopers.com)

## What This App Does

1. **Public Landing Page** — Customers see pricing, trust points, service areas, and a quote form
2. **Instant Quote Calculator** — Calculates exact price based on dogs, yard size, frequency, and add-ons
3. **Admin Dashboard** (`/admin`) — Private CRM to manage leads, customers, schedule, and routes

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **Deployment:** Vercel
- **Payments:** Square (manual tracking for now)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and add your keys
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — landing page  
Open [http://localhost:3000/admin](http://localhost:3000/admin) — admin dashboard

## Setup Steps

### 1. Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL from `supabase-setup.sql` in the SQL Editor
3. Copy your project URL and anon key into `.env.local`

### 2. Vercel
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add your `.env.local` variables in Vercel project settings
4. Deploy

### 3. Domain
1. In Vercel, go to Settings → Domains
2. Add `redtopscoopers.com`
3. Update DNS in GoDaddy to point to Vercel

## Admin Login

Default credentials (change in `.env.local`):
- Email: `redtopscoopers@gmail.com`
- Password: Set in `ADMIN_PASSWORD` env var

## Project Structure

```
src/
├── app/
│   ├── page.js              # Public landing page
│   ├── layout.js            # Root layout + SEO
│   ├── globals.css          # Tailwind + brand styles
│   ├── admin/
│   │   ├── page.js          # Admin dashboard
│   │   └── login/page.js    # Admin login
│   └── api/
│       ├── leads/route.js   # Lead submission API
│       └── auth/login/route.js
├── components/              # UI components
├── lib/
│   ├── supabase.js          # Supabase client
│   └── pricing.js           # Quote calculation
└── utils/
    └── formatQuote.js       # SMS/email formatting
```

## Brand

- **Colors:** Red `#c41e2a`, Green `#1b5e20`
- **Fonts:** Oswald (headings), Source Sans Pro (body)
- **Phone:** 404-649-4654
- **Email:** redtopscoopers@gmail.com

---

Red Top Scoopers LLC — *We Handle the Dirty Work*