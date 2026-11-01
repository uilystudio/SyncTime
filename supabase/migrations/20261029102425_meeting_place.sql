
alter table public.events
 add column meeting_mode text not null default 'undecided',
 add column meeting_location text not null default '',
 add constraint events_meeting_place_check check (
  char_length(meeting_location)<=500 and (
   (meeting_mode='undecided' and meeting_location='') or
   (meeting_mode='in_person' and char_length(btrim(meeting_location))>=3) or
   (meeting_mode='online' and meeting_location ~* '^https?://[^/?#[:space:]@\\]+([/?#][^[:space:]\\]*)?$')
  )
 );

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
 insert into public.events(title,description,creator_id,start_date,end_date,day_start_time,day_end_time,timezone,meeting_duration_minutes,response_deadline,meeting_mode,meeting_location)
 values (btrim(input->>'title'),coalesce(input->>'description',''),uid,(input->>'start_date')::date,(input->>'end_date')::date,
 (input->>'day_start_time')::time,(input->>'day_end_time')::time,input->>'timezone',(input->>'meeting_duration_minutes')::int,(input->>'response_deadline')::timestamptz,coalesce(input->>'meeting_mode','undecided'),btrim(coalesce(input->>'meeting_location','')))
 returning * into e;
 insert into private.invitations(event_id,token_hash,token)
 values(e.id,encode(sha256(convert_to(token,'UTF8')),'hex'),token);
 insert into public.participants(event_id,user_id,display_name) values(e.id,uid,btrim(input->>'display_name'));
 return jsonb_build_object('id',e.id,'token',token);
end $$;

create or replace function private.update_meeting(meeting_id uuid,input jsonb,expected_revision integer,allow_trim boolean) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare old_event public.events; e public.events; changed boolean; removed integer; cleared boolean;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into old_event from public.events where id=meeting_id for update;
 if old_event.id is null or old_event.creator_id<>auth.uid() then raise exception 'Tylko organizator może edytować spotkanie.' using errcode='42501'; end if;
 if expected_revision is distinct from old_event.revision then raise exception 'EVENT_CHANGED: Spotkanie zmieniło się w innym oknie. Odśwież je i sprawdź zmiany.'; end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=input->>'timezone') then raise exception 'Niepoprawna strefa czasowa.'; end if;
 changed := row(old_event.start_date,old_event.end_date,old_event.day_start_time,old_event.day_end_time,old_event.timezone,old_event.meeting_duration_minutes)
  is distinct from row((input->>'start_date')::date,(input->>'end_date')::date,(input->>'day_start_time')::time,(input->>'day_end_time')::time,input->>'timezone',(input->>'meeting_duration_minutes')::integer);
 if changed and private.collection_closed(old_event) then raise exception 'Najpierw wznów zbieranie dostępności, aby zmienić zakres kalendarza.'; end if;
 cleared := changed and old_event.selected_start is not null;
 update public.events set title=btrim(input->>'title'),description=coalesce(input->>'description',''),
 meeting_mode=coalesce(input->>'meeting_mode',old_event.meeting_mode),meeting_location=case when input ? 'meeting_location' then btrim(coalesce(input->>'meeting_location','')) else old_event.meeting_location end,
 start_date=(input->>'start_date')::date,end_date=(input->>'end_date')::date,
 day_start_time=(input->>'day_start_time')::time,day_end_time=(input->>'day_end_time')::time,
 timezone=input->>'timezone',meeting_duration_minutes=(input->>'meeting_duration_minutes')::integer,
 selected_start=case when changed then null else selected_start end,revision=revision+1,updated_at=now()
 where id=meeting_id returning * into e;
 select count(*) into removed from public.availability_slots s where s.event_id=meeting_id and not coalesce(private.valid_slot(e,s.slot_start),false);
 if removed>0 and not coalesce(allow_trim,false) then raise exception 'TRIM_REQUIRED: Nowy zakres usuwa % zaznaczeń. Odśwież podgląd i potwierdź usunięcie.',removed; end if;
 delete from public.availability_slots s where s.event_id=meeting_id and not coalesce(private.valid_slot(e,s.slot_start),false);
 update public.participants p set response_status='pending',responded_at=null,updated_at=now()
 where p.event_id=meeting_id and p.response_status='available' and not exists(select 1 from public.availability_slots s where s.participant_id=p.id);
 return jsonb_build_object('removed_slots',removed,'confirmation_reset',cleared);
end $$;
