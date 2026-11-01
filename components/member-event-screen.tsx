"use client";
import { useProfile } from "./auth-gate";
import { EventDashboard } from "./event-dashboard";
export function MemberEventScreen({
  id,
  welcome,
}: {
  id: string;
  welcome?: "created" | "joined";
}) {
  const profile = useProfile();
  return profile ? (
    <EventDashboard id={id} userId={profile.user_id} welcome={welcome} />
  ) : null;
}
