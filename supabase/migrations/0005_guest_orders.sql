create function public.get_guest_orders(p_guest_token uuid)
returns table (
  item_id uuid,
  menu_name text,
  option_label text,
  quantity int,
  status public.order_item_status,
  ordered_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select i.id, i.menu_name, i.option_label, i.quantity, i.status, i.created_at
  from public.order_items_v2 i
  join public.orders_v2 o on o.id = i.order_id
  where o.guest_token = p_guest_token
    and o.service_date = timezone('Asia/Seoul', now())::date
  order by i.created_at;
$$;

create function public.cancel_order_item(p_item_id uuid, p_guest_token uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_owned boolean;
begin
  if not public.cafe_is_open() then
    raise exception 'ORDER_WINDOW_CLOSED';
  end if;

  select exists (
    select 1
    from public.order_items_v2 i
    join public.orders_v2 o on o.id = i.order_id
    where i.id = p_item_id
      and o.service_date = timezone('Asia/Seoul', now())::date
      and (
        (auth.uid() is not null and o.profile_id = auth.uid())
        or (p_guest_token is not null and o.guest_token = p_guest_token)
      )
  ) into v_owned;

  if not v_owned then
    raise exception 'NOT_YOUR_ORDER';
  end if;

  update public.order_items_v2
  set status = 'cancelled', cancelled_at = now()
  where id = p_item_id;
end $$;

grant execute on function public.get_guest_orders(uuid) to anon, authenticated;
grant execute on function public.cancel_order_item(uuid, uuid) to anon, authenticated;
