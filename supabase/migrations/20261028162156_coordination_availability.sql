create or replace function private.save_availability_v2(meeting_id uuid,instants timestamptz[],preferred_instants timestamptz[],expected_revision integer) returns void
language plpgsql security definer set search_path=''
as $$
declare e public.events; pid uuid; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 select id into pid from public.participants where event_id=meeting_id and user_id=uid for update;
 if pid is null then raise exception 'Brak dostępu do tego spotkania.' using errcode='42501'; end if;
 if private.collection_closed(e) then raise exception 'COLLECTION_CLOSED: Organizator zamknął zbieranie dostępności. Odśwież kalendarz.'; end if;
 if expected_revision is distinct from e.revision then raise exception 'EVENT_CHANGED: Ustawienia spotkania zmieniły się. Wczytaj aktualny kalendarz przed zapisaniem.'; end if;
 if instants is null or preferred_instants is null or cardinality(instants)>1500 or cardinality(preferred_instants)>1500 then raise exception 'Niepoprawna liczba przedziałów.'; end if;
 if exists(select 1 from unnest(instants) t where not coalesce(private.valid_slot(e,t),false)) then raise exception 'Godziny poza zakresem spotkania.'; end if;
 if exists(select 1 from unnest(preferred_instants) t where t is null or not coalesce(t=any(instants),false)) then raise exception 'Preferowane godziny muszą należeć do Twojej dostępności.'; end if;
 delete from public.availability_slots where participant_id=pid and not(slot_start=any(instants));
 insert into public.availability_slots(event_id,participant_id,slot_start,is_preferred)
 select meeting_id,pid,t,t=any(preferred_instants) from (select distinct unnest(instants) t) s
 on conflict(participant_id,slot_start) do update set is_preferred=excluded.is_preferred
 where public.availability_slots.is_preferred is distinct from excluded.is_preferred;
update public.participants set response_status=case when cardinality(instants)>0 then 'available' else 'pending' end,
 responded_at=case when cardinality(instants)>0 then clock_timestamp() else null end,updated_at=now() where id=pid;
 if e.selected_start is not null and not private.required_available(e,e.selected_start) then
  update public.events set selected_start=null,revision=revision+1,updated_at=now() where id=meeting_id;
 end if;
end $$;

create or replace function private.join_meeting(invitation text,nickname text) returns uuid
language plpgsql security definer set search_path=''
as $$
declare eid uuid; pid uuid; e public.events; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 perform private.preview_meeting(invitation);
 select event_id into eid from private.invitations where token_hash=encode(sha256(convert_to(invitation,'UTF8')),'hex');
 select * into e from public.events where id=eid for update;
 if private.collection_closed(e) then raise exception 'COLLECTION_CLOSED: Organizator zamknął dołączanie i zbieranie dostępności.'; end if;
 insert into public.participants(event_id,user_id,display_name) values(eid,uid,btrim(nickname))
 on conflict(event_id,user_id) do update set display_name=excluded.display_name,updated_at=now() returning id into pid;
 return pid;
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

create or replace function private.set_meeting_closed(meeting_id uuid,should_close boolean,expected_revision integer) returns void
language plpgsql security definer set search_path=''
as $$
declare e public.events;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if e.id is null or e.creator_id<>auth.uid() then raise exception 'Tylko organizator może zamknąć lub wznowić spotkanie.' using errcode='42501'; end if;
 if expected_revision is distinct from e.revision then raise exception 'EVENT_CHANGED: Spotkanie zmieniło się. Odśwież kalendarz.'; end if;
 if should_close is null then raise exception 'Wybierz poprawny stan spotkania.'; end if;
 update public.events set closed_at=case when should_close then coalesce(closed_at,now()) else null end,response_deadline=case when not should_close and response_deadline<=clock_timestamp() then null else response_deadline end,revision=revision+1,updated_at=now() where id=meeting_id;
end $$;

