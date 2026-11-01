"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { readMeetingItems, saveMeetingItem, setMeetingAgenda } from "@/lib/api";
import { errorMessage, getSupabase } from "@/lib/supabase";
import { dayLabel } from "@/lib/time";
import type { EventSnapshot, MeetingItem } from "@/lib/types";
import {
  ActionButton,
  ActionError,
  SectionCard,
  SelectField,
  TextArea,
  TextField,
} from "./collaboration-ui";
import { Dialog } from "./ui";
import { InlineSeparator } from "./inline-separator";

const kindNames = { topic: "Agenda", decision: "Decyzje", task: "Zadania" };
type ItemDraft = Pick<
  MeetingItem,
  "id" | "kind" | "body" | "assignee_id" | "due_date" | "revision"
>;
export function MeetingAgenda({
  snapshot,
  userId,
  disabled,
  onChanged,
}: {
  snapshot: EventSnapshot;
  userId: string;
  disabled: boolean;
  onChanged: (message: string) => Promise<void>;
}) {
  const { event, participants } = snapshot;
  const organizer = event.creator_id === userId;
  const [items, setItems] = useState<MeetingItem[] | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [remove, setRemove] = useState<MeetingItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setItems(await readMeetingItems(event.id));
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [event.id]);
  useEffect(() => {
    if (!event.agenda_enabled) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "visible")
        void readMeetingItems(event.id)
          .then((data) => {
            if (active) setItems(data);
          })
          .catch((e) => {
            if (active) setError(errorMessage(e));
          });
    };
    refresh();
    const supabase = getSupabase();
    const channel = supabase
      .channel(`agenda:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_items",
          filter: `event_id=eq.${event.id}`,
        },
        refresh,
      )
      .subscribe();
    const timer = setInterval(refresh, 12000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      void supabase.removeChannel(channel);
    };
  }, [event.id, event.agenda_enabled]);
  if (!event.agenda_enabled && !organizer) return null;
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await setMeetingAgenda(
        event.id,
        !event.agenda_enabled,
        event.revision ?? 1,
      );
      await onChanged(
        event.agenda_enabled
          ? "Wyłączono agendę. Zapisane ustalenia zostały zachowane."
          : "Włączono agendę i ustalenia.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await saveMeetingItem(
        event.id,
        draft.id,
        "save",
        {
          kind: draft.kind,
          body: draft.body,
          assignee_id: draft.kind === "task" ? draft.assignee_id : null,
          due_date: draft.kind === "task" ? draft.due_date : null,
        },
        draft.revision,
      );
      setDraft(null);
      await load();
      setNotice("Zapisano ustalenie.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function mutate(item: MeetingItem, action: "delete" | "complete") {
    setBusy(true);
    setError("");
    try {
      await saveMeetingItem(
        event.id,
        item.id,
        action,
        action === "complete" ? { completed: !item.completed } : {},
        item.revision,
      );
      setRemove(null);
      await load();
      setNotice(
        action === "delete"
          ? "Usunięto ustalenie."
          : "Zapisano status zadania.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function edit(item?: MeetingItem) {
    setError("");
    setDraft(
      item
        ? { ...item }
        : {
            id: crypto.randomUUID(),
            kind: "topic",
            body: "",
            assignee_id: null,
            due_date: null,
            revision: 0,
          },
    );
  }
  return (
    <SectionCard
      title="Agenda i ustalenia"
      description={
        event.agenda_enabled
          ? "Tematy przed spotkaniem, decyzje i zadania po nim. Treść widzą uczestnicy."
          : "Opcjonalna sekcja. Włącz ją, jeśli chcesz zapisać tematy, decyzje lub zadania."
      }
      actions={
        organizer && (
          <ActionButton
            disabled={busy || disabled}
            aria-pressed={!!event.agenda_enabled}
            onClick={() => void toggle()}
          >
            <ClipboardList aria-hidden="true" className="size-4" />
            {event.agenda_enabled ? "Wyłącz sekcję" : "Włącz sekcję"}
          </ActionButton>
        )
      }
    >
      {!draft && !remove && <ActionError>{error}</ActionError>}
      {notice && (
        <p role="status" className="mb-3 text-sm text-[#8ed9bc]">
          {notice}
        </p>
      )}
      {event.agenda_enabled && (
        <>
          <div className="flex flex-wrap gap-2">
            {organizer && (
              <ActionButton primary disabled={busy} onClick={() => edit()}>
                <Plus aria-hidden="true" className="size-4" />
                Dodaj temat lub ustalenie
              </ActionButton>
            )}
            <ActionButton disabled={busy} onClick={() => void load()}>
              Odśwież
            </ActionButton>
          </div>
          {items === null && !error && (
            <p role="status" className="mt-4 text-sm text-muted">
              Wczytywanie ustaleń...
            </p>
          )}
          {(["topic", "decision", "task"] as const).map((kind) => (
            <div className="mt-6" key={kind}>
              <h3 className="mb-3 text-base font-semibold tracking-tight">
                {kindNames[kind]}
              </h3>
              {items && !items.some((item) => item.kind === kind) && (
                <p className="text-sm text-muted">
                  {kind === "topic"
                    ? "Brak tematów do omówienia."
                    : kind === "decision"
                      ? "Brak zapisanych decyzji."
                      : "Brak przypisanych zadań."}
                </p>
              )}
              <ul className="space-y-3">
                {items
                  ?.filter((item) => item.kind === kind)
                  .map((item) => {
                    const assignee = participants.find(
                      (p) => p.id === item.assignee_id,
                    );
                    const canComplete =
                      organizer || assignee?.user_id === userId;
                    return (
                      <li
                        key={item.id}
                        className="rounded-lg border border-[#293140] bg-[#0e141f] p-4"
                      >
                        <p
                          className={`text-base leading-relaxed wrap-anywhere whitespace-pre-wrap ${item.completed ? "text-muted line-through" : "text-[#e5e9f4]"}`}
                        >
                          {item.body}
                        </p>
                        {kind === "task" && (
                          <p className="mt-2 text-sm leading-relaxed text-muted">
                            {assignee?.display_name ?? "Nieprzypisane"}
                            {item.due_date && (
                              <>
                                <InlineSeparator />
                                Do {dayLabel(item.due_date, "d MMM yyyy")}
                              </>
                            )}{" "}
                            <InlineSeparator />{" "}
                            {item.completed ? "Wykonane" : "Do zrobienia"}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {kind === "task" && canComplete && (
                            <ActionButton
                              disabled={busy}
                              onClick={() => void mutate(item, "complete")}
                            >
                              <Check aria-hidden="true" className="size-4" />
                              {item.completed
                                ? "Oznacz jako niewykonane"
                                : "Oznacz jako wykonane"}
                            </ActionButton>
                          )}
                          {organizer && (
                            <>
                              <ActionButton
                                disabled={busy}
                                onClick={() => edit(item)}
                              >
                                <Pencil aria-hidden="true" className="size-4" />
                                Edytuj
                              </ActionButton>
                              <ActionButton
                                disabled={busy}
                                onClick={() => {
                                  setError("");
                                  setRemove(item);
                                }}
                              >
                                <Trash2 aria-hidden="true" className="size-4" />
                                Usuń
                              </ActionButton>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </>
      )}
      {draft && (
        <Dialog
          title={
            draft.revision ? "Edytuj ustalenie" : "Dodaj temat lub ustalenie"
          }
          onClose={() => {
            if (!busy) {
              setDraft(null);
              setError("");
            }
          }}
        >
          <form className="space-y-4" onSubmit={(e) => void save(e)}>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Rodzaj
              <SelectField
                value={draft.kind}
                disabled={busy}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kind: e.target.value as MeetingItem["kind"],
                  })
                }
              >
                <option value="topic">Temat agendy</option>
                <option value="decision">Decyzja</option>
                <option value="task">Zadanie</option>
              </SelectField>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Treść
              <TextArea
                rows={4}
                value={draft.body}
                disabled={busy}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                required
                maxLength={2000}
              />
            </label>
            {draft.kind === "task" && (
              <>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Przypisana osoba
                  <SelectField
                    value={draft.assignee_id ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        assignee_id: e.target.value || null,
                      })
                    }
                  >
                    <option value="">Bez przypisania</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name}
                      </option>
                    ))}
                  </SelectField>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Termin zadania (opcjonalnie)
                  <TextField
                    type="date"
                    value={draft.due_date ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      setDraft({ ...draft, due_date: e.target.value || null })
                    }
                  />
                </label>
              </>
            )}
            <ActionError>{error}</ActionError>
            {error && (
              <ActionButton disabled={busy} onClick={() => void load()}>
                Odśwież listę ustaleń
              </ActionButton>
            )}
            <p className="text-sm leading-relaxed text-muted">
              W razie konfliktu zamknij edycję i otwórz aktualną wersję z listy.
              Twój tekst pozostaje w formularzu.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <ActionButton
                disabled={busy}
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
              >
                Anuluj
              </ActionButton>
              <ActionButton
                type="submit"
                primary
                disabled={busy || !draft.body.trim()}
              >
                {busy ? "Zapisywanie..." : "Zapisz"}
              </ActionButton>
            </div>
          </form>
        </Dialog>
      )}
      {remove && (
        <Dialog
          title="Usunąć ustalenie?"
          onClose={() => {
            if (!busy) {
              setRemove(null);
              setError("");
            }
          }}
        >
          <p className="text-base leading-relaxed text-muted">
            Usuniesz zapisany temat, decyzję lub zadanie. Tej operacji nie można
            cofnąć.
          </p>
          <ActionError>{error}</ActionError>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ActionButton disabled={busy} onClick={() => setRemove(null)}>
              Anuluj
            </ActionButton>
            <ActionButton
              primary
              disabled={busy}
              onClick={() => void mutate(remove, "delete")}
            >
              Usuń ustalenie
            </ActionButton>
          </div>
        </Dialog>
      )}
    </SectionCard>
  );
}
