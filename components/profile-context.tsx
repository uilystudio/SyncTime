"use client";
import { createContext, useContext } from "react";
import type { Profile } from "@/lib/profile";
export const ProfileContext = createContext<{
  profile: Profile;
  update: (profile: Profile) => void;
} | null>(null);
export const useProfile = () => useContext(ProfileContext)?.profile ?? null;
export const useProfileContext = () => useContext(ProfileContext);
