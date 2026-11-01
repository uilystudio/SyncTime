
create table public.participant_groups (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 name text not null check(char_length(btrim(name)) between 2 and 80),
 created_at timestamptz not null default clock_timestamp()
);
create index participant_groups_owner_idx on public.participant_groups(owner_id);
create table public.group_members (
 group_id uuid not null references public.participant_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(char_length(btrim(display_name)) between 1 and 40),
 joined_at timestamptz not null default clock_timestamp(),
 primary key(group_id,user_id)
);
create index group_members_user_idx on public.group_members(user_id,group_id);
create table private.group_links (
 group_id uuid primary key references public.participant_groups(id) on delete cascade,
 token text not null unique check(token ~ '^[a-f0-9]{64}$'),
 token_hash text not null unique
);
alter table private.group_links enable row level security;
create policy no_direct_group_links on private.group_links for all to authenticated using(false) with check(false);
revoke all on private.group_links from public,anon,authenticated;

create function private.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.group_members where group_id=gid and user_id=auth.uid())
$$;
alter table public.participant_groups enable row level security;
alter table public.group_members enable row level security;
create policy group_member_reads_group on public.participant_groups for select to authenticated using(private.is_group_member(id));
create policy group_member_reads_members on public.group_members for select to authenticated using(private.is_group_member(group_id));
revoke all on public.participant_groups,public.group_members from public,anon,authenticated;
grant select on public.participant_groups,public.group_members to authenticated;

alter table public.events add column agenda_enabled boolean not null default false,
 add column confirmation_version integer not null default 0;
alter table public.participants add column attendance_status text not null default 'pending' check(attendance_status in ('pending','yes','no')),
 add column attendance_updated_at timestamptz;

create table public.group_meeting_invitations (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 group_id uuid references public.participant_groups(id) on delete set null,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default clock_timestamp(),
 unique(event_id,user_id)
);
create index group_meeting_invites_user_idx on public.group_meeting_invitations(user_id,status);
create index group_meeting_invites_group_idx on public.group_meeting_invitations(group_id);
alter table public.group_meeting_invitations enable row level security;
create policy own_meeting_invitation on public.group_meeting_invitations for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.group_meeting_invitations from public,anon,authenticated;
grant select on public.group_meeting_invitations to authenticated;

create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_id uuid not null references public.events(id) on delete cascade,
 kind text not null check(kind in ('term_selected','term_changed','term_cleared','comment','deadline','meeting_invite')),
 title text not null,
 body text not null default '',
 dedupe_key text,
 created_at timestamptz not null default clock_timestamp(),
 read_at timestamptz,
 unique(user_id,dedupe_key)
);
create index notifications_user_timeline_idx on public.notifications(user_id,created_at desc,id desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;
create index notifications_event_idx on public.notifications(event_id);
alter table public.notifications enable row level security;
create policy own_notifications on public.notifications for select to authenticated using(
 user_id=(select auth.uid()) and (private.is_member(event_id) or (kind='meeting_invite' and exists(
 select 1 from public.group_meeting_invitations i where i.event_id=notifications.event_id and i.user_id=(select auth.uid()) and i.status='pending')))
);
revoke all on public.notifications from public,anon,authenticated;
grant select on public.notifications to authenticated;

create function private.reset_attendance_version() returns trigger
language plpgsql set search_path='' as $$
begin
 if row(new.selected_start,new.meeting_duration_minutes) is distinct from row(old.selected_start,old.meeting_duration_minutes) then
  new.confirmation_version:=old.confirmation_version+1;
 end if;
 return new;
end $$;
create trigger attendance_version before update on public.events for each row execute function private.reset_attendance_version();
create function private.notify_meeting_term() returns trigger
language plpgsql security definer set search_path='' as $$
declare notification_kind text;
begin
 if new.confirmation_version=old.confirmation_version then return new; end if;
 update public.participants set attendance_status='pending',attendance_updated_at=null where event_id=new.id;
 notification_kind:=case when new.selected_start is null then 'term_cleared' when old.selected_start is null then 'term_selected' else 'term_changed' end;
 insert into public.notifications(user_id,event_id,kind,title,body)
 select p.user_id,new.id,notification_kind,new.title,
 case when new.selected_start is null then 'Organizator ponownie otworzył wybór terminu. Poprzednie deklaracje obecności zostały wyzerowane.'
 else 'Wybrano lub zmieniono termin spotkania. Sprawdź szczegóły i potwierdź obecność.' end
 from public.participants p where p.event_id=new.id and p.user_id is distinct from auth.uid();
 return new;
end $$;
create trigger notify_meeting_term after update on public.events for each row execute function private.notify_meeting_term();
create function private.notify_meeting_comment() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(user_id,event_id,kind,title,body,dedupe_key)
 select p.user_id,new.event_id,'comment',e.title,author.display_name||' dodał(a) komentarz.','comment:'||new.id
 from public.participants p join public.events e on e.id=p.event_id
 join public.participants author on author.id=new.participant_id
 where p.event_id=new.event_id and p.id<>new.participant_id;
 return new;
end $$;
create trigger notify_meeting_comment after insert on public.meeting_comments for each row execute function private.notify_meeting_comment();

create function private.read_notifications(before_time timestamptz,before_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if (before_time is null)<>(before_id is null) then raise exception 'Niepoprawny kursor.'; end if;

 insert into public.notifications(user_id,event_id,kind,title,body,dedupe_key)
 select uid,e.id,'deadline',e.title,'Zostało mniej niż 24 godziny na podanie dostępności.',
 'deadline:'||e.id||':'||e.response_deadline::text
 from public.events e join public.participants p on p.event_id=e.id
 where p.user_id=uid and p.response_status='pending' and e.closed_at is null
 and e.response_deadline>clock_timestamp() and e.response_deadline<=clock_timestamp()+interval '24 hours'
 on conflict(user_id,dedupe_key) do nothing;
 with visible as (
  select n.* from public.notifications n where n.user_id=uid and
  (private.is_member(n.event_id) or (n.kind='meeting_invite' and exists(select 1 from public.group_meeting_invitations i where i.event_id=n.event_id and i.user_id=uid and i.status='pending')))
  and (n.kind<>'deadline' or exists(select 1 from public.events e join public.participants p on p.event_id=e.id
   where e.id=n.event_id and p.user_id=uid and p.response_status='pending' and e.closed_at is null and e.response_deadline>clock_timestamp()
   and n.dedupe_key='deadline:'||e.id||':'||e.response_deadline::text))
 ), candidates as (
  select * from visible where before_time is null or (created_at,id)<(before_time,before_id) order by created_at desc,id desc limit 51
 ), page as (select * from candidates order by created_at desc,id desc limit 50)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('invitation_status',
 (select i.status from public.group_meeting_invitations i where i.event_id=p.event_id and i.user_id=uid)) order by p.created_at desc,p.id desc) from page p),'[]'::jsonb),
 'unread',(select count(*) from visible where read_at is null),'has_more',(select count(*)>50 from candidates),
 'cursor',(select jsonb_build_object('created_at',created_at,'id',id) from page order by created_at,id limit 1)) into result;
 return result;
end $$;
create function private.mark_notifications_read(notification_id uuid,through_time timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if notification_id is null and through_time is null then raise exception 'Wybierz powiadomienie lub datę.'; end if;
 update public.notifications set read_at=clock_timestamp() where user_id=auth.uid() and read_at is null
 and ((notification_id is not null and id=notification_id) or (notification_id is null and created_at<=through_time));
end $$;
create function private.set_attendance(meeting_id uuid,response text,expected_version integer) returns void
language plpgsql security definer set search_path='' as $$
declare e public.events;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if not private.is_member(meeting_id) then raise exception 'Brak dostępu do spotkania.' using errcode='42501'; end if;
 if e.selected_start is null then raise exception 'Najpierw organizator musi wybrać termin.'; end if;
 if e.confirmation_version is distinct from expected_version then raise exception 'Termin zmienił się. Odśwież spotkanie i potwierdź nowy termin.'; end if;
 if response is null or response not in ('pending','yes','no') then raise exception 'Niepoprawna deklaracja obecności.'; end if;
 update public.participants set attendance_status=response,attendance_updated_at=clock_timestamp(),updated_at=now()
 where event_id=meeting_id and user_id=auth.uid();
end $$;
create function private.rotate_meeting_invitation(meeting_id uuid,expected_token text) returns text
language plpgsql security definer set search_path='' as $$
declare token_value text;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 perform 1 from public.events where id=meeting_id and creator_id=auth.uid() for update;
 if not found then raise exception 'Tylko organizator może zmienić link.' using errcode='42501'; end if;
 if expected_token is distinct from (select token from private.invitations where event_id=meeting_id) then raise exception 'Link już się zmienił. Odśwież spotkanie.'; end if;
 token_value:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 update private.invitations set token=token_value,token_hash=encode(sha256(convert_to(token_value,'UTF8')),'hex') where event_id=meeting_id;
 update public.events set updated_at=clock_timestamp() where id=meeting_id;
 return token_value;
end $$;

create function private.read_groups() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'owner_id',g.owner_id,
 'token',case when g.owner_id=auth.uid() then (select l.token from private.group_links l where l.group_id=g.id) else null end,
 'members',(select jsonb_agg(to_jsonb(m) order by m.joined_at,m.user_id) from public.group_members m where m.group_id=g.id)) order by g.created_at desc)
 from public.participant_groups g where private.is_group_member(g.id)),'[]'::jsonb);
end $$;
create function private.manage_group(gid uuid,action text,group_name text,member_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); g public.participant_groups; token_value text; nickname text;
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if action='create' then
  select display_name into nickname from public.profiles where user_id=uid;
  if nickname is null then raise exception 'Najpierw ustaw nazwę profilu.'; end if;
  insert into public.participant_groups(owner_id,name) values(uid,btrim(group_name)) returning * into g;
  insert into public.group_members(group_id,user_id,display_name) values(g.id,uid,nickname);
  token_value:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into private.group_links values(g.id,token_value,encode(sha256(convert_to(token_value,'UTF8')),'hex'));
  return g.id;
 end if;
 select * into g from public.participant_groups where id=gid for update;
 if g.id is null or not private.is_group_member(gid) then raise exception 'Brak dostępu do grupy.' using errcode='42501'; end if;
 if action='leave' then
  if g.owner_id=uid then raise exception 'Właściciel nie może opuścić własnej grupy.'; end if;
  delete from public.group_members where group_id=gid and user_id=uid;
  return gid;
 end if;
 if g.owner_id<>uid then raise exception 'Tylko właściciel może zarządzać grupą.' using errcode='42501'; end if;
 if action='rename' then update public.participant_groups set name=btrim(group_name) where id=gid;
 elsif action='remove' then
  if member_id=uid then raise exception 'Nie możesz usunąć właściciela.'; end if;
  delete from public.group_members where group_id=gid and user_id=member_id;
 elsif action='rotate' then
  token_value:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  update private.group_links set token=token_value,token_hash=encode(sha256(convert_to(token_value,'UTF8')),'hex') where group_id=gid;
 else raise exception 'Nieznana operacja grupy.';
 end if;
 return gid;
end $$;
create function private.preview_group(invitation text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if invitation is null or invitation !~ '^[a-f0-9]{64}$' then raise exception 'Niepoprawny link grupy.'; end if;
 select jsonb_build_object('id',g.id,'name',g.name,'member_count',(select count(*) from public.group_members m where m.group_id=g.id),'joined',private.is_group_member(g.id)) into result
 from public.participant_groups g join private.group_links l on l.group_id=g.id where l.token_hash=encode(sha256(convert_to(invitation,'UTF8')),'hex');
 if result is null then raise exception 'Link grupy jest nieprawidłowy lub został unieważniony.'; end if;
 return result;
end $$;
create function private.join_group(invitation text) returns uuid
language plpgsql security definer set search_path='' as $$
declare gid uuid; nickname text;
begin
 gid:=(private.preview_group(invitation)->>'id')::uuid;
 perform 1 from public.participant_groups where id=gid for update;

 perform private.preview_group(invitation);
 select display_name into nickname from public.profiles where user_id=auth.uid();
 if nickname is null then raise exception 'Najpierw ustaw nazwę profilu.'; end if;
 insert into public.group_members(group_id,user_id,display_name) values(gid,auth.uid(),nickname) on conflict do nothing;
 return gid;
end $$;
create function private.invite_group_to_meeting(meeting_id uuid,gid uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare e public.events; invited integer;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if e.id is null or e.creator_id<>auth.uid() then raise exception 'Tylko organizator może zaprosić grupę.' using errcode='42501'; end if;
 if private.collection_closed(e) then raise exception 'Zbieranie odpowiedzi zostało zamknięte.'; end if;
 perform 1 from public.participant_groups where id=gid for update;
 if not private.is_group_member(gid) then raise exception 'Najpierw dołącz do grupy.' using errcode='42501'; end if;
 with added as (
  insert into public.group_meeting_invitations(event_id,group_id,user_id)
  select meeting_id,gid,m.user_id from public.group_members m where m.group_id=gid
  and not exists(select 1 from public.participants p where p.event_id=meeting_id and p.user_id=m.user_id)
  on conflict(event_id,user_id) do nothing returning *
 ) insert into public.notifications(user_id,event_id,kind,title,body,dedupe_key)
 select user_id,meeting_id,'meeting_invite',e.title,'Twoja grupa została zaproszona. Przyjmij zaproszenie, aby podać dostępność.','invite:'||id from added;
 get diagnostics invited=row_count;
 return invited;
end $$;
create function private.respond_group_meeting_invitation(meeting_id uuid,accept boolean) returns void
language plpgsql security definer set search_path='' as $$
declare e public.events; invitation_row public.group_meeting_invitations; nickname text;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 select * into invitation_row from public.group_meeting_invitations where event_id=meeting_id and user_id=auth.uid() for update;
 if invitation_row.id is null then raise exception 'Brak zaproszenia do spotkania.' using errcode='42501'; end if;
 if accept is null then raise exception 'Wybierz odpowiedź.'; end if;
 if accept and private.collection_closed(e) then raise exception 'Zbieranie odpowiedzi zostało zamknięte.'; end if;
 if accept then
  select display_name into nickname from public.profiles where user_id=auth.uid();
  if nickname is null then raise exception 'Najpierw ustaw nazwę profilu.'; end if;
  insert into public.participants(event_id,user_id,display_name) values(meeting_id,auth.uid(),nickname) on conflict(event_id,user_id) do nothing;
 end if;
 update public.group_meeting_invitations set status=case when accept then 'accepted' else 'declined' end where id=invitation_row.id;
 update public.notifications set read_at=clock_timestamp() where event_id=meeting_id and user_id=auth.uid() and kind='meeting_invite';
end $$;

create table public.meeting_items (
 id uuid primary key,
 event_id uuid not null references public.events(id) on delete cascade,
 kind text not null check(kind in ('topic','decision','task')),
 body text not null check(char_length(btrim(body,E' \n\r\t')) between 1 and 2000),
 assignee_id uuid,
 due_date date check(due_date is null or isfinite(due_date)),
 completed boolean not null default false,
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default clock_timestamp(),
 foreign key(event_id,assignee_id) references public.participants(event_id,id) on delete cascade,
 check(kind='task' or (assignee_id is null and due_date is null and not completed))
);
create index meeting_items_event_idx on public.meeting_items(event_id,created_at,id);
create index meeting_items_assignee_idx on public.meeting_items(assignee_id);
alter table public.meeting_items enable row level security;
create policy members_read_enabled_items on public.meeting_items for select to authenticated using(private.is_member(event_id) and exists(select 1 from public.events e where e.id=event_id and e.agenda_enabled));
revoke all on public.meeting_items from public,anon,authenticated;
grant select on public.meeting_items to authenticated;
create function private.set_meeting_agenda(meeting_id uuid,enabled boolean,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare e public.events;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if e.id is null or e.creator_id<>auth.uid() then raise exception 'Tylko organizator może zmienić ustawienia agendy.' using errcode='42501'; end if;
 if e.revision is distinct from expected_revision then raise exception 'Spotkanie zmieniło się. Odśwież je.'; end if;
 if enabled is null then raise exception 'Wybierz ustawienie agendy.'; end if;
 update public.events set agenda_enabled=enabled,revision=revision+1,updated_at=now() where id=meeting_id;
end $$;
create function private.save_meeting_item(meeting_id uuid,item_id uuid,action text,input jsonb,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare e public.events; item public.meeting_items; pid uuid;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select * into e from public.events where id=meeting_id for update;
 if not private.is_member(meeting_id) then raise exception 'Brak dostępu do ustaleń.' using errcode='42501'; end if;
 if not e.agenda_enabled then raise exception 'Agenda i ustalenia są wyłączone.'; end if;
 select * into item from public.meeting_items where id=item_id for update;
 if item.id is not null and item.event_id<>meeting_id then raise exception 'Brak dostępu do ustaleń.' using errcode='42501'; end if;
 if coalesce(item.revision,0) is distinct from expected_revision then raise exception 'Ustalenie zmieniło się. Odśwież listę.'; end if;
 select id into pid from public.participants where event_id=meeting_id and user_id=auth.uid();
 if action='complete' then
  if item.id is null or item.kind<>'task' or (e.creator_id<>auth.uid() and item.assignee_id is distinct from pid) then raise exception 'Tylko organizator lub przypisana osoba może oznaczyć zadanie.' using errcode='42501'; end if;
  update public.meeting_items set completed=(input->>'completed')::boolean,revision=revision+1 where id=item_id;
  return;
 end if;
 if e.creator_id<>auth.uid() then raise exception 'Tylko organizator może edytować ustalenia.' using errcode='42501'; end if;
 if action='delete' then delete from public.meeting_items where id=item_id;
 elsif action='save' then
  insert into public.meeting_items(id,event_id,kind,body,assignee_id,due_date)
  values(item_id,meeting_id,input->>'kind',btrim(input->>'body',E' \n\r\t'),nullif(input->>'assignee_id','')::uuid,nullif(input->>'due_date','')::date)
  on conflict(id) do update set kind=excluded.kind,body=excluded.body,assignee_id=excluded.assignee_id,due_date=excluded.due_date,
  completed=case when excluded.kind='task' then meeting_items.completed else false end,revision=meeting_items.revision+1;
 else raise exception 'Nieznana operacja ustalenia.';
 end if;
end $$;

create function public.read_notifications(before_time timestamptz default null,before_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$ select private.read_notifications(before_time,before_id) $$;
create function public.mark_notifications_read(notification_id uuid default null,through_time timestamptz default null) returns void language sql security invoker set search_path='' as $$ select private.mark_notifications_read(notification_id,through_time) $$;
create function public.set_attendance(meeting_id uuid,response text,expected_version integer) returns void language sql security invoker set search_path='' as $$ select private.set_attendance(meeting_id,response,expected_version) $$;
create function public.rotate_meeting_invitation(meeting_id uuid,expected_token text) returns text language sql security invoker set search_path='' as $$ select private.rotate_meeting_invitation(meeting_id,expected_token) $$;
create function public.read_groups() returns jsonb language sql stable security invoker set search_path='' as $$ select private.read_groups() $$;
create function public.manage_group(gid uuid,action text,group_name text default null,member_id uuid default null) returns uuid language sql security invoker set search_path='' as $$ select private.manage_group(gid,action,group_name,member_id) $$;
create function public.preview_group(invitation text) returns jsonb language sql stable security invoker set search_path='' as $$ select private.preview_group(invitation) $$;
create function public.join_group(invitation text) returns uuid language sql security invoker set search_path='' as $$ select private.join_group(invitation) $$;
create function public.invite_group_to_meeting(meeting_id uuid,gid uuid) returns integer language sql security invoker set search_path='' as $$ select private.invite_group_to_meeting(meeting_id,gid) $$;
create function public.respond_group_meeting_invitation(meeting_id uuid,accept boolean) returns void language sql security invoker set search_path='' as $$ select private.respond_group_meeting_invitation(meeting_id,accept) $$;
create function public.set_meeting_agenda(meeting_id uuid,enabled boolean,expected_revision integer) returns void language sql security invoker set search_path='' as $$ select private.set_meeting_agenda(meeting_id,enabled,expected_revision) $$;
create function public.save_meeting_item(meeting_id uuid,item_id uuid,action text,input jsonb,expected_revision integer) returns void language sql security invoker set search_path='' as $$ select private.save_meeting_item(meeting_id,item_id,action,input,expected_revision) $$;


do $$
declare f record; names text[]:=array['is_group_member','reset_attendance_version','notify_meeting_term','notify_meeting_comment','read_notifications','mark_notifications_read','set_attendance','rotate_meeting_invitation','read_groups','manage_group','preview_group','join_group','invite_group_to_meeting','respond_group_meeting_invitation','set_meeting_agenda','save_meeting_item'];
begin
 for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('private','public') and p.proname=any(names) loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  if f.proname not in ('reset_attendance_version','notify_meeting_term','notify_meeting_comment') then execute format('grant execute on function %s to authenticated',f.signature); end if;
 end loop;
end $$;

create table public.availability_templates (
 user_id uuid primary key references auth.users(id) on delete cascade,
 pattern jsonb not null check(jsonb_typeof(pattern)='array' and jsonb_array_length(pattern)<=350),
 updated_at timestamptz not null default clock_timestamp()
);
alter table public.availability_templates enable row level security;
revoke all on public.availability_templates from public,anon,authenticated;
grant select,insert,update,delete on public.availability_templates to authenticated;
create policy own_template_select on public.availability_templates for select to authenticated using(user_id=(select auth.uid()));
create policy own_template_insert on public.availability_templates for insert to authenticated with check(user_id=(select auth.uid()));
create policy own_template_update on public.availability_templates for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_template_delete on public.availability_templates for delete to authenticated using(user_id=(select auth.uid()));


create or replace function private.create_meeting(input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e public.events; token text; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=input->>'timezone') then raise exception 'Niepoprawna strefa czasowa.'; end if;
 if input->>'response_deadline' is not null and (not isfinite((input->>'response_deadline')::timestamptz) or (input->>'response_deadline')::timestamptz<=clock_timestamp()) then raise exception 'Termin odpowiedzi musi być w przyszłości.'; end if;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.events(title,description,creator_id,start_date,end_date,day_start_time,day_end_time,timezone,meeting_duration_minutes,response_deadline,meeting_mode,meeting_location,agenda_enabled)
 values(btrim(input->>'title'),coalesce(input->>'description',''),uid,(input->>'start_date')::date,(input->>'end_date')::date,
 (input->>'day_start_time')::time,(input->>'day_end_time')::time,input->>'timezone',(input->>'meeting_duration_minutes')::int,
 (input->>'response_deadline')::timestamptz,coalesce(input->>'meeting_mode','undecided'),btrim(coalesce(input->>'meeting_location','')),coalesce((input->>'agenda_enabled')::boolean,false)) returning * into e;
 insert into private.invitations(event_id,token_hash,token) values(e.id,encode(sha256(convert_to(token,'UTF8')),'hex'),token);
 insert into public.participants(event_id,user_id,display_name) values(e.id,uid,btrim(input->>'display_name'));
 if nullif(input->>'group_id','') is not null then perform private.invite_group_to_meeting(e.id,(input->>'group_id')::uuid); end if;
 return jsonb_build_object('id',e.id,'token',token);
end $$;


create or replace function private.join_meeting(invitation text,nickname text) returns uuid
language plpgsql security definer set search_path='' as $$
declare eid uuid; pid uuid; e public.events; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 perform private.preview_meeting(invitation);
 select event_id into eid from private.invitations where token_hash=encode(sha256(convert_to(invitation,'UTF8')),'hex');
 select * into e from public.events where id=eid for update;
 perform private.preview_meeting(invitation);
 if private.collection_closed(e) then raise exception 'COLLECTION_CLOSED: Organizator zamknął dołączanie i zbieranie dostępności.'; end if;
 insert into public.participants(event_id,user_id,display_name) values(eid,uid,btrim(nickname))
 on conflict(event_id,user_id) do update set display_name=excluded.display_name,updated_at=now() returning id into pid;
 update public.group_meeting_invitations set status='accepted' where event_id=eid and user_id=uid and status='pending';
 update public.notifications set read_at=clock_timestamp() where event_id=eid and user_id=uid and kind='meeting_invite' and read_at is null;
 return pid;
end $$;

do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.notifications,public.meeting_items;
 end if;
end $$;
