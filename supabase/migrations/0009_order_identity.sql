revoke execute on function public.get_guest_orders(uuid) from public, authenticated;

create or replace function public.cancel_order_item(p_item_id uuid, p_guest_token uuid default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.cafe_is_open() then
    raise exception 'ORDER_WINDOW_CLOSED';
  end if;
  if not exists (
    select 1 from public.order_items_v2 i
    join public.orders_v2 o on o.id = i.order_id
    where i.id = p_item_id
      and o.service_date = timezone('Asia/Seoul', now())::date
      and case when auth.uid() is not null then o.profile_id = auth.uid()
        else p_guest_token is not null and o.guest_token = p_guest_token end
  ) then
    raise exception 'NOT_YOUR_ORDER';
  end if;
  update public.order_items_v2 set status = 'cancelled', cancelled_at = now() where id = p_item_id;
end $$;
