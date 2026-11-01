
alter table public.events add column response_deadline timestamptz;
alter table public.participants
 add column response_status text not null default 'pending' check(response_status in ('pending','available','unavailable')),
 add column responded_at timestamptz,
 add column is_required boolean not null default false;
update public.participants p set response_status='available',responded_at=now()
 where exists(select 1 from public.availability_slots s where s.participant_id=p.id);


create function private.collection_closed(e public.events) returns boolean
language sql volatile set search_path='' as $$ select e.closed_at is not null or coalesce(e.response_deadline<=clock_timestamp(),false) $$;
create function private.required_available(e public.events,chosen timestamptz) returns boolean
language sql stable set search_path='' as $$
 select not exists(select 1 from public.participants p where p.event_id=e.id and p.is_required and exists(
  select 1 from generate_series(chosen,chosen+make_interval(mins=>e.meeting_duration_minutes-30),interval '30 minutes') t
  where not exists(select 1 from public.availability_slots s where s.participant_id=p.id and s.slot_start=t)
 ))
$$;
revoke all on function private.collection_closed(public.events),private.required_available(public.events,timestamptz) from public,anon,authenticated;

