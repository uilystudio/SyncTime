"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readComments } from "@/lib/api";
import { errorMessage, getSupabase } from "@/lib/supabase";
import type { CommentPage } from "@/lib/types";

export function useComments(meetingId: string) {
  const [data, setData] = useState<CommentPage | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(true);
  const pages = useRef(1);
  const sequence = useRef(0);
  const mounted = useRef(true);
  const refresh = useCallback(() => {
    const current = ++sequence.current;
    return readComments(meetingId).then(async first => {
      let last = first;
      let items = [...first.items];
      for (let i = 1; i < pages.current && last.has_more && last.cursor; i++) {
        const page = await readComments(meetingId, last.cursor);
        items = [...page.items, ...items];
        last = page;
      }
      if (mounted.current && current === sequence.current) { setData({ ...first, items, has_more: last.has_more, cursor: last.cursor }); setError(""); }
    }).catch(e => {
      if (mounted.current && current === sequence.current) setError(errorMessage(e));
    }).finally(() => {
      if (mounted.current && current === sequence.current) setRefreshing(false);
    });
  }, [meetingId]);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    void refresh();
    const supabase = getSupabase();
    let timer: ReturnType<typeof setTimeout>;
    const reload = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 250); };
    const channel = supabase.channel(`comments:${meetingId}`).on("postgres_changes", { event: "*", schema: "public", table: "meeting_comments", filter: `event_id=eq.${meetingId}` }, reload);
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (active) channel.subscribe();
    }).catch(() => {                                                                          });
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    const poll = setInterval(visible, 12000);
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; mounted.current = false; clearTimeout(timer); clearInterval(poll); document.removeEventListener("visibilitychange", visible); void supabase.removeChannel(channel); };
  }, [meetingId, refresh]);
  const loadOlder = async () => { if (refreshing || !data?.has_more) return; pages.current++; setRefreshing(true); await refresh(); };
  const manualRefresh = () => { setRefreshing(true); return refresh(); };
  return { data, error, refreshing, refresh: manualRefresh, loadOlder };
}
