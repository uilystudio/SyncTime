
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(btrim(display_name)) between 1 and 40),
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon,authenticated;
grant select,insert,update on public.profiles to authenticated;
create policy own_profile_select on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy own_profile_insert on public.profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_profile_update on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);


alter table private.invitations add column token text check(token ~ '^[a-f0-9]{64}$');
create or replace function private.create_meeting(input jsonb) returns jsonb
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
 insert into private.invitations(event_id,token_hash,token)
 values(e.id,encode(sha256(convert_to(token,'UTF8')),'hex'),token);
 insert into public.participants(event_id,user_id,display_name) values(e.id,uid,btrim(input->>'display_name'));
 return jsonb_build_object('id',e.id,'token',token);
end $$;


create or replace function private.read_meeting(meeting_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
 if not private.is_member(meeting_id) then raise exception 'Dołącz do spotkania przez link zaproszenia.' using errcode='42501'; end if;
 select jsonb_build_object('event',to_jsonb(e),'invitation',(select i.token from private.invitations i where i.event_id=meeting_id),
 'participants',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at,p.id) from public.participants p where event_id=meeting_id),'[]'::jsonb),
 'slots',coalesce((select jsonb_agg(jsonb_build_object('participant_id',participant_id,'slot_start',slot_start)) from public.availability_slots where event_id=meeting_id),'[]'::jsonb))
 into result from public.events e where id=meeting_id;
 return result;
end $$;



do $$
begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end $$;
create policy no_direct_invitation_access on private.invitations for all to authenticated using(false) with check(false);
