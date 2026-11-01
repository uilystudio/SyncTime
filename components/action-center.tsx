"use client";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  CircleCheck,
  ClipboardList,
  Clock3,
  Inbox,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import {
  readActionCenter,
  respondGroupMeetingInvitation,
  saveMeetingItem,
  setAttendance,
} from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import { dayLabel, localTime } from "@/lib/time";
import { useActionCenter } from "@/hooks/use-action-center";
import type { AccountAction, ActionCenterPage, ActionKind } from "@/lib/types";
import { useProfile } from "./profile-context";
import { ActionButton, ActionError, SectionCard } from "./collaboration-ui";
import { MeetingConflicts } from "./meeting-conflicts";

const AttentionContext = createContext<ReturnType<
  typeof useActionCenter
> | null>(null);
export const useAttention = () => useContext(AttentionContext);
export function AttentionProvider({ children }: { children: React.ReactNode }) {
  const profile = useProfile()!;
  const context = useActionCenter(profile.user_id);
  return <AttentionContext value={context}>{children}</AttentionContext>;
}
const categories = {
  availability: { title: "Podaj dostępność", icon: CalendarDays },
  invitation: { title: "Zaproszenia", icon: Users },
  attendance: { title: "Potwierdź obecność", icon: CalendarCheck2 },
  task: { title: "Twoje zadania", icon: ClipboardList },
};
export function AttentionNavigation({
  onClick,
  active = false,
}: {
  onClick: () => void;
  active?: boolean;
}) {
  const context = useAttention();
  return (
    <Link
      href="/attention"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="my-1 flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#c7b4f1] hover:bg-[#1b2030] focus-visible:outline-2 focus-visible:outline-primary aria-[current=page]:bg-[#a388ec15]"
    >
      <Inbox aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex-1">Czeka na Ciebie</span>
      {context?.page && (
        <span className="rounded bg-[#a58fe9]/15 px-2 py-0.5 text-sm">
          {context.page.total}
        </span>
      )}
    </Link>
  );
}
function actionHref(item: AccountAction) {
  return `/meeting/${item.event_id}${item.kind === "availability" ? "#availability-heading" : item.kind === "attendance" ? "#attendance" : item.kind === "task" ? "#meeting-agenda" : ""}`;
}
function ActionItems({
  items,
  refresh,
  compact = false,
}: {
  items: AccountAction[];
  refresh: () => Promise<void>;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function perform(
    item: AccountAction,
    action: "accept" | "decline" | "yes" | "no" | "complete",
  ) {
    setBusy(`${item.kind}:${item.id}`);
    setError("");
    setMessage("");
    try {
      if (action === "accept" || action === "decline")
        await respondGroupMeetingInvitation(item.event_id, action === "accept");
      else if (action === "complete")
        await saveMeetingItem(
          item.event_id,
          item.id,
          "complete",
          { completed: true },
          item.revision,
        );
      else
        await setAttendance(item.event_id, action, item.confirmation_version);
      await refresh();
      window.dispatchEvent(new Event("synctime:notifications"));
      setMessage(
        action === "accept"
          ? "Przyjęto zaproszenie. Możesz teraz podać dostępność w spotkaniu."
          : action === "decline"
            ? "Odrzucono zaproszenie."
            : action === "complete"
              ? "Zadanie oznaczone jako wykonane."
              : "Zapisano deklarację obecności.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <ActionError>{error}</ActionError>
      {error && (
        <ActionButton disabled={!!busy} onClick={() => void refresh()}>
          Odśwież sprawy do załatwienia
        </ActionButton>
      )}
      {message && (
        <p
          role="status"
          className="mb-3 text-sm leading-relaxed text-[#8ed9bc]"
        >
          {message}
        </p>
      )}
      <ul className={compact ? "grid gap-3 xl:grid-cols-2" : "space-y-3"}>
        {items.map((item) => {
          const Icon = categories[item.kind].icon;
          return (
            <li
              key={`${item.kind}:${item.id}`}
              className="min-w-0 rounded-xl border border-[#343044] bg-[#111823] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#a58fe9]/12 text-[#c6aff4]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#b4a2cd]">
                    {categories[item.kind].title}
                  </p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight wrap-anywhere">
                    {item.title}
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap text-muted ${compact ? "line-clamp-2" : ""}`}
                  >
                    {item.body}
                  </p>
                  {item.due_at && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm leading-relaxed text-[#c9b184]">
                      <Clock3
                        aria-hidden="true"
                        className="mt-1 size-3.5 shrink-0"
                      />
                      {item.kind === "task" && item.due_date
                        ? `Do ${dayLabel(item.due_date, "d MMM yyyy")}`
                        : `${item.kind === "attendance" ? "Spotkanie" : "Odpowiedź do"}: ${localTime(item.due_at, item.timezone, "d MMM yyyy, HH:mm")}`}{" "}
                      ({item.timezone})
                    </p>
                  )}
                  {item.kind === "attendance" && item.due_at && (
                    <MeetingConflicts
                      compact={compact}
                      start={item.due_at}
                      end={new Date(
                        Date.parse(item.due_at) +
                          item.meeting_duration_minutes * 60000,
                      ).toISOString()}
                      eventId={item.event_id}
                    />
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.kind === "invitation" ? (
                      <>
                        <ActionButton
                          primary
                          disabled={!!busy}
                          onClick={() => void perform(item, "accept")}
                        >
                          Przyjmij zaproszenie
                        </ActionButton>
                        <ActionButton
                          disabled={!!busy}
                          onClick={() => void perform(item, "decline")}
                        >
                          Odrzuć
                        </ActionButton>
                      </>
                    ) : (
                      <>
                        {item.kind === "attendance" && (
                          <>
                            <ActionButton
                              primary
                              disabled={!!busy}
                              onClick={() => void perform(item, "yes")}
                            >
                              <Check aria-hidden="true" className="size-4" />
                              Będę
                            </ActionButton>
                            <ActionButton
                              disabled={!!busy}
                              onClick={() => void perform(item, "no")}
                            >
                              <X aria-hidden="true" className="size-4" />
                              Nie będę
                            </ActionButton>
                          </>
                        )}
                        {item.kind === "task" && (
                          <ActionButton
                            disabled={!!busy}
                            onClick={() => void perform(item, "complete")}
                          >
                            <Check aria-hidden="true" className="size-4" />
                            Oznacz jako wykonane
                          </ActionButton>
                        )}
                        <Link
                          href={actionHref(item)}
                          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[#cfbdff] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          {item.kind === "availability"
                            ? "Uzupełnij godziny"
                            : "Otwórz spotkanie"}
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
export function AttentionPanel() {
  const context = useAttention();
  if (!context) return null;
  return (
    <SectionCard
      title="Czeka na Ciebie"
      description="Najbliższe sprawy, które potrzebują Twojej odpowiedzi."
      actions={
        <Link
          href="/attention"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#cfbdff] underline underline-offset-4"
        >
          Wszystkie sprawy{context.page ? ` (${context.page.total})` : ""}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      }
    >
      <ActionError>{context.error}</ActionError>
      {context.error && (
        <ActionButton onClick={() => void context.refresh()}>
          Spróbuj ponownie
        </ActionButton>
      )}
      {!context.page && !context.error && (
        <p role="status" className="text-sm text-muted">
          Wczytywanie spraw do załatwienia...
        </p>
      )}
      {context.page && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(categories).map(([kind, category]) => (
              <span
                key={kind}
                className="rounded-lg border border-[#343044] px-3 py-1.5 text-sm text-muted"
              >
                {category.title}: {context.page!.counts[kind as ActionKind]}
              </span>
            ))}
          </div>
          {!context.page.total && !context.error ? (
            <p className="flex items-center gap-2 py-3 text-base leading-relaxed text-[#a1c5b2]">
              <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
              Wszystko załatwione. Jesteś na bieżąco.
            </p>
          ) : (
            <ActionItems
              compact
              items={context.page.items.slice(0, 4)}
              refresh={context.refresh}
            />
          )}
        </>
      )}
    </SectionCard>
  );
}
function AttentionResults({ category }: { category: ActionKind | "all" }) {
  const context = useAttention()!;
  const [result, setResult] = useState<ActionCenterPage | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const request = useRef({ sequence: 0, active: true });
  const loadFirst = useCallback(() => {
    const control = request.current,
      sequence = ++control.sequence;
    return readActionCenter(category)
      .then((data) => {
        if (control.active && control.sequence === sequence) {
          setResult(data);
          setError("");
          setLoadingMore(false);
        }
      })
      .catch((e) => {
        if (control.active && control.sequence === sequence) {
          setError(errorMessage(e));
          setLoadingMore(false);
        }
      });
  }, [category]);
  useEffect(() => {
    const control = request.current;
    control.active = true;
    void loadFirst();
    return () => {
      control.active = false;
      ++control.sequence;
    };
  }, [loadFirst, context.page]);
  async function refresh() {
    await context.refresh();
    await loadFirst();
  }
  async function more() {
    if (!result?.has_more || loadingMore) return;
    const control = request.current,
      sequence = ++control.sequence;
    setLoadingMore(true);
    setError("");
    try {
      const data = await readActionCenter(category, result.cursor);
      if (control.active && sequence === control.sequence)
        setResult({
          ...data,
          items: [
            ...new Map(
              [...result.items, ...data.items].map((item) => [
                `${item.kind}:${item.id}`,
                item,
              ]),
            ).values(),
          ],
        });
    } catch (e) {
      if (control.active && sequence === control.sequence)
        setError(errorMessage(e));
    } finally {
      if (control.active && sequence === control.sequence)
        setLoadingMore(false);
    }
  }
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {result ? `Sprawy do załatwienia: ${result.total}` : "Wczytywanie..."}
        </p>
        <ActionButton disabled={loadingMore} onClick={() => void refresh()}>
          <RefreshCw aria-hidden="true" className="size-4" />
          Odśwież listę
        </ActionButton>
      </div>
      <ActionError>{error}</ActionError>
      {result && (
        <>
          {result.items.length ? (
            <ActionItems items={result.items} refresh={refresh} />
          ) : (
            <p className="rounded-xl border border-[#343044] p-6 text-base leading-relaxed text-muted">
              W tej kategorii wszystko załatwione.
            </p>
          )}
          {result.has_more && (
            <ActionButton
              className="mt-4"
              disabled={loadingMore}
              onClick={() => void more()}
            >
              {loadingMore ? "Wczytywanie..." : "Pokaż kolejne sprawy"}
            </ActionButton>
          )}
        </>
      )}
    </>
  );
}
export function AttentionScreen() {
  const context = useAttention();
  const [category, setCategory] = useState<ActionKind | "all">("all");
  if (!context) return null;
  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-7">
      <h1 className="text-3xl font-semibold tracking-tight">Czeka na Ciebie</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Dostępność, zaproszenia, obecność i zadania. Zacznij od spraw z
        najbliższym terminem.
      </p>
      <div
        role="group"
        aria-label="Kategorie spraw"
        className="my-6 flex flex-wrap gap-2"
      >
        <ActionButton
          primary={category === "all"}
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          Wszystkie{context.page ? ` (${context.page.total})` : ""}
        </ActionButton>
        {Object.entries(categories).map(([kind, item]) => (
          <ActionButton
            key={kind}
            primary={category === kind}
            aria-pressed={category === kind}
            onClick={() => setCategory(kind as ActionKind)}
          >
            {item.title}
            {context.page
              ? ` (${context.page.counts[kind as ActionKind]})`
              : ""}
          </ActionButton>
        ))}
      </div>
      {context.error && <ActionError>{context.error}</ActionError>}
      <AttentionResults key={category} category={category} />
    </main>
  );
}
