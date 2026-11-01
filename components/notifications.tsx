"use client";
import Link from "next/link";
import { createContext, useContext, useState } from "react";
import {
  Bell,
  CalendarCheck2,
  CheckCheck,
  Clock3,
  MessageSquare,
  Users,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import {
  markNotificationsRead,
  readNotifications,
  respondGroupMeetingInvitation,
} from "@/lib/api";
import type { AppNotification, NotificationPage } from "@/lib/types";
import { errorMessage } from "@/lib/supabase";
import { useProfile } from "./profile-context";
import { InlineSeparator } from "./inline-separator";
import { useMeetings } from "./meetings-provider";
import { ActionButton, ActionError, SectionCard } from "./collaboration-ui";

const NotificationContext = createContext<ReturnType<
  typeof useNotifications
> | null>(null);
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = useProfile();
  const value = useNotifications(profile!.user_id);
  return <NotificationContext value={value}>{children}</NotificationContext>;
}
export function NotificationBell() {
  const context = useContext(NotificationContext);
  const unread = context?.page?.unread ?? 0;
  return (
    <Link
      href="/notifications"
      aria-label={`Powiadomienia${unread ? `, nieprzeczytane: ${unread}` : ""}`}
      className="relative inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[#c2cadb] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Bell aria-hidden="true" className="size-5 shrink-0" />
      {unread > 0 && (
        <span className="rounded-full bg-[#b19cfc] px-2 py-0.5 text-sm text-[#1c1435]">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
const kindLabels = {
  term_selected: "Wybrano termin",
  term_changed: "Zmieniono termin",
  term_cleared: "Cofnięto termin",
  comment: "Nowy komentarz",
  deadline: "Czas na odpowiedź",
  meeting_invite: "Zaproszenie grupowe",
};
const kindIcons = {
  term_selected: CalendarCheck2,
  term_changed: CalendarCheck2,
  term_cleared: CalendarCheck2,
  comment: MessageSquare,
  deadline: Clock3,
  meeting_invite: Users,
};
export function NotificationsScreen() {
  const context = useContext(NotificationContext)!;
  const { refresh: refreshMeetings } = useMeetings();
  const [older, setOlder] = useState<AppNotification[]>([]);
  const [olderPage, setOlderPage] = useState<NotificationPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const page = context.page;
  const allItems = [
    ...new Map(
      [...older, ...(page?.items ?? [])].map((item) => [item.id, item]),
    ).values(),
  ].sort(
    (a, b) =>
      Date.parse(b.created_at) - Date.parse(a.created_at) ||
      b.id.localeCompare(a.id),
  );
  const notify = () =>
    window.dispatchEvent(new Event("synctime:notifications"));
  async function mark(id: string | null) {
    setBusy(true);
    setError("");
    try {
      await markNotificationsRead(
        id,
        id ? null : (page?.items[0]?.created_at ?? null),
      );
      setOlder((items) =>
        items.map((item) =>
          !id || item.id === id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );
      await context.refresh();
      notify();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function respond(item: AppNotification, accept: boolean) {
    setBusy(true);
    setError("");
    try {
      await respondGroupMeetingInvitation(item.event_id, accept);
      setOlder((items) => items.filter((row) => row.id !== item.id));
      await Promise.all([context.refresh(), refreshMeetings()]);
      notify();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function more() {
    setBusy(true);
    setError("");
    try {
      const result = await readNotifications((olderPage ?? page)?.cursor);
      setOlder((items) => [...items, ...result.items]);
      setOlderPage(result);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-7">
      <h1 className="text-3xl font-semibold tracking-tight">Powiadomienia</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Terminy, komentarze i zaproszenia Twoich grup w jednym miejscu.
      </p>
      <SectionCard
        title={
          page ? `Nieprzeczytane: ${page.unread}` : "Wczytywanie powiadomień"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton
              disabled={busy}
              onClick={() => {
                setOlder([]);
                setOlderPage(null);
                void context.refresh();
              }}
            >
              Odśwież
            </ActionButton>
            <ActionButton
              disabled={busy || !page?.unread}
              onClick={() => void mark(null)}
            >
              <CheckCheck aria-hidden="true" className="size-4" />
              Oznacz wszystkie
            </ActionButton>
          </div>
        }
      >
        <ActionError>{error || context.error}</ActionError>
        {page && !allItems.length && (
          <p className="py-8 text-base leading-relaxed text-muted">
            Jesteś na bieżąco. Tutaj pojawią się nowe ustalenia i zaproszenia.
          </p>
        )}
        <ul className="space-y-3">
          {allItems.map((item) => {
            const Icon = kindIcons[item.kind];
            return (
              <li
                key={item.id}
                className={`rounded-lg border p-4 ${item.read_at ? "border-[#293140] bg-[#111722]" : "border-[#776398] bg-[#211d30]"}`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-[#c4a7ef]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
                      <span>
                        {kindLabels[item.kind]}
                        {!item.read_at && (
                          <>
                            <InlineSeparator />
                            Nowe
                          </>
                        )}
                      </span>
                      <time dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleString("pl-PL")}
                      </time>
                    </div>
                    <h3 className="mt-2 text-base font-semibold tracking-tight wrap-anywhere">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {item.body}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.kind === "meeting_invite" &&
                      item.invitation_status === "pending" ? (
                        <>
                          <ActionButton
                            primary
                            disabled={busy}
                            onClick={() => void respond(item, true)}
                          >
                            Przyjmij zaproszenie
                          </ActionButton>
                          <ActionButton
                            disabled={busy}
                            onClick={() => void respond(item, false)}
                          >
                            Odrzuć
                          </ActionButton>
                        </>
                      ) : (
                        <Link
                          href={`/meeting/${item.event_id}${item.kind === "comment" ? "#meeting-comments" : ""}`}
                          onClick={() => {
                            if (!item.read_at) void mark(item.id);
                          }}
                          className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-[#cfbdff] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          Otwórz spotkanie
                        </Link>
                      )}
                      {!item.read_at && (
                        <ActionButton
                          disabled={busy}
                          onClick={() => void mark(item.id)}
                        >
                          Oznacz jako przeczytane
                        </ActionButton>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {(olderPage ?? page)?.has_more && (
          <ActionButton
            className="mt-4"
            disabled={busy}
            onClick={() => void more()}
          >
            Pokaż starsze
          </ActionButton>
        )}
      </SectionCard>
    </main>
  );
}
