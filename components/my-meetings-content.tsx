"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Crown,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  filterMeetings,
  meetingStatus,
  meetingViews,
  type MeetingSort,
  type MeetingStatus,
  type MeetingView,
} from "@/lib/meetings";
import { useProfile } from "./profile-context";
import { useMeetings } from "./meetings-provider";
import { MeetingCard } from "./meeting-card";
import { MeetingInsights } from "./meeting-insights";
import { Panel } from "./ui";
import { JoinByLink } from "./join-by-link";
import { AttentionPanel } from "./action-center";

export function MyMeetings({ view = "all" }: { view?: MeetingView }) {
  const profile = useProfile();
  const { events, error, now, refreshing, refresh } = useMeetings();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MeetingStatus>("all");
  const [sort, setSort] = useState<MeetingSort>("soonest");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const filtered = useMemo(
    () =>
      filterMeetings(events ?? [], {
        view,
        userId: profile?.user_id ?? "",
        query,
        status,
        sort,
        now,
      }),
    [events, view, profile?.user_id, query, status, sort, now],
  );
  const stats = [
    {
      title: "Aktywne spotkania",
      count: events?.filter((e) => meetingStatus(e, now) !== "past").length,
      icon: CalendarDays,
      color: "purple",
      caption: "Plany, które są przed Tobą",
      href: "/meetings",
    },
    {
      title: "Ustalamy termin",
      count: events?.filter((e) => meetingStatus(e, now) === "planning").length,
      icon: Clock3,
      color: "amber",
      caption: "Czas na Waszą dostępność",
      href: "/meetings",
    },
    {
      title: "Zatwierdzone",
      count: events?.filter((e) => meetingStatus(e, now) === "confirmed")
        .length,
      icon: CalendarCheck2,
      color: "mint",
      caption: "Wszystko gotowe do spotkania",
      href: "/meetings/confirmed",
    },
    {
      title: "Organizujesz",
      count: events?.filter((e) => e.creator_id === profile?.user_id).length,
      icon: Crown,
      color: "blue",
      caption: "Twoje pomysły, Wasz czas",
      href: "/meetings/organized",
    },
  ];
  const searching = Boolean(query || status !== "all");
  function reset() {
    setQuery("");
    setStatus("all");
  }
  return (
    <main className="m-auto max-w-387.5 px-8.5 pt-9 pb-11.25 max-[850px]:px-5.5 max-[850px]:pt-7 max-[850px]:pb-10 max-[580px]:px-4.25 max-[580px]:pt-6.75 max-[580px]:pb-8.75 @max-[1150px]/workspace:px-6.5 @max-[1150px]/workspace:pt-8 @max-[1150px]/workspace:pb-10">
      <Panel className="mb-7.5 flex items-center justify-between gap-6 max-[580px]:mb-6 max-[580px]:block [&_.eyebrow]:text-sm [&_.eyebrow]:tracking-wider [&_h1]:mx-0 [&_h1]:mt-3.25 [&_h1]:mb-2.75 [&_h1]:text-4xl [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:wrap-anywhere max-[850px]:[&_h1]:text-3xl max-[580px]:[&_h1]:mt-3.25 max-[580px]:[&_h1]:text-3xl @max-[950px]/workspace:[&_h1]:text-3xl [&_p]:text-sm [&_p]:text-[#8e9bb0] max-[580px]:[&_p]:text-sm [&>.button]:min-h-10.25 [&>.button]:shrink-0 [&>.button]:px-4 [&>.button]:py-2.5 [&>.button]:text-sm max-[580px]:[&>.button]:mt-5">
        <div>
          <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
            TWÓJ PANEL PLANOWANIA
          </span>
          <h1 className="m-0 font-semibold tracking-tight">
            {view === "all"
              ? `Cześć, ${profile?.display_name}.`
              : meetingViews[view].title}
          </h1>
          <p className="m-0 leading-relaxed text-muted">
            {view === "all"
              ? "Zróbmy miejsce na dobre spotkania. Sprawdź, co przed Tobą."
              : meetingViews[view].description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.25 max-[720px]:mt-5 max-[720px]:flex-wrap [&>.button]:min-h-10 [&>.button]:px-3.25 [&>.button]:py-2.5 [&>.button]:text-sm max-[720px]:[&>.button]:text-sm">
          <JoinByLink />
          <Link
            className="button primary inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] no-underline shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            href="/new"
          >
            <Plus className="shrink-0" size={17} aria-hidden="true" /> Nowe
            spotkanie
          </Link>
        </div>
      </Panel>
      {view === "all" && <AttentionPanel />}
      <section
        className="mb-9 grid grid-cols-4 gap-3.5 max-[580px]:mb-7 max-[580px]:grid-cols-2 max-[580px]:gap-2.5 @max-[1150px]/workspace:gap-2.5"
        aria-label="Statystyki spotkań"
      >
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`meeting-stat rounded-[10px] border border-solid border-[#2a313e] bg-[#141a25] px-4.75 py-4.5 transition-[border-color,background] duration-150 ease-[ease] hover:border-[#62547f] hover:bg-[#191f2c] motion-reduce:transition-none max-[580px]:px-3.5 max-[580px]:py-4 @max-[1150px]/workspace:px-3.25 @max-[1150px]/workspace:py-3.75 [&>div]:flex [&>div]:items-center [&>div]:gap-2.25 @max-[1150px]/workspace:[&>div]:gap-1.75 [&>div>span:last-child]:text-sm [&>div>span:last-child]:text-[#a6b0c3] max-[580px]:[&>div>span:last-child]:text-sm @max-[1150px]/workspace:[&>div>span:last-child]:text-sm [&>small]:text-sm [&>small]:text-[#8290a5] max-[580px]:[&>small]:text-sm @max-[1150px]/workspace:[&>small]:text-sm [&>strong]:mx-0 [&>strong]:mt-3 [&>strong]:mb-1.25 [&>strong]:block [&>strong]:text-3xl [&>strong]:font-medium [&>strong]:tracking-tight max-[580px]:[&>strong]:mt-2.5 max-[580px]:[&>strong]:text-3xl ${stat.color}`}
          >
            <div>
              <span className="grid size-7.5 place-items-center rounded-lg bg-[#a08add13] text-[#b49bdd] max-[580px]:size-6.5 max-[580px]:[&>svg]:size-4 [.meeting-stat.amber_&]:bg-[#cfb48412] [.meeting-stat.amber_&]:text-[#cfb484] [.meeting-stat.blue_&]:bg-[#8daedb12] [.meeting-stat.blue_&]:text-[#8daedb] [.meeting-stat.mint_&]:bg-[#82bea112] [.meeting-stat.mint_&]:text-[#82bea1]">
                <stat.icon className="shrink-0" size={18} />
              </span>
              <span>{stat.title}</span>
            </div>
            <strong>{stat.count ?? "-"}</strong>
            <small className="text-sm">{stat.caption}</small>
          </div>
        ))}
      </section>
      <div className="grid grid-cols-[minmax(0,1fr)_250px] items-start gap-6.5 max-[580px]:gap-6.25 @max-[1150px]/workspace:grid-cols-[minmax(0,1fr)_225px] @max-[1150px]/workspace:gap-5 @max-[950px]/workspace:grid-cols-[minmax(0,1fr)]">
        <section className="min-w-0" aria-labelledby="collection-heading">
          <div className="mb-4.25 flex min-h-8.25 flex-wrap items-center justify-between gap-3.75 [&_h2]:text-lg [&_h2]:tracking-tight max-[580px]:[&_h2]:text-lg [&>div:first-child]:flex [&>div:first-child]:min-w-0 [&>div:first-child]:items-center [&>div:first-child]:gap-2.5 [&>div>span]:rounded-[5px] [&>div>span]:border [&>div>span]:border-solid [&>div>span]:border-[#323d50] [&>div>span]:bg-[#232b3a] [&>div>span]:px-1.5 [&>div>span]:py-0.5 [&>div>span]:text-sm [&>div>span]:text-[#acb7cc]">
            <div>
              <h2
                className="m-0 font-semibold tracking-tight"
                id="collection-heading"
              >
                {view === "all" ? "Twoje spotkania" : meetingViews[view].title}
              </h2>
              {events && <span>{filtered.length}</span>}
            </div>
            <div className="flex items-center gap-2.25">
              <Link
                className="button small secondary inline-flex min-h-9.25 items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
                href="/calendar"
              >
                <CalendarDays
                  className="shrink-0"
                  size={15}
                  aria-hidden="true"
                />{" "}
                Mój kalendarz
              </Link>
              <button
                className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                onClick={() => void refresh()}
                aria-label="Odśwież spotkania"
                disabled={refreshing}
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "shrink-0 animate-spin motion-reduce:animate-none"
                      : "shrink-0"
                  }
                  aria-hidden="true"
                />
              </button>
              <div
                className="flex rounded-md border border-solid border-[#303847] bg-[#111722] p-0.5 in-[.calendar-view-controls]:gap-1.25 [&_.active]:bg-[#2e2a3e] [&_.active]:text-[#c1a9f3] [&_.icon-button]:h-6.25 [&_.icon-button]:w-6.75"
                role="group"
                aria-label="Układ spotkań"
              >
                <button
                  className={`icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none ${layout === "grid" ? "active" : ""}`}
                  aria-label="Widok kart"
                  aria-pressed={layout === "grid"}
                  onClick={() => setLayout("grid")}
                >
                  <LayoutGrid
                    className="shrink-0"
                    size={15}
                    aria-hidden="true"
                  />
                </button>
                <button
                  className={`icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none ${layout === "list" ? "active" : ""}`}
                  aria-label="Widok listy"
                  aria-pressed={layout === "list"}
                  onClick={() => setLayout("list")}
                >
                  <List className="shrink-0" size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div className="mb-3.75 flex items-stretch gap-2.25 max-[580px]:flex-col">
            <div className="relative min-w-0 flex-1 [&>.icon-button]:absolute [&>.icon-button]:top-1.5 [&>.icon-button]:right-1.25 [&>input]:min-h-12 [&>input]:border-[#2d3545] [&>input]:bg-[#131924] [&>input]:pr-8.5 [&>input]:pl-9.25 [&>input]:text-base max-[580px]:[&>input]:text-base [&>svg]:pointer-events-none [&>svg]:absolute [&>svg]:top-3.25 [&>svg]:left-3 [&>svg]:text-[#7f8ca3]">
              <Search className="shrink-0" size={16} aria-hidden="true" />
              <label className="sr-only" htmlFor="meeting-search">
                Szukaj spotkań
              </label>
              <input
                className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                id="meeting-search"
                placeholder="Szukaj po nazwie lub uczestniku…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  aria-label="Wyczyść wyszukiwanie"
                  onClick={() => setQuery("")}
                >
                  <X className="shrink-0" size={14} aria-hidden="true" />
                </button>
              )}
            </div>
            <label className="flex items-center gap-1.5 rounded-[7px] border border-solid border-[#2d3545] bg-[#131924] pl-2.75 text-[#9ba8bd] max-[580px]:self-end [&_select]:min-h-10 [&_select]:w-48 [&_select]:border-0 [&_select]:border-solid [&_select]:border-current [&_select]:bg-transparent [&_select]:pl-0.5 [&_select]:text-base [&_select]:text-[#b1bbcd] max-[580px]:[&_select]:min-h-8 max-[580px]:[&_select]:text-base">
              <span className="sr-only">Sortowanie spotkań</span>
              <SlidersHorizontal
                className="shrink-0"
                size={14}
                aria-hidden="true"
              />
              <select
                className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                value={sort}
                onChange={(e) => setSort(e.target.value as MeetingSort)}
              >
                <option value="soonest">Najbliższe najpierw</option>
                <option value="newest">Ostatnio utworzone</option>
                <option value="name">Nazwa A-Z</option>
              </select>
            </label>
          </div>
          {view !== "confirmed" && view !== "past" && (
            <div
              className="mx-0 mt-0 mb-5.5 flex flex-wrap gap-1.5 max-[580px]:flex-wrap max-[580px]:gap-0.5 [&>button]:min-h-7.75 [&>button]:rounded-md [&>button]:border [&>button]:border-solid [&>button]:border-transparent [&>button]:bg-transparent [&>button]:px-2.75 [&>button]:py-1.75 [&>button]:text-sm [&>button]:text-[#8f9cb2] max-[580px]:[&>button]:px-2.25 max-[580px]:[&>button]:py-1.75 max-[580px]:[&>button]:text-sm [&>button.active]:border-[#a189d435] [&>button.active]:bg-[#a189d412] [&>button.active]:text-[#c8b4f4] [&>button:hover]:bg-[#202637]"
              role="group"
              aria-label="Status spotkania"
            >
              {[
                { value: "all", label: "Wszystkie" },
                { value: "planning", label: "Ustalamy termin" },
                { value: "confirmed", label: "Zatwierdzone" },
                { value: "closed", label: "Zbieranie zamknięte" },
                { value: "past", label: "Zakończone" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  aria-pressed={status === filter.value}
                  className={
                    status === filter.value
                      ? "active cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                      : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  }
                  onClick={() => setStatus(filter.value as typeof status)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
          {error && (
            <div
              className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
              role="alert"
            >
              Nie udało się odświeżyć spotkań: {error}
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
              <div
                className="meeting-tiles grid grid-cols-2 gap-3.75 max-[580px]:grid-cols-[minmax(0,1fr)] max-[580px]:gap-3.25 @max-[1150px]/workspace:gap-3 [&.as-list]:grid-cols-[minmax(0,1fr)]"
                role="status"
                aria-label="Wczytywanie spotkań"
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    className="meeting-tile-skeleton min-h-62 rounded-[11px] border border-solid border-[#283140] bg-[#141a25] p-5.5"
                    key={i}
                  >
                    <div className="short mb-5 h-5 w-[45%] animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.tall]:h-67.5 [&.tall]:w-full" />
                    <div className="mb-5 h-8.75 w-[75%] animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.short]:h-5 [&.short]:w-[45%] [&.tall]:h-67.5 [&.tall]:w-full" />
                    <div className="short mb-5 h-5 w-[45%] animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.tall]:h-67.5 [&.tall]:w-full" />
                  </div>
                ))}
              </div>
            )
          ) : filtered.length ? (
            <div
              className={`meeting-tiles grid grid-cols-2 gap-3.75 max-[580px]:grid-cols-[minmax(0,1fr)] max-[580px]:gap-3.25 @max-[1150px]/workspace:gap-3 [&.as-list]:grid-cols-[minmax(0,1fr)] ${layout === "list" ? "as-list" : ""}`}
            >
              {filtered.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  userId={profile?.user_id ?? ""}
                  now={now}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#333c4f] bg-[#131a26] px-7 py-12 text-center max-[580px]:px-4.75 max-[580px]:py-10 [&_.button]:text-sm [&_h3]:text-xl [&_h3]:leading-normal [&_h3]:tracking-tight [&_p]:mx-auto [&_p]:mt-3 [&_p]:mb-6 [&_p]:max-w-80 [&_p]:text-sm [&_p]:text-[#8d9bb1] [&>span]:mb-5.5 [&>span]:inline-grid [&>span]:size-16.25 [&>span]:place-items-center [&>span]:rounded-[18px] [&>span]:border [&>span]:border-solid [&>span]:border-[#ac95d72a] [&>span]:bg-[#ac95d70a] [&>span]:text-[#ac95d7]">
              <span>
                <CalendarDays
                  className="shrink-0"
                  size={30}
                  aria-hidden="true"
                />
              </span>
              <h3 className="m-0 font-semibold tracking-tight">
                {searching
                  ? "Żadne spotkanie nie pasuje."
                  : view === "past"
                    ? "Historia dopiero się zaczyna."
                    : view === "confirmed"
                      ? "Jeszcze szukacie wspólnego czasu."
                      : view === "joined"
                        ? "Czekasz na wspólny plan?"
                        : "Dobry moment na pierwszy plan."}
              </h3>
              <p className="m-0 leading-relaxed text-muted">
                {searching
                  ? "Zmień wyszukiwanie lub wybierz inny status."
                  : view === "joined"
                    ? "Otwórz link zaproszenia od organizatora, żeby dołączyć do spotkania."
                    : view === "past"
                      ? "Zakończone spotkania trafią tutaj automatycznie."
                      : view === "confirmed"
                        ? "Zatwierdź termin w kalendarzu swojego spotkania, a pojawi się tutaj."
                        : "Utwórz spotkanie, udostępnij link i znajdźcie wspólny czas."}
              </p>
              {searching ? (
                <button
                  className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
                  onClick={reset}
                >
                  Wyczyść filtry
                </button>
              ) : view === "joined" ? (
                <JoinByLink />
              ) : (
                view !== "past" && (
                  <Link
                    className="button primary inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] no-underline shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
                    href="/new"
                  >
                    Utwórz spotkanie{" "}
                    <ArrowRight
                      className="shrink-0"
                      size={15}
                      aria-hidden="true"
                    />
                  </Link>
                )
              )}
            </div>
          )}
          {events !== null && (
            <p className="mx-0 mt-6 mb-0 text-center text-sm leading-relaxed text-[#707e96]">
              Widzisz wyłącznie spotkania przypisane do Twojego konta.
            </p>
          )}
        </section>
        <MeetingInsights events={events ?? []} now={now} />
      </div>
    </main>
  );
}
