# Bhoruka Park Visitor Management

A lightweight Next.js visitor management MVP for Bhoruka Park Pvt Ltd.

## Features

- Public visitor registration page
- Visitor photo capture/upload
- Name, email, phone, company, visitor type and purpose
- Employee dropdown maintained by admin
- Admin login
- Visitor list with photo and contact details
- Check-in / check-out tracking
- Daily, monthly or custom date-range reports
- CSV export
- Works locally and on Vercel using Supabase

## 1. Create Supabase

Create a Supabase project and open SQL Editor.

Run `supabase/schema.sql`.

Then create Storage bucket:

- Name: `visitor-photos`
- For this simple MVP, make it Public.

Get:
- Project URL
- anon key
- service role key

## 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
SESSION_SECRET=

The service role key must stay server-side and must never be exposed to browser code.

## 3. Run locally

```bash
npm install
npm run dev
```

Open:
- Public visitor page: http://localhost:3000
- Admin: http://localhost:3000/admin

## 4. Add employees

Sign in to Admin and use Employees → Add Employee.

Only active employees appear in the public visitor dropdown.

## 5. Deploy to Vercel

Push this folder to GitHub.

In Vercel:
- Import the GitHub repository
- Add the same environment variables from `.env.local`
- Deploy

After deployment, every GitHub push can trigger a new Vercel deployment when automatic deployments are enabled.

## Important production improvements

This MVP intentionally keeps the design simple. Before using it as a full security/attendance system, consider:
- proper admin authentication with multiple admin users/roles
- Supabase Row Level Security policies
- visitor consent/privacy notice
- photo retention/deletion policy
- HTTPS-only deployment
- audit logs
- employee bulk import
- Excel/PDF report generation
- optional host notification by email/WhatsApp

## Host email notifications

Configure Gmail from **Admin → Email settings**. Use a Gmail App Password, not the normal Gmail password. The App Password is encrypted before it is stored, and visitor notifications are sent to the selected employee with `IT@bhorukapark.com` in CC. Every employee who can be selected as a host must have an email address in the Employees section.

The settings require the `email_settings` table from `supabase/schema.sql` to be applied to Supabase.
