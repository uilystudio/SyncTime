create or replace function private.join_meeting(invitation text,nickname text) returns uuid
language plpgsql security definer set search_path=''
as $$
declare eid uuid; pid uuid; e public.events; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 perform private.preview_meeting(invitation);
 select event_id into eid from private.invitations where token_hash=encode(sha256(convert_to(invitation,'UTF8')),'hex');
 select * into e from public.events where id=eid for update;
 if e.closed_at is not null then raise exception 'COLLECTION_CLOSED: Organizator zamknął dołączanie i zbieranie dostępności.'; end if;
 insert into public.participants(event_id,user_id,display_name) values(eid,uid,btrim(nickname))
 on conflict(event_id,user_id) do update set display_name=excluded.display_name,updated_at=now() returning id into pid;
 return pid;
end $$;

create or replace function private.read_meeting(meeting_id uuid) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not private.is_member(meeting_id) then raise exception 'Dołącz do spotkania przez link zaproszenia.' using errcode='42501'; end if;
 select jsonb_build_object('event',to_jsonb(e),'invitation',(select i.token from private.invitations i where i.event_id=meeting_id),
 'participants',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at,p.id) from public.participants p where event_id=meeting_id),'[]'::jsonb),
 'slots',coalesce((select jsonb_agg(jsonb_build_object('participant_id',participant_id,'slot_start',slot_start,'is_preferred',is_preferred)) from public.availability_slots where event_id=meeting_id),'[]'::jsonb))
 into result from public.events e where id=meeting_id;
 return result;
end $$;

create function public.save_availability_v2(meeting_id uuid,instants timestamptz[],preferred_instants timestamptz[],expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.save_availability_v2(meeting_id,instants,preferred_instants,expected_revision) $$;
create function public.update_meeting(meeting_id uuid,input jsonb,expected_revision integer,allow_trim boolean) returns jsonb
language sql security invoker set search_path='' as $$ select private.update_meeting(meeting_id,input,expected_revision,allow_trim) $$;
create function public.set_meeting_closed(meeting_id uuid,should_close boolean,expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.set_meeting_closed(meeting_id,should_close,expected_revision) $$;
revoke all on function private.save_availability_v2(uuid,timestamptz[],timestamptz[],integer),private.update_meeting(uuid,jsonb,integer,boolean),private.set_meeting_closed(uuid,boolean,integer) from public,anon;
revoke all on function public.save_availability_v2(uuid,timestamptz[],timestamptz[],integer),public.update_meeting(uuid,jsonb,integer,boolean),public.set_meeting_closed(uuid,boolean,integer) from public,anon;
grant execute on function private.save_availability_v2(uuid,timestamptz[],timestamptz[],integer),private.update_meeting(uuid,jsonb,integer,boolean),private.set_meeting_closed(uuid,boolean,integer) to authenticated;
grant execute on function public.save_availability_v2(uuid,timestamptz[],timestamptz[],integer),public.update_meeting(uuid,jsonb,integer,boolean),public.set_meeting_closed(uuid,boolean,integer) to authenticated;

create or replace function private.confirm_meeting(meeting_id uuid,chosen_start timestamptz) returns void
language plpgsql security definer set search_path = ''
as $$
declare e public.events; instant timestamptz; uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if e.id is null or e.creator_id<>uid then raise exception 'Tylko organizator może wybrać termin.' using errcode='42501'; end if;
 if chosen_start is not null then
  for instant in select generate_series(chosen_start,chosen_start+make_interval(mins=>e.meeting_duration_minutes-30),interval '30 minutes') loop
   if not private.valid_slot(e,instant) or (instant at time zone e.timezone)::date<>(chosen_start at time zone e.timezone)::date then
    raise exception 'Termin nie mieści się w zakresie spotkania.';
   end if;
  end loop;
  if not exists (
   select 1 from public.participants p where p.event_id=meeting_id and not exists (
    select 1 from generate_series(chosen_start,chosen_start+make_interval(mins=>e.meeting_duration_minutes-30),interval '30 minutes') t
    where not exists(select 1 from public.availability_slots s where s.participant_id=p.id and s.slot_start=t)
   )
  ) then raise exception 'Nikt nie jest dostępny przez cały wybrany termin. Odśwież propozycje.'; end if;
 end if;
 update public.events set selected_start=chosen_start,revision=revision+1,updated_at=now() where id=meeting_id;
end $$;
