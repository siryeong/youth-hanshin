BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';

UPDATE public.cafe_settings_v2
SET weekday = extract(isodow from timezone('Asia/Seoul', now()))::int,
    opens_at = '00:00', closes_at = '23:59:59.999999'
WHERE id = true;

SET LOCAL ROLE anon;
DO $$
DECLARE
  token uuid := gen_random_uuid();
  coffee uuid;
  cold uuid;
  item record;
  options jsonb := '{"temperature":"ice","shot":0,"light":false,"syrup":false}';
  change jsonb;
  bad_quantity jsonb;
BEGIN
  PERFORM set_config('test.guest_token', token::text, true);
  SELECT id INTO STRICT coffee FROM public.menus_public_v2 WHERE name = '아메리카노';
  SELECT id INTO STRICT cold FROM public.menus_public_v2 WHERE name = '레몬 아이스티';
  IF EXISTS (SELECT 1 FROM public.menus_v2) OR EXISTS (SELECT 1 FROM public.orders_v2) THEN
    RAISE EXCEPTION 'RLS_DIRECT_READ_FAILED';
  END IF;
  IF has_table_privilege('anon', 'public.menus_public_v2', 'INSERT')
    OR has_table_privilege('anon', 'public.menus_public_v2', 'UPDATE')
    OR has_table_privilege('anon', 'public.menus_public_v2', 'DELETE') THEN
    RAISE EXCEPTION 'PUBLIC_MENU_WRITE_GRANTED';
  END IF;

  PERFORM public.place_order(jsonb_build_array(jsonb_build_object(
    'menu_id', coffee, 'options', options, 'quantity', 2, 'option_label', 'FORGED'
  )), token);
  SELECT * INTO STRICT item FROM public.get_guest_orders(token);
  IF item.option_label <> 'ICE · 2잔' OR item.quantity <> 2 OR item.menu_name <> '아메리카노' THEN
    RAISE EXCEPTION 'ORDER_SNAPSHOT_FAILED';
  END IF;
  BEGIN
    PERFORM public.cancel_order_item(item.item_id, gen_random_uuid());
    RAISE EXCEPTION 'OTHER_GUEST_CANCEL_ALLOWED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'NOT_YOUR_ORDER' THEN RAISE; END IF;
  END;
  PERFORM public.cancel_order_item(item.item_id, token);
  IF (SELECT status FROM public.get_guest_orders(token)) <> 'cancelled' THEN
    RAISE EXCEPTION 'CANCEL_FAILED';
  END IF;

  FOR change IN SELECT value FROM jsonb_array_elements('[
    {"temperature":"hot"}, {"shot":1}, {"light":true}, {"syrup":true},
    {"shot":-1}, {"shot":0.5}, {"shot":"0"}, {"light":"false"}, {"extra":true}
  ]') LOOP
    BEGIN
      PERFORM public.place_order(jsonb_build_array(
        jsonb_build_object('menu_id', coffee, 'options', options, 'quantity', 1),
        jsonb_build_object('menu_id', cold, 'options', options || change, 'quantity', 1)
      ), token);
      RAISE EXCEPTION 'INVALID_OPTION_ACCEPTED';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> 'INVALID_OPTIONS' THEN RAISE; END IF;
    END;
  END LOOP;
  FOR bad_quantity IN SELECT value FROM jsonb_array_elements('[0,10,1.5,null,"2"]') LOOP
    BEGIN
      PERFORM public.place_order(jsonb_build_array(jsonb_build_object(
        'menu_id', coffee, 'options', options, 'quantity', bad_quantity
      )), token);
      RAISE EXCEPTION 'INVALID_QUANTITY_ACCEPTED';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> 'INVALID_QUANTITY' THEN RAISE; END IF;
    END;
  END LOOP;
  BEGIN
    PERFORM public.place_order('{}'::jsonb, token);
    RAISE EXCEPTION 'INVALID_CART_ACCEPTED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'INVALID_CART' THEN RAISE; END IF;
  END;
END $$;
SET LOCAL ROLE postgres;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.orders_v2 WHERE guest_token = current_setting('test.guest_token')::uuid) <> 1 THEN
    RAISE EXCEPTION 'PARTIAL_ORDER_NOT_ROLLED_BACK';
  END IF;
END $$;
UPDATE public.cafe_settings_v2 SET weekday = (weekday % 7) + 1 WHERE id = true;
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.place_order('[]'::jsonb, gen_random_uuid());
    RAISE EXCEPTION 'CLOSED_ORDER_ALLOWED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'ORDER_WINDOW_CLOSED' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.cancel_order_item(gen_random_uuid(), gen_random_uuid());
    RAISE EXCEPTION 'CLOSED_CANCEL_ALLOWED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'ORDER_WINDOW_CLOSED' THEN RAISE; END IF;
  END;
END $$;
SET LOCAL ROLE postgres;
SELECT 'PASS: guest ordering, validation, cancellation, RLS, atomicity, closing time' AS verification;
ROLLBACK;
