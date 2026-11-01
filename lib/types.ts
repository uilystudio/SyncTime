export type MeetingMode = "undecided" | "online" | "in_person";
export interface MeetingPlaceInput {
  meeting_mode?: MeetingMode;
  meeting_location?: string;
}
export interface MeetingEvent extends MeetingPlaceInput {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  start_date: string;
  end_date: string;
  day_start_time: string;
  day_end_time: string;
  timezone: string;
  meeting_duration_minutes: number;
  selected_start: string | null;
  created_at: string;
  closed_at?: string | null;
  revision?: number;
  response_deadline?: string | null;
  agenda_enabled?: boolean;
  confirmation_version?: number;
}

export interface Participant {
  id: string;
  event_id: string;
  user_id: string;
  display_name: string;
  response_status?: "pending" | "available" | "unavailable";
  responded_at?: string | null;
  is_required?: boolean;
  attendance_status?: AttendanceStatus;
  attendance_updated_at?: string | null;
}

export interface AvailabilitySlot {
  participant_id: string;
  slot_start: string;
  is_preferred?: boolean;
}

export interface EventSnapshot {
  invitation: string;
  event: MeetingEvent;
  participants: Participant[];
  slots: AvailabilitySlot[];
}

export interface EventInput extends MeetingPlaceInput {
  agenda_enabled?: boolean;
  group_id?: string;
  response_deadline?: string | null;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  day_start_time: string;
  day_end_time: string;
  timezone: string;
  meeting_duration_minutes: number;
  display_name: string;
}

export interface TimeSlot { start: string; day: string; label: string; offset: string }
export interface TimeSuggestion { start: string; end: string; participantIds: string[]; count: number; percentage: number; preferredCount: number }
export type MeetingEditInput = Omit<EventInput, "display_name" | "response_deadline" | "agenda_enabled" | "group_id">;

export type AttendanceStatus = "pending" | "yes" | "no";
export type ActionKind = "availability" | "invitation" | "attendance" | "task";
export interface AccountAction {
  id: string;
  kind: ActionKind;
  event_id: string;
  title: string;
  body: string;
  due_at: string | null;
  due_date: string | null;
  timezone: string;
  revision: number;
  confirmation_version: number;
  meeting_duration_minutes: number;
}
export interface ActionCenterPage {
  items: AccountAction[];
  counts: Record<ActionKind, number>;
  total: number;
  has_more: boolean;
  cursor: { sort_at: string; kind: ActionKind; id: string } | null;
}
export interface ParticipantGroup {
  id: string;
  name: string;
  owner_id: string;
  token: string | null;
  members: { user_id: string; display_name: string; joined_at: string }[];
}
export interface GroupPreview { id: string; name: string; member_count: number; joined: boolean }
export interface AppNotification {
  id: string;
  event_id: string;
  kind: "term_selected" | "term_changed" | "term_cleared" | "comment" | "deadline" | "meeting_invite";
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  invitation_status?: "pending" | "accepted" | "declined" | null;
}
export interface NotificationPage {
  items: AppNotification[];
  unread: number;
  has_more: boolean;
  cursor: { created_at: string; id: string } | null;
}
export interface MeetingItem {
  id: string;
  event_id: string;
  kind: "topic" | "decision" | "task";
  body: string;
  assignee_id: string | null;
  due_date: string | null;
  completed: boolean;
  revision: number;
  created_at: string;
}

export interface MeetingComment {
  id: string;
  event_id: string;
  participant_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  revision: number;
  is_pinned: boolean;
}
export interface CommentCursor { created_at: string; id: string }
export interface CommentPage {
  items: MeetingComment[];
  pinned: MeetingComment | null;
  total: number;
  has_more: boolean;
  cursor: CommentCursor | null;
}
