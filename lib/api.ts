"use client";
import { ensureSession, getSupabase } from "./supabase";
import type { ActionCenterPage, ActionKind, AttendanceStatus, CommentCursor, CommentPage, EventInput, EventSnapshot, GroupPreview, MeetingEvent, MeetingEditInput, MeetingItem, NotificationPage, ParticipantGroup } from "./types";
const attentionMutations = new Set(["save_availability_v2", "set_meeting_response", "set_attendance", "confirm_meeting", "save_meeting_item", "respond_group_meeting_invitation", "set_meeting_closed", "set_response_deadline", "set_meeting_agenda", "join_meeting", "create_meeting", "invite_group_to_meeting", "update_meeting"]);
async function rpc<T>(name: string, params: Record<string, unknown>): Promise<T> {
  await ensureSession();
  const { data, error } = await getSupabase().rpc(name, params);
  if (error) throw error;
  if (typeof window !== "undefined" && attentionMutations.has(name)) window.dispatchEvent(new Event("synctime:attention"));
  return data as T;
}
export const createEvent = (input: EventInput) => rpc<{ id: string; token: string }>("create_meeting", { input });
export const previewEvent = (token: string) => rpc<{ event: MeetingEvent; participant_count: number }>("preview_meeting", { invitation: token });
export const joinEvent = (token: string, name: string) => rpc<string>("join_meeting", { invitation: token, nickname: name });
export const readEvent = (id: string) => rpc<EventSnapshot>("read_meeting", { meeting_id: id });
export const saveAvailability = (id: string, slots: string[], preferred: string[] = [], revision = 1) => rpc<null>("save_availability_v2", { meeting_id: id, instants: slots, preferred_instants: preferred, expected_revision: revision });
export const confirmMeeting = (id: string, start: string | null) => rpc<null>("confirm_meeting", { meeting_id: id, chosen_start: start });
export const updateMeeting = (id: string, input: MeetingEditInput, revision: number, allowTrim: boolean) => rpc<{ removed_slots: number; confirmation_reset: boolean }>("update_meeting", { meeting_id: id, input, expected_revision: revision, allow_trim: allowTrim });
export const setMeetingClosed = (id: string, closed: boolean, revision: number) => rpc<null>("set_meeting_closed", { meeting_id: id, should_close: closed, expected_revision: revision });
export const setResponse = (id: string, response: "pending" | "unavailable", revision: number) => rpc<null>("set_meeting_response", { meeting_id: id, response, expected_revision: revision });
export const setRequiredParticipant = (id: string, participantId: string, required: boolean, revision: number) => rpc<null>("set_participant_required", { meeting_id: id, person_id: participantId, required, expected_revision: revision });
export const setResponseDeadline = (id: string, deadline: string | null, revision: number) => rpc<null>("set_response_deadline", { meeting_id: id, deadline, expected_revision: revision });
export const readComments = (id: string, cursor: CommentCursor | null = null) => rpc<CommentPage>("read_meeting_comments", { meeting_id: id, before_created_at: cursor?.created_at ?? null, before_id: cursor?.id ?? null });
export const addComment = (id: string, commentId: string, body: string) => rpc<string>("add_meeting_comment", { meeting_id: id, comment_id: commentId, content: body });
export const editComment = (id: string, commentId: string, body: string, revision: number) => rpc<null>("edit_meeting_comment", { meeting_id: id, comment_id: commentId, content: body, expected_revision: revision });
export const deleteComment = (id: string, commentId: string, revision: number) => rpc<null>("delete_meeting_comment", { meeting_id: id, comment_id: commentId, expected_revision: revision });
export const pinComment = (id: string, commentId: string, pinned: boolean, revision: number) => rpc<null>("pin_meeting_comment", { meeting_id: id, comment_id: commentId, pinned, expected_revision: revision });
export const readNotifications = (cursor: NotificationPage["cursor"] = null) => rpc<NotificationPage>("read_notifications", { before_time: cursor?.created_at ?? null, before_id: cursor?.id ?? null });
export const readActionCenter = (category: ActionKind | "all" = "all", cursor: ActionCenterPage["cursor"] = null) => rpc<ActionCenterPage>("read_action_center", { category, after_time: cursor?.sort_at ?? null, after_kind: cursor?.kind ?? null, after_id: cursor?.id ?? null });
export const markNotificationsRead = (id: string | null, through: string | null = null) => rpc<null>("mark_notifications_read", { notification_id: id, through_time: through });
export const setAttendance = (id: string, response: AttendanceStatus, version: number) => rpc<null>("set_attendance", { meeting_id: id, response, expected_version: version });
export const rotateMeetingInvitation = (id: string, token: string) => rpc<string>("rotate_meeting_invitation", { meeting_id: id, expected_token: token });
export const readGroups = () => rpc<ParticipantGroup[]>("read_groups", {});
export const manageGroup = (id: string | null, action: "create" | "rename" | "remove" | "leave" | "rotate", name: string | null = null, memberId: string | null = null) => rpc<string>("manage_group", { gid: id, action, group_name: name, member_id: memberId });
export const previewGroup = (token: string) => rpc<GroupPreview>("preview_group", { invitation: token });
export const joinGroup = (token: string) => rpc<string>("join_group", { invitation: token });
export const inviteGroupToMeeting = (id: string, groupId: string) => rpc<number>("invite_group_to_meeting", { meeting_id: id, gid: groupId });
export const respondGroupMeetingInvitation = (id: string, accept: boolean) => rpc<null>("respond_group_meeting_invitation", { meeting_id: id, accept });
export const setMeetingAgenda = (id: string, enabled: boolean, revision: number) => rpc<null>("set_meeting_agenda", { meeting_id: id, enabled, expected_revision: revision });
export async function readMeetingItems(id: string): Promise<MeetingItem[]> {
  await ensureSession();
  const { data, error } = await getSupabase().from("meeting_items").select("*").eq("event_id", id).order("created_at").order("id");
  if (error) throw error;
  return data as MeetingItem[];
}
export const saveMeetingItem = (meetingId: string, itemId: string, action: "save" | "delete" | "complete", input: Partial<Pick<MeetingItem, "kind" | "body" | "assignee_id" | "due_date" | "completed">>, revision: number) => rpc<null>("save_meeting_item", { meeting_id: meetingId, item_id: itemId, action, input, expected_revision: revision });
