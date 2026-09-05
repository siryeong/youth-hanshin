alter table public.profiles_v2
  add constraint profiles_v2_name_valid check (name = btrim(name) and char_length(name) between 1 and 80),
  add constraint profiles_v2_gender_valid check (gender in ('male', 'female')),
  add constraint profiles_v2_birth_date_valid check (birth_date <= timezone('Asia/Seoul', now())::date),
  add constraint profiles_v2_phone_valid check (phone ~ '^01[016789][0-9]{7,8}$');

revoke all on public.profiles_v2 from anon, authenticated;
grant select on public.profiles_v2 to authenticated;
grant update (name, gender, birth_date, phone, show_gender, show_birth_date, show_phone)
  on public.profiles_v2 to authenticated;

create policy "본인 정보와 공개 설정만 수정한다" on public.profiles_v2
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create function public.sync_my_profile_v2() returns public.profiles_v2
language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_signed_in_at timestamptz;
  v_profile public.profiles_v2;
begin
  if auth.uid() is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select coalesce(
    nullif(btrim(raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(raw_user_meta_data->>'name'), ''),
    nullif(btrim(raw_user_meta_data->>'user_name'), ''), '청년'
  ), last_sign_in_at into strict v_name, v_signed_in_at
  from auth.users where id = auth.uid();

  insert into public.profiles_v2 (id, name, last_seen_at)
  values (auth.uid(), btrim(left(v_name, 80)), v_signed_in_at)
  on conflict (id) do update set last_seen_at = excluded.last_seen_at
    where profiles_v2.last_seen_at is distinct from excluded.last_seen_at;

  select * into v_profile from public.profiles_v2 where id = auth.uid();
  return v_profile;
end $$;

revoke all on function public.sync_my_profile_v2() from public, anon, authenticated;
grant execute on function public.sync_my_profile_v2() to authenticated;

alter publication supabase_realtime add table public.profiles_v2;
