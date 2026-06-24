-- ============================================================
-- Smoke Command — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- Districts
-- ============================================================
create table if not exists districts (
  id            text primary key,             -- e.g. 'houston-south', 'san-antonio'
  name          text not null,
  center_lat    numeric(9,6) not null,
  center_lng    numeric(9,6) not null,
  radius_miles  numeric(6,2) not null default 50,
  created_at    timestamptz default now()
);

insert into districts (id, name, center_lat, center_lng, radius_miles) values
  ('houston-south', 'Houston South District', 29.7604, -95.3698, 75)
on conflict (id) do nothing;

-- ============================================================
-- Profiles (extends Supabase auth.users)
-- ============================================================
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  role          text not null default 'sales_rep'
                  check (role in ('master_admin','district_admin','pm','sales_rep','tech')),
  district_id   text references districts(id),
  created_at    timestamptz default now()
);

-- Auto-create profile on new auth user
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'sales_rep');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Fire Leads
-- ============================================================
create table if not exists fire_leads (
  id                uuid primary key default uuid_generate_v4(),
  fire_name         text not null,
  incident_date     date not null,
  location          text not null,
  lat               numeric(9,6),
  lng               numeric(9,6),
  neighborhoods     text[] default '{}',
  wind_direction    text,
  news_links        text[] default '{}',
  air_quality_data  text,
  status            text not null default 'new'
                      check (status in ('new','assigned','in_progress','closed')),
  district_id       text references districts(id) not null,
  assigned_to       uuid references profiles(id),
  doors_knocked     integer default 0,
  doors_total       integer default 0,
  blaze_fire_id     text unique,               -- dedup key from Blaze
  source            text default 'manual',     -- 'blaze' | 'manual'
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Auto-update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists fire_leads_updated_at on fire_leads;
create trigger fire_leads_updated_at
  before update on fire_leads
  for each row execute function touch_updated_at();

-- ============================================================
-- Canvass Log (door-by-door tracking)
-- ============================================================
create table if not exists canvass_entries (
  id            uuid primary key default uuid_generate_v4(),
  lead_id       uuid references fire_leads(id) on delete cascade not null,
  rep_id        uuid references profiles(id) not null,
  address       text not null,
  result        text not null check (result in ('knocked','no_answer','interested','scheduled','no_soliciting','renter')),
  notes         text,
  photo_url     text,
  knocked_at    timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table districts       enable row level security;
alter table profiles        enable row level security;
alter table fire_leads      enable row level security;
alter table canvass_entries enable row level security;

-- Helper: get caller's role
create or replace function my_role()
returns text language sql security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: get caller's district
create or replace function my_district()
returns text language sql security definer as $$
  select district_id from public.profiles where id = auth.uid();
$$;

-- Districts: everyone can read
create policy "districts_read_all" on districts for select using (true);

-- Profiles: see your own; master_admin sees all; district_admin sees own district
create policy "profiles_self" on profiles for select using (id = auth.uid());
create policy "profiles_master" on profiles for select using (my_role() = 'master_admin');
create policy "profiles_district_admin" on profiles for select
  using (my_role() = 'district_admin' and district_id = my_district());

-- Profiles: update own
create policy "profiles_update_self" on profiles for update using (id = auth.uid());

-- Fire leads: master_admin sees all; others see own district
create policy "fire_leads_master" on fire_leads for select using (my_role() = 'master_admin');
create policy "fire_leads_own_district" on fire_leads for select
  using (district_id = my_district());
create policy "fire_leads_master_insert" on fire_leads for insert with check (my_role() = 'master_admin');
create policy "fire_leads_district_insert" on fire_leads for insert
  with check (district_id = my_district() and my_role() in ('district_admin','pm'));
create policy "fire_leads_update" on fire_leads for update
  using (district_id = my_district() or my_role() = 'master_admin');

-- Canvass: reps see/create their own; district_admin/pm see district's
create policy "canvass_own" on canvass_entries for select using (rep_id = auth.uid());
create policy "canvass_district" on canvass_entries for select
  using (my_role() in ('district_admin','pm','master_admin'));
create policy "canvass_insert" on canvass_entries for insert with check (rep_id = auth.uid());
create policy "canvass_update" on canvass_entries for update using (rep_id = auth.uid());

-- Service-role bypass for Blaze webhook (no RLS for service key)
-- Blaze API endpoint uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS

-- ============================================================
-- Helpers
-- ============================================================
create or replace function increment_doors_knocked(p_lead_id uuid)
returns void language sql security definer as $$
  update fire_leads set doors_knocked = doors_knocked + 1 where id = p_lead_id;
$$;
