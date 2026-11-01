create function private.set_response_deadline(meeting_id uuid,deadline timestamptz,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare e public.events;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if e.id is null or e.creator_id<>auth.uid() then raise exception 'Tylko organizator może ustawić termin odpowiedzi.' using errcode='42501'; end if;
 if expected_revision is distinct from e.revision then raise exception 'EVENT_CHANGED: Spotkanie zmieniło się. Odśwież kalendarz.'; end if;
 if deadline is not null and (not isfinite(deadline) or deadline<=clock_timestamp()) then raise exception 'Termin odpowiedzi musi być w przyszłości.'; end if;
 update public.events set response_deadline=deadline,revision=revision+1,updated_at=now() where id=meeting_id;
end $$;

