
create table public.meeting_comments (
 id uuid primary key,
 event_id uuid not null references public.events(id) on delete cascade,
 participant_id uuid not null,
 body text not null,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 edited_at timestamptz,
 deleted_at timestamptz,
 is_pinned boolean not null default false,
 revision integer not null default 1 check(revision>0),
 foreign key(event_id,participant_id) references public.participants(event_id,id) on delete cascade,
 check ((deleted_at is null and char_length(btrim(body,E' \n\r\t')) between 1 and 2000)
     or (deleted_at is not null and body='' and not is_pinned))
);
create index comments_event_timeline_idx on public.meeting_comments(event_id,created_at desc,id desc) where deleted_at is null;
create index comments_participant_idx on public.meeting_comments(participant_id);
create unique index comments_one_pin_idx on public.meeting_comments(event_id) where is_pinned and deleted_at is null;
alter table public.meeting_comments enable row level security;
create policy member_reads_comments on public.meeting_comments for select to authenticated using(private.is_member(event_id));
revoke all on public.meeting_comments from public,anon,authenticated;
grant select on public.meeting_comments to authenticated;

create function private.comment_json(c public.meeting_comments) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',c.id,'event_id',c.event_id,'participant_id',c.participant_id,
 'body',c.body,'created_at',c.created_at,'updated_at',c.updated_at,'edited_at',c.edited_at,
 'revision',c.revision,'is_pinned',c.is_pinned,'user_id',p.user_id,'display_name',p.display_name)
 from public.participants p where p.id=c.participant_id and p.event_id=c.event_id
$$;

create function private.read_meeting_comments(meeting_id uuid,before_created_at timestamptz,before_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_member(meeting_id) then raise exception 'Brak dostępu do komentarzy tego spotkania.' using errcode='42501'; end if;
 if (before_created_at is null)<>(before_id is null) then raise exception 'Niepoprawny kursor komentarzy.'; end if;
 with candidates as (
  select c.* from public.meeting_comments c where c.event_id=meeting_id and c.deleted_at is null
   and (before_created_at is null or (c.created_at,c.id)<(before_created_at,before_id))
  order by c.created_at desc,c.id desc limit 51
 ), page as (select * from candidates order by created_at desc,id desc limit 50)
 select jsonb_build_object(
  'items',coalesce((select jsonb_agg(private.comment_json(p::public.meeting_comments) order by p.created_at,p.id) from page p),'[]'::jsonb),
  'has_more',(select count(*)>50 from candidates),
  'cursor',(select jsonb_build_object('created_at',p.created_at,'id',p.id) from page p order by p.created_at,p.id limit 1),
  'pinned',(select private.comment_json(c) from public.meeting_comments c where c.event_id=meeting_id and c.is_pinned and c.deleted_at is null),
  'total',(select count(*) from public.meeting_comments c where c.event_id=meeting_id and c.deleted_at is null)
 ) into result;
 return result;
end $$;

create function private.add_meeting_comment(meeting_id uuid,comment_id uuid,content text) returns uuid
language plpgsql security definer set search_path='' as $$
declare pid uuid; inserted uuid; existing public.meeting_comments; clean text:=btrim(content,E' \n\r\t');
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 perform 1 from public.events where id=meeting_id for update;
 select id into pid from public.participants where event_id=meeting_id and user_id=auth.uid();
 if pid is null then raise exception 'Brak dostępu do komentarzy tego spotkania.' using errcode='42501'; end if;
 if comment_id is null or clean is null or char_length(clean) not between 1 and 2000 then raise exception 'Komentarz musi mieć od 1 do 2000 znaków.'; end if;
 insert into public.meeting_comments(id,event_id,participant_id,body) values(comment_id,meeting_id,pid,clean)
 on conflict(id) do nothing returning id into inserted;
 if inserted is null then
  select * into existing from public.meeting_comments where id=comment_id;
  if existing.event_id is distinct from meeting_id or existing.participant_id is distinct from pid or existing.body is distinct from clean or existing.deleted_at is not null then
   raise exception 'COMMENT_CHANGED: Ten komentarz został już zmieniony. Odśwież komentarze.';
  end if;
 end if;
 return comment_id;
end $$;

create function private.edit_meeting_comment(meeting_id uuid,comment_id uuid,content text,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare c public.meeting_comments; clean text:=btrim(content,E' \n\r\t');
begin
 if not private.is_member(meeting_id) then raise exception 'Brak dostępu do komentarzy tego spotkania.' using errcode='42501'; end if;
 perform 1 from public.events where id=meeting_id for update;
 select * into c from public.meeting_comments where event_id=meeting_id and id=comment_id and deleted_at is null for update;
 if c.id is null then raise exception 'Komentarz nie jest już dostępny.'; end if;
 if not exists(select 1 from public.participants p where p.id=c.participant_id and p.user_id=auth.uid()) then raise exception 'Możesz edytować tylko własne komentarze.' using errcode='42501'; end if;
 if expected_revision is distinct from c.revision then raise exception 'COMMENT_CHANGED: Komentarz zmienił się w innym oknie. Odśwież go przed zapisem.'; end if;
 if clean is null or char_length(clean) not between 1 and 2000 then raise exception 'Komentarz musi mieć od 1 do 2000 znaków.'; end if;
 update public.meeting_comments set body=clean,edited_at=clock_timestamp(),updated_at=clock_timestamp(),revision=revision+1 where id=c.id;
end $$;

create function private.delete_meeting_comment(meeting_id uuid,comment_id uuid,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare c public.meeting_comments; organizer uuid;
begin
 if not private.is_member(meeting_id) then raise exception 'Brak dostępu do komentarzy tego spotkania.' using errcode='42501'; end if;
 select creator_id into organizer from public.events where id=meeting_id for update;
 select * into c from public.meeting_comments where event_id=meeting_id and id=comment_id and deleted_at is null for update;
 if c.id is null then raise exception 'Komentarz nie jest już dostępny.'; end if;
 if organizer<>auth.uid() and not exists(select 1 from public.participants p where p.id=c.participant_id and p.user_id=auth.uid()) then raise exception 'Możesz usuwać tylko własne komentarze.' using errcode='42501'; end if;
 if expected_revision is distinct from c.revision then raise exception 'COMMENT_CHANGED: Komentarz zmienił się. Odśwież go przed usunięciem.'; end if;
 update public.meeting_comments set body='',deleted_at=clock_timestamp(),is_pinned=false,updated_at=clock_timestamp(),revision=revision+1 where id=c.id;
end $$;

create function private.pin_meeting_comment(meeting_id uuid,comment_id uuid,pinned boolean,expected_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare c public.meeting_comments; organizer uuid;
begin
 if auth.uid() is null then raise exception 'Wymagana sesja.' using errcode='42501'; end if;
 select creator_id into organizer from public.events where id=meeting_id for update;
 if organizer is null or organizer<>auth.uid() or not private.is_member(meeting_id) then raise exception 'Tylko organizator może przypinać komentarze.' using errcode='42501'; end if;
 select * into c from public.meeting_comments where event_id=meeting_id and id=comment_id and deleted_at is null for update;
 if c.id is null then raise exception 'Komentarz nie jest już dostępny.'; end if;
 if expected_revision is distinct from c.revision then raise exception 'COMMENT_CHANGED: Komentarz zmienił się. Odśwież go przed przypięciem.'; end if;
 if pinned is null then raise exception 'Wybierz poprawny stan przypięcia.'; end if;
 if c.is_pinned=pinned then return; end if;
 if pinned then
  update public.meeting_comments set is_pinned=false,updated_at=clock_timestamp(),revision=revision+1
  where event_id=meeting_id and is_pinned and deleted_at is null;
 end if;
 update public.meeting_comments set is_pinned=pinned,updated_at=clock_timestamp(),revision=revision+1 where id=c.id;
end $$;

create function public.read_meeting_comments(meeting_id uuid,before_created_at timestamptz default null,before_id uuid default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.read_meeting_comments(meeting_id,before_created_at,before_id) $$;
create function public.add_meeting_comment(meeting_id uuid,comment_id uuid,content text) returns uuid
language sql security invoker set search_path='' as $$ select private.add_meeting_comment(meeting_id,comment_id,content) $$;
create function public.edit_meeting_comment(meeting_id uuid,comment_id uuid,content text,expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.edit_meeting_comment(meeting_id,comment_id,content,expected_revision) $$;
create function public.delete_meeting_comment(meeting_id uuid,comment_id uuid,expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.delete_meeting_comment(meeting_id,comment_id,expected_revision) $$;
create function public.pin_meeting_comment(meeting_id uuid,comment_id uuid,pinned boolean,expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.pin_meeting_comment(meeting_id,comment_id,pinned,expected_revision) $$;

revoke all on function private.comment_json(public.meeting_comments) from public,anon,authenticated;
revoke all on function private.read_meeting_comments(uuid,timestamptz,uuid),private.add_meeting_comment(uuid,uuid,text),private.edit_meeting_comment(uuid,uuid,text,integer),private.delete_meeting_comment(uuid,uuid,integer),private.pin_meeting_comment(uuid,uuid,boolean,integer) from public,anon;
revoke all on function public.read_meeting_comments(uuid,timestamptz,uuid),public.add_meeting_comment(uuid,uuid,text),public.edit_meeting_comment(uuid,uuid,text,integer),public.delete_meeting_comment(uuid,uuid,integer),public.pin_meeting_comment(uuid,uuid,boolean,integer) from public,anon;
grant execute on function private.read_meeting_comments(uuid,timestamptz,uuid),private.add_meeting_comment(uuid,uuid,text),private.edit_meeting_comment(uuid,uuid,text,integer),private.delete_meeting_comment(uuid,uuid,integer),private.pin_meeting_comment(uuid,uuid,boolean,integer) to authenticated;
grant execute on function public.read_meeting_comments(uuid,timestamptz,uuid),public.add_meeting_comment(uuid,uuid,text),public.edit_meeting_comment(uuid,uuid,text,integer),public.delete_meeting_comment(uuid,uuid,integer),public.pin_meeting_comment(uuid,uuid,boolean,integer) to authenticated;

do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.meeting_comments;
 end if;
end $$;
