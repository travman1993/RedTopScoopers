# Red Top Scoopers — Web App

Pet waste removal business website + admin CRM for Red Top Scoopers LLC.

**Live site:** [redtopscoopers.com](https://redtopscoopers.com)

## What This App Does

1. **Public Landing Page** — Customers see pricing, trust points, service areas, and a quote form
2. **Instant Quote Calculator** — Calculates exact price based on dogs, yard size, frequency, and add-ons
3. **Admin Dashboard** (`/admin`) — Private CRM to manage leads, customers, schedule, and routes
4. **Billing** — Stripe checkout for subscriptions (billed on the 1st) and one-time payments

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + RLS)
- **Payments:** Stripe (subscriptions + one-time checkout)
- **Email:** Resend (transactional)
- **Deployment:** Vercel

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
3. Copy your project URL, anon key, and service role key into `.env.local`

### 2. Stripe
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copy your secret key into `STRIPE_SECRET_KEY`
3. Add a webhook endpoint pointing to `https://yourdomain.com/api/stripe/webhook`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

### 3. Resend
1. Go to [resend.com](https://resend.com) and create an account
2. Add and verify your sending domain
3. Copy your API key into `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to your verified sending address

### 4. Vercel
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add all `.env.local` variables in Vercel project settings
4. Deploy

### 5. Domain
1. In Vercel, go to Settings → Domains
2. Add `redtopscoopers.com`
3. Update DNS to point to Vercel

## Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
SESSION_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_BASE_URL=https://redtopscoopers.com
```

## Admin Login

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your environment variables. There is no default fallback — both must be set.

## Pricing

- **Weekly:** $20/week, billed as $80/month on the 1st
- **Bi-Weekly:** $75/month
- **One-Time:** $40 base
- Yard size and deodorizing add-ons apply to all plans

## Project Structure

```
src/
├── app/
│   ├── page.js                    # Public landing page
│   ├── layout.js                  # Root layout + SEO
│   ├── sitemap.js                 # Auto-generated sitemap
│   ├── billing-success/page.js    # Post-checkout customer landing page
│   ├── admin/
│   │   ├── page.js                # Admin dashboard (leads, customers, schedule)
│   │   └── login/page.js          # Admin login
│   └── api/
│       ├── leads/route.js         # Lead submission
│       ├── auth/login/route.js    # Admin auth
│       ├── notify/approved/route.js # Approval email to customer
│       └── stripe/
│           ├── create-customer/   # Stripe checkout session (subscriptions + one-time)
│           ├── charge-onetime/    # Manual one-time charge
│           ├── cancel-subscription/
│           └── webhook/           # Stripe event handler
├── components/                    # UI components
├── lib/
│   ├── supabase.js                # Supabase clients (anon + service role)
│   ├── pricing.js                 # Quote calculation
│   └── auth.js                    # Session token (HMAC-SHA256)
└── utils/
    └── formatQuote.js             # SMS/email quote formatting
```

## Brand

- **Colors:** Red `#c41e2a`, Green `#1b5e20`
- **Fonts:** Oswald (headings), Source Sans Pro (body)
- **Phone:** 404-649-4654
- **Email:** redtopscoopers@gmail.com

---

Red Top Scoopers LLC — *We Handle the Dirty Work*
