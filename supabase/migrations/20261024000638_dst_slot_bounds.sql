
create or replace function private.valid_slot(e public.events, instant timestamptz) returns boolean
language sql stable set search_path = ''
as $$ select instant is not null
 and (instant at time zone e.timezone)::date between e.start_date and e.end_date
 and (instant at time zone e.timezone)::time >= e.day_start_time
 and (instant at time zone e.timezone)::time < e.day_end_time
 and extract(second from instant at time zone e.timezone) = 0
 and extract(minute from instant at time zone e.timezone)::int % 30 = 0
 and ((instant + interval '30 minutes') at time zone e.timezone)::date = (instant at time zone e.timezone)::date
 and ((instant + interval '30 minutes') at time zone e.timezone)::time >= e.day_start_time
 and ((instant + interval '30 minutes') at time zone e.timezone)::time <= e.day_end_time $$;
