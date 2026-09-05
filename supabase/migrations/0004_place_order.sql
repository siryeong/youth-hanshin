create function public.place_order(p_items jsonb, p_guest_token uuid default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menus_v2%rowtype;
  v_options jsonb;
  v_quantity int;
  v_shot int;
begin
  if not public.cafe_is_open() then
    raise exception 'ORDER_WINDOW_CLOSED';
  end if;
  if auth.uid() is null and p_guest_token is null then
    raise exception 'GUEST_TOKEN_REQUIRED';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'INVALID_CART';
  end if;
  if jsonb_array_length(p_items) = 0 then
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
    if jsonb_typeof(v_item) is distinct from 'object' then
      raise exception 'INVALID_CART';
    end if;
    select * into v_menu from public.menus_v2 where id = (v_item->>'menu_id')::uuid and is_active;
    if not found then
      raise exception 'MENU_NOT_FOUND';
    end if;

    v_options := v_item->'options';
    if jsonb_typeof(v_options) is distinct from 'object' then
      raise exception 'INVALID_OPTIONS';
    end if;
    if jsonb_typeof(v_options->'temperature') is distinct from 'string'
      or jsonb_typeof(v_options->'shot') is distinct from 'number'
      or jsonb_typeof(v_options->'light') is distinct from 'boolean'
      or jsonb_typeof(v_options->'syrup') is distinct from 'boolean'
      or v_options - array['temperature', 'shot', 'light', 'syrup'] <> '{}'::jsonb then
      raise exception 'INVALID_OPTIONS';
    end if;
    if not coalesce((v_menu.options->'temperature') @> jsonb_build_array(v_options->>'temperature'), false)
      or (v_options->>'shot')::numeric < 0
      or (v_options->>'shot')::numeric > coalesce((v_menu.options->>'shot')::numeric, 0)
      or mod((v_options->>'shot')::numeric, 1) <> 0
      or ((v_options->>'light')::boolean and not coalesce((v_menu.options->>'light')::boolean, false))
      or ((v_options->>'syrup')::boolean and not coalesce((v_menu.options->>'syrup')::boolean, false)) then
      raise exception 'INVALID_OPTIONS';
    end if;
    if jsonb_typeof(v_item->'quantity') is distinct from 'number' then
      raise exception 'INVALID_QUANTITY';
    end if;
    if (v_item->>'quantity')::numeric not between 1 and 9
      or mod((v_item->>'quantity')::numeric, 1) <> 0 then
      raise exception 'INVALID_QUANTITY';
    end if;
    v_quantity := (v_item->>'quantity')::numeric::int;
    v_shot := (v_options->>'shot')::numeric::int;

    insert into public.order_items_v2 (order_id, menu_id, menu_name, option_label, options, quantity)
    values (
      v_order_id,
      v_menu.id,
      v_menu.name,
      concat_ws(' · ',
        upper(v_options->>'temperature'),
        case when v_shot > 0 then '샷 ' || v_shot end,
        case when (v_options->>'light')::boolean then '연하게' end,
        case when (v_options->>'syrup')::boolean then '시럽' end,
        v_quantity || '잔'
      ),
      v_options,
      v_quantity
    );
  end loop;

  return v_order_id;
end $$;

grant execute on function public.place_order(jsonb, uuid) to anon, authenticated;
