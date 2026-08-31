create type public.menu_category as enum ('coffee', 'non_coffee', 'cold');
create type public.order_item_status as enum ('ordered', 'cancelled');
create type public.app_role as enum ('admin', 'pastor', 'staff', 'youth');

create table public.cohorts_v2 (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index cohorts_v2_one_active on public.cohorts_v2 (is_active) where is_active;

create table public.profiles_v2 (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  gender text,
  birth_date date,
  phone text,
  show_gender boolean not null default false,
  show_birth_date boolean not null default false,
  show_phone boolean not null default false,
  role public.app_role not null default 'youth',
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.menus_v2 (
  id uuid primary key default gen_random_uuid(),
  category public.menu_category not null,
  name text not null,
  price int not null default 0,
  ice_price_delta int not null default 0,
  options jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.cafe_settings_v2 (
  id boolean primary key default true check (id),
  weekday int not null check (weekday between 1 and 7),
  opens_at time not null,
  closes_at time not null
);

create table public.cafe_closures_v2 (
  closed_on date primary key,
  reason text
);

create table public.orders_v2 (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts_v2 on delete set null,
  profile_id uuid references public.profiles_v2 on delete cascade,
  guest_token uuid,
  service_date date not null,
  created_at timestamptz not null default now(),
  constraint orders_v2_owner check (num_nonnulls(profile_id, guest_token) = 1)
);
create index orders_v2_guest_token_idx on public.orders_v2 (guest_token) where guest_token is not null;

create table public.order_items_v2 (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders_v2 on delete cascade,
  menu_id uuid references public.menus_v2 on delete set null,
  menu_name text not null,
  option_label text not null default '',
  options jsonb not null default '{}'::jsonb,
  quantity int not null default 1 check (quantity between 1 and 9),
  status public.order_item_status not null default 'ordered',
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index order_items_v2_order_idx on public.order_items_v2 (order_id);

create function public.active_cohort_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.cohorts_v2 where is_active limit 1;
$$;
