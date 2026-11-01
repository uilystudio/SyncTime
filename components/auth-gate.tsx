"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase, isConfigured, errorMessage } from "@/lib/supabase";
import { getProfile, type Profile } from "@/lib/profile";
import { ConfigurationNotice } from "./ui";
import { ProfileContext } from "./profile-context";
import { MeetingsProvider } from "./meetings-provider";
import { WorkspaceShell } from "./workspace-shell";
import { NotificationsProvider } from "./notifications";
import { AttentionProvider } from "./action-center";
export { useProfile } from "./profile-context";
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!isConfigured) return;
    let live = true;
    const supabase = getSupabase();
    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!live) return;
        if (!data.session) {
          router.replace(`/login?next=${encodeURIComponent(path)}`);
          return;
        }
        const result = await getProfile(data.session.user.id);
        if (!live) return;
        if (!result)
          router.replace(`/onboarding?next=${encodeURIComponent(path)}`);
        else setProfile(result);
      } catch (e) {
        if (live) setError(errorMessage(e));
      }
    }
    void check();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        router.replace(`/login?next=${encodeURIComponent(path)}`);
      }
    });
    return () => {
      live = false;
      listener.subscription.unsubscribe();
    };
  }, [router, path]);
  if (!isConfigured)
    return (
      <main className="mx-auto my-0 max-w-150 px-5.5 pt-7.5 pb-20 in-[.workspace]:pt-8">
        <ConfigurationNotice />
      </main>
    );
  if (error)
    return (
      <main className="mx-auto my-0 max-w-150 px-5.5 pt-7.5 pb-20 in-[.workspace]:pt-8">
        <div
          className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
          role="alert"
        >
          {error}
          <button
            className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            onClick={() => window.location.reload()}
          >
            Spróbuj ponownie
          </button>
        </div>
      </main>
    );
  if (!profile)
    return (
      <main className="mx-auto my-0 max-w-150 px-5.5 pt-7.5 pb-20 in-[.workspace]:pt-8">
        <div
          className="mt-8.75 rounded-[13px] border border-solid border-border bg-surface p-7.5"
          role="status"
          aria-label="Sprawdzanie sesji"
        >
          <div className="mb-5 h-8.75 w-[75%] animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.short]:h-5 [&.short]:w-[45%] [&.tall]:h-67.5 [&.tall]:w-full" />
          <div className="tall mb-5 h-67.5 w-full animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.short]:h-5 [&.short]:w-[45%]" />
        </div>
      </main>
    );
  return (
    <ProfileContext value={{ profile, update: setProfile }}>
      <MeetingsProvider>
        <NotificationsProvider>
          <AttentionProvider>
            <WorkspaceShell>{children}</WorkspaceShell>
          </AttentionProvider>
        </NotificationsProvider>
      </MeetingsProvider>
    </ProfileContext>
  );
}
