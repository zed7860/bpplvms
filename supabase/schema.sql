create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text not null,
  company text,
  visitor_type text not null default 'Other',
  photo_url text,
  meeting_with_id uuid references employees(id) on delete set null,
  meeting_with_name text not null,
  purpose text,
  check_in timestamptz not null default now(),
  check_out timestamptz,
  status text not null default 'IN',
  created_at timestamptz not null default now()
);

create index if not exists visitors_check_in_idx on visitors(check_in);
create index if not exists visitors_status_idx on visitors(status);
create index if not exists employees_active_idx on employees(active);

create table if not exists email_settings (
  id integer primary key default 1 check (id = 1),
  provider text not null default 'gmail',
  email text not null,
  app_password_encrypted text not null,
  cc_email text not null default 'IT@bhorukapark.com',
  updated_at timestamptz not null default now()
);

-- Create this bucket in Supabase Storage:
-- Bucket name: visitor-photos
-- Recommended: Public bucket for this basic MVP.
