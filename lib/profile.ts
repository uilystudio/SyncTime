"use client";
import { getSupabase } from "./supabase";
export interface Profile {
  user_id: string;
  display_name: string;
  full_name?: string;
  organization?: string;
  timezone?: string;
}
export interface ProfileDetails {
  full_name: string;
  organization: string;
  timezone: string;
}
export const profileTimezones = [
  "Europe/Warsaw",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function saveProfile(
  userId: string,
  name: string,
  details?: ProfileDetails,
) {
  const normalized = details
    ? {
        full_name: details.full_name.trim(),
        organization: details.organization.trim(),
        timezone: details.timezone,
      }
    : {};
  const { error } = await getSupabase()
    .from("profiles")
    .upsert({ user_id: userId, display_name: name.trim(), ...normalized });
  if (error) throw error;
}
export function safeNext(value: string | null) {
  return value &&
    (/^\/(?:e|g)\/[a-f0-9]{64}$/i.test(value) ||
      /^\/meeting\/[a-f0-9-]{36}$/i.test(value) ||
      /^\/meetings\/(organized|joined|confirmed|past)$/.test(value) ||
      [
        "/new",
        "/meetings",
        "/calendar",
        "/settings",
        "/groups",
        "/notifications",
        "/attention",
      ].includes(value))
    ? value
    : "/meetings";
}
