"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarCheck2,
  LockKeyhole,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import {
  calendarDays,
  calendarEntries,
  calendarTime,
  moveCalendar,
  type CalendarEntry,
  type CalendarMode,
} from "@/lib/calendar";
import { collectionClosed } from "@/lib/responses";
import { dayLabel } from "@/lib/time";
import { useMeetings } from "./meetings-provider";
import { Panel } from "./ui";
import { InlineSeparator } from "./inline-separator";
import { useProfile } from "./profile-context";

export function MyCalendar() {
  const { events, error, refreshing, refresh, now } = useMeetings();
  const profile = useProfile();
  const [timezone, setTimezone] = useState(
    profile?.timezone ?? "Europe/Warsaw",
  );
  const today = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const [anchor, setAnchor] = useState(today);
  const [mode, setMode] = useState<CalendarMode>("month");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const days = useMemo(() => calendarDays(anchor, mode), [anchor, mode]);
  const filtered = useMemo(
    () =>
      (events ?? []).filter(
        (e) =>
          filter === "all" ||
          (filter === "confirmed"
            ? Boolean(e.selected_start)
            : !e.selected_start),
      ),
    [events, filter],
  );
  const entries = useMemo(
    () => calendarEntries(filtered, days, timezone),
    [filtered, days, timezone],
  );
  const zones = Array.from(
    new Set([
      timezone,
      "Europe/Warsaw",
      "UTC",
      "Europe/London",
      "America/New_York",
      ...(events ?? []).map((e) => e.timezone),
    ]),
  );
  const title =
    mode === "month"
      ? dayLabel(anchor, "LLLL yyyy")
      : `${dayLabel(days[0], "d MMM")} - ${dayLabel(days[6], "d MMM yyyy")}`;
  return (
    <main className="personal-calendar m-auto max-w-387.5 px-8.5 pt-9 pb-11.25 max-[850px]:px-5.5 max-[850px]:pt-7 max-[850px]:pb-10 max-[580px]:px-4.25 max-[580px]:pt-6.75 max-[580px]:pb-8.75 @max-[1150px]/workspace:px-6.5 @max-[1150px]/workspace:pt-8 @max-[1150px]/workspace:pb-10">
      <Panel className="mb-7.5 flex items-center justify-between gap-6 max-[580px]:mb-6 max-[580px]:block [&_.eyebrow]:text-sm [&_.eyebrow]:tracking-wider [&_h1]:mx-0 [&_h1]:mt-3.25 [&_h1]:mb-2.75 [&_h1]:text-4xl [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:wrap-anywhere max-[850px]:[&_h1]:text-3xl max-[580px]:[&_h1]:mt-3.25 max-[580px]:[&_h1]:text-3xl @max-[950px]/workspace:[&_h1]:text-3xl [&_p]:text-sm [&_p]:text-[#8e9bb0] max-[580px]:[&_p]:text-sm [&>.button]:min-h-10.25 [&>.button]:shrink-0 [&>.button]:px-4 [&>.button]:py-2.5 [&>.button]:text-sm max-[580px]:[&>.button]:mt-5">
        <div>
          <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
            TWÓJ CZAS W JEDNYM MIEJSCU
          </span>
          <h1 className="m-0 font-semibold tracking-tight">Mój kalendarz</h1>
          <p className="m-0 leading-relaxed text-muted">
            Zatwierdzone spotkania i zakresy dni, w których szukacie terminu.
          </p>
        </div>
        <Link
          className="button primary inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] no-underline shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
          href="/new"
        >
          <Plus className="shrink-0" size={17} aria-hidden="true" /> Nowe
          spotkanie
        </Link>
      </Panel>
      <section
        className="rounded-[13px] border border-solid border-border bg-surface p-5.5 max-[720px]:p-3.25"
        aria-label="Kalendarz Twoich spotkań"
      >
        <div className="flex flex-wrap items-center justify-between gap-4.5">
          <div className="flex items-center gap-2.75 max-[720px]:flex-wrap max-[720px]:gap-1.25 [&_h2]:min-w-37.5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:capitalize max-[720px]:[&_h2]:min-w-0 max-[720px]:[&_h2]:text-base">
            <button
              className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              aria-label="Poprzedni okres"
              onClick={() => {
                setAnchor(moveCalendar(anchor, mode, -1));
                setSelected(null);
              }}
            >
              <ChevronLeft className="shrink-0" size={18} aria-hidden="true" />
            </button>
            <h2 className="m-0 font-semibold tracking-tight" aria-live="polite">
              {title}
            </h2>
            <button
              className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              aria-label="Następny okres"
              onClick={() => {
                setAnchor(moveCalendar(anchor, mode, 1));
                setSelected(null);
              }}
            >
              <ChevronRight className="shrink-0" size={18} aria-hidden="true" />
            </button>
            <button
              className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              onClick={() => {
                setAnchor(today);
                setSelected(null);
              }}
            >
              Dzisiaj
            </button>
          </div>
          <div className="calendar-view-controls flex items-center gap-2.75">
            <div
              className="flex rounded-md border border-solid border-[#303847] bg-[#111722] p-0.5 in-[.calendar-view-controls]:gap-1.25 [&_.active]:bg-[#2e2a3e] [&_.active]:text-[#c1a9f3] [&_.icon-button]:h-6.25 [&_.icon-button]:w-6.75"
              role="group"
              aria-label="Widok kalendarza"
            >
              {(
                [
                  ["month", "Miesiąc"],
                  ["week", "Tydzień"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={`button small inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent px-3.25 py-2 text-sm leading-5 font-medium text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.danger]:border-[#c16b76] [&.danger]:bg-[#ab515c] [&.danger]:text-white [&.primary]:bg-[#b19cfc] [&.primary]:text-[#1c1435] [&.primary]:shadow-[0_3px_12px_#a68bea14] [&.primary:hover]:-translate-y-px [&.primary:hover]:bg-[#c3b0ff] [&.secondary]:border-[#303646] [&.secondary]:bg-[#181e2b] [&.secondary]:text-[#d2d7e4] [&.secondary:hover]:border-[#48516a] [&.secondary:hover]:bg-[#242b3b] ${mode === value ? "primary" : "secondary"}`}
                  aria-pressed={mode === value}
                  onClick={() => {
                    setMode(value);
                    setSelected(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              aria-label="Odśwież kalendarz"
              disabled={refreshing}
              onClick={() => void refresh()}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "shrink-0 animate-spin motion-reduce:animate-none"
                    : "shrink-0"
                }
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <div className="mx-0 my-5.5 flex flex-wrap items-end gap-4.25 [&_.field]:m-0 [&_.field]:max-w-60 [&_.field]:flex-[1_1_150px] [&_.field>span]:text-sm [&_select]:w-full [&_select]:text-base">
          <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
            <span>Wyświetlaj</span>
            <select
              className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Wszystkie spotkania</option>
              <option value="confirmed">Zatwierdzone</option>
              <option value="planning">Ustalamy termin / zamknięte</option>
            </select>
          </label>
          <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
            <span>Godziny w strefie</span>
            <select
              className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                setSelected(null);
              }}
            >
              {zones.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </label>
          <div className="ml-auto flex flex-wrap gap-[10px_16px] pb-3 max-[720px]:ml-0 [&_span]:flex [&_span]:items-center [&_span]:gap-1.5 [&_span]:text-sm [&_span]:text-[#a6afc1]">
            <span>
              <CalendarCheck2
                aria-hidden="true"
                className="size-3.5 shrink-0 text-[#77c6a1]"
              />{" "}
              Termin zatwierdzony
            </span>
            <span>
              <CalendarDays
                aria-hidden="true"
                className="size-3.5 shrink-0 text-[#b8a0e4]"
              />{" "}
              Zakres planowania
            </span>
            <span>
              <LockKeyhole
                aria-hidden="true"
                className="size-3.5 shrink-0 text-[#b3adc0]"
              />{" "}
              Zbieranie zamknięte
            </span>
          </div>
        </div>
        {error && (
          <div
            className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
            role="alert"
          >
            {error}
            <button
              className="button small secondary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              onClick={() => void refresh()}
            >
              Spróbuj ponownie
            </button>
          </div>
        )}
        {events === null ? (
          !error && (
            <p
              className="m-0 p-4.25 text-sm leading-relaxed text-[#b3bdd0]"
              role="status"
            >
              Wczytywanie kalendarza…
            </p>
          )
        ) : (
          <>
            {events.length === 0 && (
              <p className="m-0 p-4.25 text-sm leading-relaxed text-[#b3bdd0]">
                Nie masz jeszcze spotkań. Utwórz pierwsze lub dołącz przez link
                zaproszenia.
              </p>
            )}
            <div className="overflow-x-auto rounded-[9px] border border-solid border-[#353c4d] max-[720px]:[-webkit-overflow-scrolling:touch]">
              <div
                className={`personal-calendar-grid grid min-w-210 grid-cols-7 bg-[#121925] max-[720px]:min-w-210 [&.week]:min-w-245 ${mode}`}
              >
                {days.slice(0, 7).map((day) => (
                  <div
                    key={day}
                    className="border-b [border-bottom-style:solid] border-b-[#353c4d] p-3.25 text-sm text-[#a5aec0] uppercase"
                  >
                    {dayLabel(day, "EEE")}
                  </div>
                ))}
                {days.map((day) => {
                  const items = entries.get(day) ?? [];
                  return (
                    <div
                      className={`personal-calendar-day min-h-37 min-w-0 border-r border-b [border-right-style:solid] [border-bottom-style:solid] border-r-[#303749] border-b-[#303749] p-2 nth-[7n]:border-r-0 nth-[7n]:[border-right-style:solid] nth-[7n]:border-r-current [&.outside]:bg-[#0e1420] [&.selected]:shadow-[inset_0_0_0_1px_#ad93d4] [&.today]:bg-[#a389d80b] [.personal-calendar-grid.week_&]:min-h-82.5 ${day.slice(0, 7) !== anchor.slice(0, 7) && mode === "month" ? "outside" : ""} ${day === today ? "today" : ""} ${selected === day ? "selected" : ""}`}
                      key={day}
                    >
                      <button
                        className="flex min-h-7.5 w-full cursor-pointer items-center justify-between rounded-[5px] px-1 py-1.25 text-sm text-[#d7dbe5] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:min-h-9.5 [&_small]:text-sm [&_small]:text-[#b8a5cf] [.personal-calendar-day.outside_&]:text-[#8b91a3] [.today_&_time]:rounded-[5px] [.today_&_time]:bg-[#a88ad2] [.today_&_time]:px-1.5 [.today_&_time]:py-1 [.today_&_time]:font-semibold [.today_&_time]:text-[#12121c]"
                        aria-label={`Pokaż spotkania: ${dayLabel(day, "d MMMM yyyy")}`}
                        aria-pressed={selected === day}
                        onClick={() => setSelected(day)}
                      >
                        <time dateTime={day}>
                          {dayLabel(day, mode === "week" ? "d MMM" : "d")}
                        </time>
                        {items.length > 0 && (
                          <small className="text-sm">{items.length}</small>
                        )}
                      </button>
                      <div className="mt-1.75 grid gap-1.25">
                        {items
                          .slice(0, mode === "month" ? 3 : undefined)
                          .map((entry) => renderEntry(entry, day))}
                        {mode === "month" && items.length > 3 && (
                          <button
                            className="min-h-7 cursor-pointer px-0.75 py-1.5 text-left text-sm text-[#c7b4e3] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                            onClick={() => setSelected(day)}
                          >
                            +{items.length - 3} więcej
                          </button>
                        )}
                        {!items.length && mode === "week" && (
                          <span className="px-0.5 py-2 text-sm text-[#8792a9]">
                            Bez spotkań
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>
      {selected && (
        <section
          className="mt-5.5 rounded-[13px] border border-solid border-border bg-surface p-5.5 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2.5 [&_h2]:text-lg [&_h2]:capitalize [&_p]:mt-4.25 [&_p]:text-sm [&_p]:text-[#a1abc0]"
          aria-label="Spotkania wybranego dnia"
        >
          <h2 className="m-0 font-semibold tracking-tight">
            <CalendarDays className="shrink-0" size={18} aria-hidden="true" />
            {dayLabel(selected, "EEEE, d MMMM yyyy")}
          </h2>
          {entries.get(selected)?.length ? (
            entries
              .get(selected)!
              .map((entry) => renderEntry(entry, selected, true))
          ) : (
            <p className="m-0 leading-relaxed text-muted">
              Brak spotkań w tym dniu przy wybranym filtrze.
            </p>
          )}
        </section>
      )}
      <p className="mx-0 mt-6 mb-0 text-center text-sm leading-relaxed text-[#707e96]">
        Zakres planowania pokazuje proponowane dni i godziny - ostateczny termin
        wybiera organizator. Kliknij spotkanie, aby zobaczyć szczegóły.
      </p>
    </main>
  );

  function renderEntry(entry: CalendarEntry, day: string, expanded = false) {
    const closed = collectionClosed(entry.event, now);
    return (
      <Link
        key={entry.event.id}
        href={`/meeting/${entry.event.id}`}
        className={`grid min-w-0 gap-1.25 rounded-[5px] border-l-2 [border-left-style:solid] border-l-[#ab8dd8] bg-[#a583dd13] p-2 text-[#d2c0ed] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:[outline:1px_solid_currentColor] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none [&_strong]:overflow-hidden [&_strong]:text-sm [&_strong]:font-medium [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_time]:text-sm [&_time]:text-[#afb9ca] [&.closed]:border-[#9e94ad] [&.closed]:bg-[#a39bb116] [&.closed]:text-[#c2b9ce] [&.confirmed]:border-[#76be98] [&.confirmed]:bg-[#62a78215] [&.confirmed]:text-[#b2dfc8] [&.expanded]:mt-3 [&.expanded]:p-3.5 [&.expanded_strong]:text-base [&.expanded_strong]:wrap-anywhere [&.expanded_strong]:whitespace-normal [&.expanded_time]:text-sm [&.expanded>span:last-child]:text-sm ${entry.confirmed ? "confirmed" : closed ? "closed" : "planning"} ${expanded ? "expanded" : ""}`}
        title={`${entry.event.title}, ${calendarTime(entry, day, timezone)}, ${entry.confirmed ? "Zatwierdzone" : closed ? "Zbieranie zamknięte" : "Ustalamy termin"}`}
      >
        <span className="flex items-center gap-1 text-sm">
          {entry.confirmed ? (
            <Check className="shrink-0" size={14} aria-hidden="true" />
          ) : (
            <Clock3 className="shrink-0" size={14} aria-hidden="true" />
          )}
          {entry.confirmed
            ? "Zatwierdzone"
            : closed
              ? "Zamknięte"
              : "Ustalamy termin"}
        </span>
        <strong>{entry.event.title}</strong>
        <time>{calendarTime(entry, day, timezone)}</time>
        {expanded && (
          <span>
            {entry.event.meeting_duration_minutes} min <InlineSeparator />{" "}
            Strefa spotkania: {entry.event.timezone}
          </span>
        )}
      </Link>
    );
  }
}
