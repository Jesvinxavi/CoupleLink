-- Create a generic trigger function that calls the push-notify Edge Function
create extension if not exists pg_net;

create or replace function public.notify_edge_function()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
  request_id bigint;
begin
  payload = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', case when TG_OP = 'UPDATE' or TG_OP = 'DELETE' then row_to_json(OLD) else null end
  );

  -- Send the webhook request
  -- Note: We don't verify JWT on the Edge Function side for this internal route
  perform net.http_post(
    url := 'https://jbsteocyiiyzpsodlcbv.supabase.co/functions/v1/push-notify',
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  return NEW;
end;
$$;

-- 1. Memories (Sticky Notes, Journals, Challenge Completions)
drop trigger if exists on_memory_insert_notify on public.memories;
create trigger on_memory_insert_notify
  after insert on public.memories
  for each row execute function public.notify_edge_function();

-- 2. User Answers (Daily Questions)
drop trigger if exists on_answer_insert_notify on public.user_answers;
create trigger on_answer_insert_notify
  after insert on public.user_answers
  for each row execute function public.notify_edge_function();

-- 3. Fantasy Bucket List (New Fantasy, Approval)
drop trigger if exists on_fantasy_notify on public.fantasy_bucket_list;
create trigger on_fantasy_notify
  after insert or update on public.fantasy_bucket_list
  for each row execute function public.notify_edge_function();

-- 4. Coupons (Gift, Activation)
drop trigger if exists on_coupon_notify on public.coupons;
create trigger on_coupon_notify
  after insert or update on public.coupons
  for each row execute function public.notify_edge_function();
