"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readNotifications } from "@/lib/api";
import { errorMessage, getSupabase } from "@/lib/supabase";
import type { NotificationPage } from "@/lib/types";

export function useNotifications(userId: string) {
  const [page, setPage] = useState<NotificationPage | null>(null);
  const [error, setError] = useState("");
  const request = useRef({ sequence: 0, active: true });
  const refresh = useCallback(() => {
    const control = request.current;
    const current = ++control.sequence;
    return readNotifications().then(data => {
      if (control.active && current === control.sequence) { setPage(data); setError(""); }
    }).catch(e => { if (control.active && current === control.sequence) setError(errorMessage(e)); });
  }, []);
  useEffect(() => {
    const control = request.current;
    control.active = true;
    void refresh();
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    const supabase = getSupabase();
    const channel = supabase.channel(`notifications:${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, visible).subscribe();
    const timer = setInterval(visible, 30000);
    window.addEventListener("focus", visible);
    window.addEventListener("synctime:notifications", visible);
    document.addEventListener("visibilitychange", visible);
    return () => { control.active = false; ++control.sequence; clearInterval(timer); window.removeEventListener("focus", visible); window.removeEventListener("synctime:notifications", visible); document.removeEventListener("visibilitychange", visible); void supabase.removeChannel(channel); };
  }, [refresh, userId]);
  return { page, error, refresh };
}
