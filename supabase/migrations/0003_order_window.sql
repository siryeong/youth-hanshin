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
    -- 열려 있을 때만 남은 시간을 센다. 화요일 오전처럼 안 여는 날에도 값을 내놓으면
    -- 이 필드를 그대로 쓰는 화면이 "마감까지 5시간"을 보여주게 된다.
    'closes_in_seconds', case
      when public.cafe_is_open() then greatest(0, extract(epoch from (s.closes_at - timezone('Asia/Seoul', now())::time))::int)
      else 0
    end,
    'is_closed_today', exists (
      select 1 from public.cafe_closures_v2 c where c.closed_on = timezone('Asia/Seoul', now())::date
    )
  )
  from public.cafe_settings_v2 s;
$$;

-- Postgres 는 함수를 만들면 PUBLIC 에 EXECUTE 를 기본으로 준다.
-- 이 프로젝트는 추가로 ALTER DEFAULT PRIVILEGES 로 새 함수마다 anon, authenticated
-- 에도 EXECUTE 를 직접 부여해 두었다 (PUBLIC 과 별개의 권한이라 PUBLIC 회수로는 안 지워진다).
-- cafe_is_open 은 RPC 안에서만 쓰므로 두 권한을 모두 명시적으로 회수한다.
revoke execute on function public.cafe_is_open(timestamptz) from public, anon, authenticated;

grant execute on function public.cafe_status() to anon, authenticated;
