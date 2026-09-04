create or replace function public.place_order(p_items jsonb, p_guest_token uuid default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menus_v2%rowtype;
begin
  if not public.cafe_is_open() then
    raise exception 'ORDER_WINDOW_CLOSED';
  end if;
  if auth.uid() is null and p_guest_token is null then
    raise exception 'GUEST_TOKEN_REQUIRED';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  insert into public.orders_v2 (cohort_id, profile_id, guest_token, service_date)
  values (
    public.active_cohort_id(),
    auth.uid(),
    case when auth.uid() is null then p_guest_token end,
    timezone('Asia/Seoul', now())::date
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_menu from public.menus_v2 where id = (v_item->>'menu_id')::uuid and is_active;
    if not found then
      raise exception 'MENU_NOT_FOUND';
    end if;

    insert into public.order_items_v2 (order_id, menu_id, menu_name, option_label, options, quantity)
    values (
      v_order_id,
      v_menu.id,
      v_menu.name,
      coalesce(v_item->>'option_label', ''),
      coalesce(v_item->'options', '{}'::jsonb),
      least(9, greatest(1, coalesce((v_item->>'quantity')::int, 1)))
    );
  end loop;

  return v_order_id;
end $$;

grant execute on function public.place_order(jsonb, uuid) to anon, authenticated;
