"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readEvent, saveAvailability } from "@/lib/api";
import { errorMessage, getSupabase } from "@/lib/supabase";
import { collectionClosed } from "@/lib/responses";
import type { EventSnapshot } from "@/lib/types";
interface Draft { slots: Set<string>; preferred: Set<string>; revision: number }
export function useEvent(id: string, userId: string) {
  const [snapshot, setSnapshot] = useState<EventSnapshot | null>(null);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "polling">("connecting");
  const pending = useRef<Draft | null>(null);
  const saving = useRef(false);
  const draftRef = useRef<Draft | null>(null);
  const mounted = useRef(true);
  const loadSequence = useRef(0);
  const refresh = useCallback(() => {
    const sequence = ++loadSequence.current;
    return readEvent(id).then(data => { if (mounted.current && sequence === loadSequence.current) { setSnapshot(data); setError(""); } }).catch(e => { if (mounted.current && sequence === loadSequence.current) setError(errorMessage(e)); });
  }, [id]);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    void refresh();
    let timer: ReturnType<typeof setTimeout>;
    const reload = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 250); };
    const supabase = getSupabase();
    const channel = supabase.channel(`meeting:${id}`).on("postgres_changes", { event: "*", schema: "public", table: "availability_slots", filter: `event_id=eq.${id}` }, reload).on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `event_id=eq.${id}` }, reload).on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${id}` }, reload);
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (active) channel.subscribe(state => { if (active) setRealtimeStatus(state === "SUBSCRIBED" ? "live" : "polling"); });
    }).catch(() => { if (active) setRealtimeStatus("polling"); });
    const poll = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 12000);
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; mounted.current = false; clearTimeout(timer); clearInterval(poll); document.removeEventListener("visibilitychange", visible); void supabase.removeChannel(channel); };
  }, [id, refresh]);
  const participant = snapshot?.participants.find(p => p.user_id === userId);
  const own = useMemo(() => draft?.slots ?? new Set(snapshot?.slots.filter(s => s.participant_id === participant?.id).map(s => new Date(s.slot_start).toISOString()) ?? []), [draft, snapshot, participant?.id]);
  const preferred = useMemo(() => draft?.preferred ?? new Set(snapshot?.slots.filter(s => s.participant_id === participant?.id && s.is_preferred).map(s => new Date(s.slot_start).toISOString()) ?? []), [draft, snapshot, participant?.id]);
  const persist = useCallback(async function flush(selection: Draft) {
    pending.current = selection;
    if (saving.current) return;
    saving.current = true; setSaveError(""); setConflict(false); setStatus("saving");
    try {
      while (pending.current) {
        const batch = pending.current; pending.current = null;
        await saveAvailability(id, [...batch.slots], [...batch.preferred], batch.revision);
      }
      const data = await readEvent(id);
      if (mounted.current) {
        ++loadSequence.current; setSnapshot(data);
        if (!pending.current) { draftRef.current = null; setDraft(null); setStatus("saved"); }
      }
    } catch (e) {
      const message = errorMessage(e);
      const changed = /EVENT_CHANGED|COLLECTION_CLOSED/.test(message);
      if (changed) pending.current = null;
      if (mounted.current) { setStatus("error"); setSaveError(message.replace(/^(?:EVENT_CHANGED|COLLECTION_CLOSED):\s*/, "")); setConflict(changed); }
    } finally {
      saving.current = false;
      if (pending.current && mounted.current) { const next = pending.current; pending.current = null; void flush(next); }
    }
  }, [id]);
  const change = useCallback((slots: Set<string>, chosenPreferred?: Set<string>) => {
    if (!snapshot || collectionClosed(snapshot.event)) return;
    const chosen = chosenPreferred ?? preferred;
    const selection: Draft = { slots, preferred: new Set([...chosen].filter(instant => slots.has(instant))), revision: draftRef.current?.revision ?? snapshot.event.revision ?? 1 };
    draftRef.current = selection; setDraft(selection); void persist(selection);
  }, [persist, snapshot, preferred]);
  const retry = useCallback(() => { if (draftRef.current) void persist(draftRef.current); else void refresh(); }, [persist, refresh]);
  const discardDraft = useCallback(() => { if (saving.current) return; draftRef.current = null; pending.current = null; setDraft(null); setSaveError(""); setConflict(false); setStatus("saved"); void refresh(); }, [refresh]);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => { if (draftRef.current) e.preventDefault(); };
    window.addEventListener("beforeunload", prevent); return () => window.removeEventListener("beforeunload", prevent);
  }, []);
  const effective = useMemo(() => snapshot && participant && draft ? { ...snapshot, participants: snapshot.participants.map(p => p.id === participant.id ? { ...p, response_status: draft.slots.size ? "available" as const : "pending" as const } : p), slots: [...snapshot.slots.filter(s => s.participant_id !== participant.id), ...[...draft.slots].map(slot_start => ({ participant_id: participant.id, slot_start, is_preferred: draft.preferred.has(slot_start) }))] } : snapshot, [snapshot, participant, draft]);
  return { snapshot: effective, participant, own, preferred, change, status, error: saveError || error, retry, refresh, realtimeStatus, conflict, discardDraft };
}
