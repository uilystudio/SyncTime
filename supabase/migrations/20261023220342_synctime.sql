

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  creator_id uuid not null references auth.users(id),
  start_date date not null,
  end_date date not null check (end_date >= start_date and end_date - start_date <= 30),
  day_start_time time not null,
  day_end_time time not null,
  timezone text not null,
  meeting_duration_minutes integer not null check (meeting_duration_minutes in (30,60,90,120)),
  selected_start timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (day_end_time > day_start_time),
  check (extract(second from day_start_time) = 0 and extract(minute from day_start_time)::int % 30 = 0),
  check (extract(second from day_end_time) = 0 and extract(minute from day_end_time)::int % 30 = 0),
  check (extract(epoch from (day_end_time - day_start_time)) / 60 >= meeting_duration_minutes)
);
create index events_creator_idx on public.events(creator_id);
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id,user_id),
  unique(event_id,id)
);
create index participants_user_idx on public.participants(user_id);
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null,
  slot_start timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key(event_id,participant_id) references public.participants(event_id,id) on delete cascade,
  unique(participant_id,slot_start)
);
create index slots_event_start_idx on public.availability_slots(event_id,slot_start);
create table private.invitations (
  event_id uuid primary key references public.events(id) on delete cascade,
  token_hash text unique not null
);
alter table private.invitations enable row level security;
alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.availability_slots enable row level security;

create function private.is_member(meeting_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select auth.uid() is not null and exists (
 select 1 from public.participants where event_id = meeting_id and user_id = auth.uid()
) $$;
create policy member_reads_events on public.events for select to authenticated using (private.is_member(id));
create policy member_reads_participants on public.participants for select to authenticated using (private.is_member(event_id));
create policy member_reads_slots on public.availability_slots for select to authenticated using (private.is_member(event_id));
revoke all on public.events, public.participants, public.availability_slots from anon, authenticated;
grant select on public.events, public.participants, public.availability_slots to authenticated;
revoke all on private.invitations from public,anon,authenticated;

create function private.valid_slot(e public.events, instant timestamptz) returns boolean
language sql stable set search_path = ''
as $$ select instant is not null
 and (instant at time zone e.timezone)::date between e.start_date and e.end_date
 and (instant at time zone e.timezone)::time >= e.day_start_time
 and (instant at time zone e.timezone)::time < e.day_end_time
 and extract(second from instant at time zone e.timezone) = 0
 and extract(minute from instant at time zone e.timezone)::int % 30 = 0 $$;

create function private.create_meeting(input jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare e public.events; token text; uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if not exists (select 1 from pg_catalog.pg_timezone_names where name = input->>'timezone') then
  raise exception 'Niepoprawna strefa czasowa.';
 end if;
 token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
 insert into public.events(title,description,creator_id,start_date,end_date,day_start_time,day_end_time,timezone,meeting_duration_minutes)
 values (btrim(input->>'title'),coalesce(input->>'description',''),uid,(input->>'start_date')::date,(input->>'end_date')::date,
 (input->>'day_start_time')::time,(input->>'day_end_time')::time,input->>'timezone',(input->>'meeting_duration_minutes')::int)
 returning * into e;
 insert into private.invitations(event_id,token_hash)
 values(e.id,encode(sha256(convert_to(token,'UTF8')),'hex'));
 insert into public.participants(event_id,user_id,display_name) values(e.id,uid,btrim(input->>'display_name'));
 return jsonb_build_object('id',e.id,'token',token);
end $$;

create function private.preview_meeting(invitation text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare eid uuid; result jsonb;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if invitation is null or invitation !~ '^[a-fA-F0-9]{64}$' then raise exception 'Niepoprawny link zaproszenia.'; end if;
 select event_id into eid from private.invitations where token_hash=encode(sha256(convert_to(invitation,'UTF8')),'hex');
 if eid is null then raise exception 'Nie znaleziono spotkania. Sprawdź link zaproszenia.'; end if;
 select jsonb_build_object('event',to_jsonb(e),'participant_count',(select count(*) from public.participants where event_id=eid))
 into result from public.events e where id=eid;
 return result;
end $$;

create function private.join_meeting(invitation text,nickname text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare eid uuid; pid uuid; uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 perform private.preview_meeting(invitation);
 select event_id into eid from private.invitations where token_hash=encode(sha256(convert_to(invitation,'UTF8')),'hex');
 insert into public.participants(event_id,user_id,display_name) values(eid,uid,btrim(nickname))
 on conflict(event_id,user_id) do update set display_name=excluded.display_name,updated_at=now() returning id into pid;
 return pid;
end $$;

create function private.read_meeting(meeting_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
 if not private.is_member(meeting_id) then raise exception 'Dołącz do spotkania przez link zaproszenia.' using errcode='42501'; end if;
 select jsonb_build_object('event',to_jsonb(e),
 'participants',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at,p.id) from public.participants p where event_id=meeting_id),'[]'::jsonb),
 'slots',coalesce((select jsonb_agg(jsonb_build_object('participant_id',participant_id,'slot_start',slot_start)) from public.availability_slots where event_id=meeting_id),'[]'::jsonb))
 into result from public.events e where id=meeting_id;
 return result;
end $$;

create function private.save_availability(meeting_id uuid,instants timestamptz[]) returns void
language plpgsql security definer set search_path = ''
as $$
declare pid uuid; e public.events; uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;

 select id into pid from public.participants where event_id=meeting_id and user_id=uid for update;
 if pid is null then raise exception 'Brak dostępu do tego spotkania.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id;
 if instants is null or cardinality(instants)>1500 then raise exception 'Niepoprawna liczba przedziałów.'; end if;
 if exists (select 1 from unnest(instants) t where not coalesce(private.valid_slot(e,t),false)) then raise exception 'Godziny poza zakresem spotkania.'; end if;

 delete from public.availability_slots where participant_id=pid and not(slot_start=any(instants));
 insert into public.availability_slots(event_id,participant_id,slot_start)
 select meeting_id,pid,t from (select distinct unnest(instants) t) s
 on conflict(participant_id,slot_start) do nothing;
end $$;

create function private.confirm_meeting(meeting_id uuid,chosen_start timestamptz) returns void
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
 update public.events set selected_start=chosen_start,updated_at=now() where id=meeting_id;
end $$;


create function public.create_meeting(input jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.create_meeting(input) $$;
create function public.preview_meeting(invitation text) returns jsonb language sql stable security invoker set search_path='' as $$ select private.preview_meeting(invitation) $$;
create function public.join_meeting(invitation text,nickname text) returns uuid language sql security invoker set search_path='' as $$ select private.join_meeting(invitation,nickname) $$;
create function public.read_meeting(meeting_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.read_meeting(meeting_id) $$;
create function public.save_availability(meeting_id uuid,instants timestamptz[]) returns void language sql security invoker set search_path='' as $$ select private.save_availability(meeting_id,instants) $$;
create function public.confirm_meeting(meeting_id uuid,chosen_start timestamptz) returns void language sql security invoker set search_path='' as $$ select private.confirm_meeting(meeting_id,chosen_start) $$;

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_member(uuid),private.create_meeting(jsonb),private.preview_meeting(text),private.join_meeting(text,text),private.read_meeting(uuid),private.save_availability(uuid,timestamptz[]),private.confirm_meeting(uuid,timestamptz) to authenticated;
revoke all on function public.create_meeting(jsonb),public.preview_meeting(text),public.join_meeting(text,text),public.read_meeting(uuid),public.save_availability(uuid,timestamptz[]),public.confirm_meeting(uuid,timestamptz) from public,anon;
grant execute on function public.create_meeting(jsonb),public.preview_meeting(text),public.join_meeting(text,text),public.read_meeting(uuid),public.save_availability(uuid,timestamptz[]),public.confirm_meeting(uuid,timestamptz) to authenticated;



do $$
declare tab text;
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach tab in array array['events','participants','availability_slots'] loop
   if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=tab) then
    execute format('alter publication supabase_realtime add table public.%I',tab);
   end if;
  end loop;
 end if;
end $$;
