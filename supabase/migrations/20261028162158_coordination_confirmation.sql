create or replace function private.confirm_meeting(meeting_id uuid,chosen_start timestamptz) returns void
language plpgsql security definer set search_path = ''
as $$
declare e public.events; instant timestamptz; uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if e.id is null or e.creator_id<>uid then raise exception 'Tylko organizator może wybrać termin.' using errcode='42501'; end if;
 if chosen_start is not null then
  if not private.required_available(e,chosen_start) then raise exception 'Wybrany termin nie pasuje wszystkim wymaganym uczestnikom. Odśwież propozycje.'; end if;
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

create or replace function private.create_meeting(input jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare e public.events; token text; uid uuid := auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if not exists (select 1 from pg_catalog.pg_timezone_names where name = input->>'timezone') then
  raise exception 'Niepoprawna strefa czasowa.';
 end if;
 if input->>'response_deadline' is not null and (not isfinite((input->>'response_deadline')::timestamptz) or (input->>'response_deadline')::timestamptz<=clock_timestamp()) then raise exception 'Termin odpowiedzi musi być w przyszłości.'; end if;
 token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
 insert into public.events(title,description,creator_id,start_date,end_date,day_start_time,day_end_time,timezone,meeting_duration_minutes,response_deadline)
 values (btrim(input->>'title'),coalesce(input->>'description',''),uid,(input->>'start_date')::date,(input->>'end_date')::date,
 (input->>'day_start_time')::time,(input->>'day_end_time')::time,input->>'timezone',(input->>'meeting_duration_minutes')::int,(input->>'response_deadline')::timestamptz)
 returning * into e;
 insert into private.invitations(event_id,token_hash,token)
 values(e.id,encode(sha256(convert_to(token,'UTF8')),'hex'),token);
 insert into public.participants(event_id,user_id,display_name) values(e.id,uid,btrim(input->>'display_name'));
 return jsonb_build_object('id',e.id,'token',token);
end $$;
