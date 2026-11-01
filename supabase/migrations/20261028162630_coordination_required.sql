create function private.set_participant_required(meeting_id uuid,person_id uuid,required boolean,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare e public.events; previous boolean;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if e.id is null or e.creator_id<>auth.uid() then raise exception 'Tylko organizator może wybrać wymaganych uczestników.' using errcode='42501'; end if;
 if expected_revision is distinct from e.revision then raise exception 'EVENT_CHANGED: Spotkanie zmieniło się. Odśwież kalendarz.'; end if;
 if required is null then raise exception 'Wybierz poprawny stan uczestnika.'; end if;
 select is_required into previous from public.participants where id=person_id and event_id=meeting_id for update;
 if not found then raise exception 'Ta osoba nie należy do spotkania.'; end if;
 if previous is not distinct from required then return; end if;
 update public.participants set is_required=required,updated_at=now() where id=person_id;
 update public.events set revision=revision+1,selected_start=case when selected_start is not null and not private.required_available(e,selected_start) then null else selected_start end,updated_at=now() where id=meeting_id;
end $$;

