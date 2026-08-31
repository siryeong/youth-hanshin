create or replace function public.cafe_is_open(at timestamptz default now())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from public.cafe_settings_v2 s
      where s.weekday = extract(isodow from timezone('Asia/Seoul', at))::int
        and timezone('Asia/Seoul', at)::time >= s.opens_at
        and timezone('Asia/Seoul', at)::time < s.closes_at
    )
    and not exists (
      select 1 from public.cafe_closures_v2 c
      where c.closed_on = timezone('Asia/Seoul', at)::date
    );
$$;

create or replace function public.cafe_status()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'is_open', public.cafe_is_open(),
    'opens_at', s.opens_at,
    'closes_at', s.closes_at,
    'server_time', timezone('Asia/Seoul', now()),
    'today_isodow', extract(isodow from timezone('Asia/Seoul', now()))::int,
    'closes_in_seconds', greatest(0, extract(epoch from (s.closes_at - timezone('Asia/Seoul', now())::time))::int),
    'is_closed_today', exists (
      select 1 from public.cafe_closures_v2 c where c.closed_on = timezone('Asia/Seoul', now())::date
    )
  )
  from public.cafe_settings_v2 s;
$$;

grant execute on function public.cafe_status() to anon, authenticated;
