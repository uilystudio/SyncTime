create function private.set_meeting_response(meeting_id uuid,response text,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare e public.events; pid uuid;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 select id into pid from public.participants where event_id=meeting_id and user_id=auth.uid() for update;
 if pid is null then raise exception 'Brak dostępu do tego spotkania.' using errcode='42501'; end if;
 if private.collection_closed(e) then raise exception 'COLLECTION_CLOSED: Zbieranie odpowiedzi zostało zamknięte.'; end if;
 if expected_revision is distinct from e.revision then raise exception 'EVENT_CHANGED: Spotkanie zmieniło się. Odśwież kalendarz.'; end if;
 if response is null or response not in ('pending','unavailable') then raise exception 'Niepoprawna odpowiedź.'; end if;
 delete from public.availability_slots where participant_id=pid;
 update public.participants set response_status=response,responded_at=case when response='unavailable' then clock_timestamp() else null end,updated_at=now() where id=pid;
 if e.selected_start is not null and not private.required_available(e,e.selected_start) then
  update public.events set selected_start=null,revision=revision+1,updated_at=now() where id=meeting_id;
 end if;
end $$;

