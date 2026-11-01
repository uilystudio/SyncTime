"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readActionCenter } from "@/lib/api";
import { errorMessage, getSupabase } from "@/lib/supabase";
import type { ActionCenterPage } from "@/lib/types";

export function useActionCenter(userId: string) {
  const [page, setPage] = useState<ActionCenterPage | null>(null);
  const [error, setError] = useState("");
  const request = useRef({ active: true, sequence: 0 });
  const refresh = useCallback(() => {
    const control = request.current, sequence = ++control.sequence;
    return readActionCenter().then(data => { if (control.active && sequence === control.sequence) { setPage(data); setError(""); } }).catch(e => { if (control.active && sequence === control.sequence) setError(errorMessage(e)); });
  }, []);
  useEffect(() => {
    const control = request.current; control.active = true;
    void refresh();
    let debounce: ReturnType<typeof setTimeout>;
    const visible = () => { if (document.visibilityState === "visible") { clearTimeout(debounce); debounce = setTimeout(() => void refresh(), 250); } };
    const supabase = getSupabase();
    const channel = supabase.channel(`attention:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, visible)
      .on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `user_id=eq.${userId}` }, visible)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events" }, visible)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_items" }, visible).subscribe();
    const timer = setInterval(visible, 30000);
    window.addEventListener("focus", visible); window.addEventListener("synctime:attention", visible); document.addEventListener("visibilitychange", visible);
    return () => { control.active = false; ++control.sequence; clearTimeout(debounce); clearInterval(timer); window.removeEventListener("focus", visible); window.removeEventListener("synctime:attention", visible); document.removeEventListener("visibilitychange", visible); void supabase.removeChannel(channel); };
  }, [refresh, userId]);
  return { page, error, refresh };
}
