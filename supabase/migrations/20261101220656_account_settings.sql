alter table public.profiles
 add column full_name text not null default '' check(char_length(full_name)<=100),
 add column organization text not null default '' check(char_length(organization)<=120),
 add column timezone text not null default 'Europe/Warsaw';

create function private.validate_profile_settings() returns trigger
language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then
  raise exception 'Wybierz poprawną strefę czasową.';
 end if;
 new.display_name:=btrim(new.display_name);
 new.full_name:=btrim(new.full_name);
 new.organization:=btrim(new.organization);
 return new;
end $$;
revoke all on function private.validate_profile_settings() from public,anon,authenticated;
create trigger validate_profile_settings before insert or update on public.profiles
for each row execute function private.validate_profile_settings();

create function private.delete_own_account(confirmation text) returns void
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid();
 claims jsonb:=auth.jwt();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if confirmation is distinct from 'USUŃ KONTO' then
  raise exception 'Wpisz dokładnie USUŃ KONTO.';
 end if;
 perform 1 from auth.users where id=uid for update;
 if not found then raise exception 'Konto nie istnieje.' using errcode='42501'; end if;
 if not exists(select 1 from auth.sessions where user_id=uid and id=(claims->>'session_id')::uuid)
 or not exists(
  select 1 from jsonb_array_elements(coalesce(claims->'amr','[]'::jsonb)) method
  where method->>'method'='password'
  and (method->>'timestamp')::numeric between extract(epoch from clock_timestamp())-300 and extract(epoch from clock_timestamp())+30
 ) then
  raise exception 'Potwierdź usunięcie przez ponowne podanie hasła.' using errcode='42501';
 end if;
 perform 1 from public.events e
 where e.creator_id=uid or exists(select 1 from public.participants p where p.event_id=e.id and p.user_id=uid)
 order by e.id for update;
 update public.meeting_items set assignee_id=null,revision=revision+1
 where assignee_id in(select id from public.participants where user_id=uid);
 delete from public.notifications n where n.kind='comment'
 and n.dedupe_key in(select 'comment:'||c.id from public.meeting_comments c
 join public.participants p on p.id=c.participant_id where p.user_id=uid);
 delete from public.events where creator_id=uid;
 delete from public.participants where user_id=uid;
 delete from public.participant_groups where owner_id=uid;
 delete from auth.sessions where user_id=uid;
 delete from auth.users where id=uid;
end $$;
revoke all on function private.delete_own_account(text) from public,anon,authenticated;
grant execute on function private.delete_own_account(text) to authenticated;

create function public.delete_own_account(confirmation text) returns void
language sql security invoker set search_path='' as $$
 select private.delete_own_account(confirmation)
$$;
revoke all on function public.delete_own_account(text) from public,anon,authenticated;
grant execute on function public.delete_own_account(text) to authenticated;
