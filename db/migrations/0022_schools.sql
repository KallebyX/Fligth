-- =========================================================================
-- 0022_schools.sql — Aviation schools directory + affiliate lead capture
-- =========================================================================
--
-- A directory of CIAC/CTAC-certified aviation schools in Brazil (and abroad
-- eventually). Users browse, filter by state/city/course, and submit a
-- lead form on a school's detail page. Each lead is stored, attributed
-- with UTMs, and (in a follow-up phase) emailed to the school.
--
-- Affiliate model: app earns a commission either per qualified lead or
-- per converted enrollment. Conversion is currently tracked manually by
-- updating school_leads.status='converted' + filling conversion_value.

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  legal_name text,
  cnpj text,
  description text,
  logo_url text,
  cover_url text,
  city text not null,
  state text not null,        -- UF, e.g. 'SP'
  country text not null default 'BR',
  address text,
  lat double precision,
  lng double precision,
  phone text,
  email text not null,
  website text,
  instagram text,
  whatsapp text,
  cursos jsonb,                -- [{ slug: 'pp-a', nome: 'PP-A', preco_brl: 25000, duracao_meses: 6 }, ...]
  anac_codigo text,
  status text not null default 'active'
    check (status in ('active','suspended','inactive')),
  affiliate_active boolean not null default true,
  commission_pct numeric(5,2) default 5.0,
  featured boolean not null default false,
  featured_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ix_schools_state_city
  on public.schools (state, city) where status = 'active';
create index ix_schools_featured
  on public.schools (featured_until desc) where featured = true;

-- ---------------- lead capture --------------------------------------
create table public.school_leads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 100),
  email text not null,
  phone text not null,
  course_interest text,
  message text check (message is null or char_length(message) <= 1000),
  source text,                  -- 'directory' | 'school_page' | 'recommendation'
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null default 'new'
    check (status in ('new','contacted','qualified','converted','lost')),
  conversion_value numeric(10,2),
  converted_at timestamptz,
  notes text,
  consent_given boolean not null default true,  -- LGPD opt-in proof
  ip_hash text,                  -- coarse anti-fraud (SHA-256 of remote IP)
  created_at timestamptz not null default now()
);
create index ix_school_leads_school_created
  on public.school_leads (school_id, created_at desc);
create index ix_school_leads_status
  on public.school_leads (status, created_at desc);

-- ---------------- webhook delivery prefs per school ------------------
create table public.school_lead_webhooks (
  school_id uuid primary key references public.schools(id) on delete cascade,
  webhook_url text,
  webhook_secret text,
  email_notify text,
  last_delivered_at timestamptz,
  last_status integer,
  failure_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------- updated_at autobump --------------------------------
create or replace function public.schools_touch_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;
drop trigger if exists trg_schools_touch on public.schools;
create trigger trg_schools_touch
  before update on public.schools
  for each row execute procedure public.schools_touch_updated_at();

-- ---------------- RLS -----------------------------------------------
alter table public.schools             enable row level security;
alter table public.school_leads        enable row level security;
alter table public.school_lead_webhooks enable row level security;

-- Schools: public read of active rows for any authenticated user.
-- Insert/update reserved for admins (RLS enforces via profiles.role).
create policy "schools: read active"
  on public.schools for select
  using (
    auth.role() = 'authenticated'
    and status = 'active'
  );
create policy "schools: admin write"
  on public.schools for all
  using (
    exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  );

-- Leads: insert by anyone (including anon for landing pages), but anon
-- inserts are forbidden by RLS unless we explicitly allow. For now,
-- require authenticated to keep spam down.
create policy "leads: insert authenticated"
  on public.school_leads for insert
  with check (auth.role() = 'authenticated');
-- Reads: admins, lead author, and the school owner (future: owner role).
create policy "leads: read own or admin"
  on public.school_leads for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  );
create policy "leads: admin update"
  on public.school_leads for update
  using (
    exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  );

-- Webhooks: admin-only.
create policy "webhooks: admin only"
  on public.school_lead_webhooks for all
  using (
    exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
       where id = auth.uid() and role = 'admin'
    )
  );
