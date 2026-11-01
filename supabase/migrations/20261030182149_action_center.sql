
create function private.action_center_items(as_of timestamptz)
returns table(id uuid,kind text,event_id uuid,title text,body text,due_at timestamptz,due_date date,timezone text,revision integer,confirmation_version integer,meeting_duration_minutes integer)
language sql stable security definer set search_path='' as $$
 with own as materialized (
  select p.* from public.participants p where p.user_id=auth.uid()
 )
 select e.id,'availability',e.id,e.title,'Podaj godziny, w których możesz się spotkać.',
 coalesce(e.response_deadline,(e.end_date+e.day_end_time) at time zone e.timezone),null::date,e.timezone,e.revision,e.confirmation_version,e.meeting_duration_minutes
 from own p join public.events e on e.id=p.event_id
 where p.response_status='pending' and e.selected_start is null and e.closed_at is null
 and (e.response_deadline is null or e.response_deadline>as_of)
 and (e.end_date+e.day_end_time) at time zone e.timezone>as_of
 union all
 select e.id,'attendance',e.id,e.title,'Daj ekipie znać, czy będziesz na wybranym spotkaniu.',
 e.selected_start,null::date,e.timezone,e.revision,e.confirmation_version,e.meeting_duration_minutes
 from own p join public.events e on e.id=p.event_id
 where p.attendance_status='pending' and e.selected_start is not null
 and e.selected_start+make_interval(mins=>e.meeting_duration_minutes)>as_of
 union all
 select i.id,'invitation',e.id,e.title,'Twoja grupa zaprasza Cię do wspólnego planowania.',
 coalesce(e.response_deadline,e.selected_start,(e.end_date+e.day_end_time) at time zone e.timezone),null::date,e.timezone,0,e.confirmation_version,e.meeting_duration_minutes
 from public.group_meeting_invitations i join public.events e on e.id=i.event_id
 where i.user_id=auth.uid() and i.status='pending' and e.closed_at is null
 and (e.response_deadline is null or e.response_deadline>as_of)
 and case when e.selected_start is not null then e.selected_start+make_interval(mins=>e.meeting_duration_minutes)>as_of
  else (e.end_date+e.day_end_time) at time zone e.timezone>as_of end
 and not exists(select 1 from own p where p.event_id=i.event_id)
 union all
 select item.id,'task',e.id,e.title,item.body,
 case when item.due_date is not null then (item.due_date+1)::timestamp at time zone e.timezone else null::timestamptz end,
 item.due_date,e.timezone,item.revision,e.confirmation_version,e.meeting_duration_minutes
 from public.meeting_items item join own p on p.id=item.assignee_id and p.event_id=item.event_id
 join public.events e on e.id=item.event_id
 where item.kind='task' and not item.completed and e.agenda_enabled
$$;
revoke all on function private.action_center_items(timestamptz) from public,anon,authenticated;

create function private.read_action_center(category text,after_time timestamptz,after_kind text,after_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if category is null or category not in ('all','availability','invitation','attendance','task') then raise exception 'Niepoprawna kategoria.'; end if;
 if num_nonnulls(after_time,after_kind,after_id) not in (0,3) then raise exception 'Niepoprawny kursor.'; end if;
 if after_kind is not null and after_kind not in ('availability','invitation','attendance','task') then raise exception 'Niepoprawny kursor.'; end if;
 with items as materialized (
  select i.*,coalesce(i.due_at,'infinity'::timestamptz) as sort_at from private.action_center_items(statement_timestamp()) i
 ), filtered as (
  select * from items where category='all' or kind=category
 ), candidates as (
  select * from filtered where after_time is null or (sort_at,kind,id)>(after_time,after_kind,after_id)
  order by sort_at,kind,id limit 31
 ), page as (select * from candidates order by sort_at,kind,id limit 30)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p)-'sort_at' order by p.sort_at,p.kind,p.id) from page p),'[]'::jsonb),
 'counts',jsonb_build_object('availability',(select count(*) from items where kind='availability'),
 'invitation',(select count(*) from items where kind='invitation'),'attendance',(select count(*) from items where kind='attendance'),'task',(select count(*) from items where kind='task')),
 'total',(select count(*) from filtered),'has_more',(select count(*)>30 from candidates),
 'cursor',(select jsonb_build_object('sort_at',sort_at,'kind',kind,'id',id) from page order by sort_at desc,kind desc,id desc limit 1)) into result;
 return result;
end $$;
create function public.read_action_center(category text default 'all',after_time timestamptz default null,after_kind text default null,after_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$ select private.read_action_center(category,after_time,after_kind,after_id) $$;
revoke all on function private.read_action_center(text,timestamptz,text,uuid),public.read_action_center(text,timestamptz,text,uuid) from public,anon,authenticated;
grant execute on function private.read_action_center(text,timestamptz,text,uuid),public.read_action_center(text,timestamptz,text,uuid) to authenticated;
