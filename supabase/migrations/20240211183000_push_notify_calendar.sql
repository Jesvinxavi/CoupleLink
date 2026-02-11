-- 5. Calendar Events (New Event)
-- This supplements the previous migration (20240211180000_push_notify_webhooks.sql)
-- reusing the same notify_edge_function()

drop trigger if exists on_calendar_notify on public.calendar_events;
create trigger on_calendar_notify
  after insert on public.calendar_events
  for each row execute function public.notify_edge_function();
