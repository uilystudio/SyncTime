create function public.set_meeting_response(meeting_id uuid,response text,expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.set_meeting_response(meeting_id,response,expected_revision) $$;
create function public.set_response_deadline(meeting_id uuid,deadline timestamptz,expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.set_response_deadline(meeting_id,deadline,expected_revision) $$;
create function public.set_participant_required(meeting_id uuid,person_id uuid,required boolean,expected_revision integer) returns void
language sql security invoker set search_path='' as $$ select private.set_participant_required(meeting_id,person_id,required,expected_revision) $$;
revoke all on function private.set_meeting_response(uuid,text,integer),private.set_response_deadline(uuid,timestamptz,integer),private.set_participant_required(uuid,uuid,boolean,integer) from public,anon;
revoke all on function public.set_meeting_response(uuid,text,integer),public.set_response_deadline(uuid,timestamptz,integer),public.set_participant_required(uuid,uuid,boolean,integer) from public,anon;
grant execute on function private.set_meeting_response(uuid,text,integer),private.set_response_deadline(uuid,timestamptz,integer),private.set_participant_required(uuid,uuid,boolean,integer) to authenticated;
grant execute on function public.set_meeting_response(uuid,text,integer),public.set_response_deadline(uuid,timestamptz,integer),public.set_participant_required(uuid,uuid,boolean,integer) to authenticated;

