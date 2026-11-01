"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getSupabase, errorMessage } from "@/lib/supabase";
import type { MeetingSummary } from "@/lib/meetings";
import { useClock } from "@/hooks/use-clock";
import { usePathname } from "next/navigation";

interface MeetingsContextValue {
  events: MeetingSummary[] | null;
  error: string;
  refreshing: boolean;
  now: Date;
  refresh: () => Promise<void>;
}
const MeetingsContext = createContext<MeetingsContextValue | null>(null);
export function MeetingsProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [events, setEvents] = useState<MeetingSummary[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const now = useClock();
  const sequence = useRef(0);
  const mounted = useRef(false);
  const refresh = useCallback(() => {
    const current = ++sequence.current;

    return Promise.resolve(
      getSupabase()
        .from("events")
        .select(
          "*, participants(id,user_id,display_name,response_status,attendance_status)",
        )
        .order("created_at", { ascending: false }),
    )
      .then(({ data, error }) => {
        if (!mounted.current || current !== sequence.current) return;
        setRefreshing(false);
        if (error) setError(errorMessage(error));
        else {
          setEvents(data as MeetingSummary[]);
          setError("");
        }
      })
      .catch((e) => {
        if (mounted.current && current === sequence.current) {
          setError(errorMessage(e));
          setRefreshing(false);
        }
      });
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const focus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(focus, 30000);
    window.addEventListener("focus", focus);
    window.addEventListener("synctime:attention", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      window.removeEventListener("synctime:attention", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [refresh, path]);
  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
      setRefreshing(false);
    }
  }, [refresh]);
  return (
    <MeetingsContext
      value={{ events, error, refreshing, now, refresh: manualRefresh }}
    >
      {children}
    </MeetingsContext>
  );
}
export function useMeetings() {
  const context = useContext(MeetingsContext);
  if (!context) throw new Error("MeetingsProvider is required");
  return context;
}
