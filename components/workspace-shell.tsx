"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  Square,
  ChevronRight,
  CircleHelp,
  Clock3,
  FolderClosed,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { meetingStatus, meetingViews, type MeetingView } from "@/lib/meetings";
import { getSupabase, errorMessage } from "@/lib/supabase";
import { useProfile } from "./profile-context";
import { useMeetings } from "./meetings-provider";
import { Brand } from "./brand";
import { Dialog } from "./ui";
import { JoinByLink } from "./join-by-link";
import { NotificationBell } from "./notifications";
import { AttentionNavigation } from "./action-center";

const navigation = [
  { view: "all", label: "Wszystkie spotkania", icon: LayoutGrid },
  { view: "organized", label: "Organizowane przeze mnie", icon: CalendarDays },
  { view: "joined", label: "Dołączone spotkania", icon: Users },
  { view: "confirmed", label: "Zatwierdzone terminy", icon: CalendarCheck2 },
  { view: "past", label: "Zakończone", icon: FolderClosed },
] as const;
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const profile = useProfile();
  const { events, now } = useMeetings();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const pageTitle =
    path === "/attention"
      ? "Czeka na Ciebie"
      : path === "/notifications"
        ? "Powiadomienia"
        : path === "/groups" || path.startsWith("/g/")
          ? "Twoje grupy"
          : path === "/calendar"
            ? "Mój kalendarz"
            : path === "/new"
              ? "Nowe spotkanie"
              : path === "/settings"
                ? "Ustawienia konta"
                : path.startsWith("/meeting/") || path.startsWith("/e/")
                  ? "Kalendarz spotkania"
                  : meetingViews[(path.split("/")[2] || "all") as MeetingView]
                      ?.title || "Twoje spotkania";
  const counts = {
    all: events?.length,
    organized: events?.filter((e) => e.creator_id === profile?.user_id).length,
    joined: events?.filter((e) => e.creator_id !== profile?.user_id).length,
    confirmed: events?.filter((e) => meetingStatus(e, now) === "confirmed")
      .length,
    past: events?.filter((e) => meetingStatus(e, now) === "past").length,
  };
  async function signOut() {
    setLeaving(true);
    setError("");
    try {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw error;
      router.replace("/");
    } catch (e) {
      setError(errorMessage(e));
      setLeaving(false);
    }
  }
  const close = () => setOpen(false);
  return (
    <div className="workspace grid min-h-dvh grid-cols-[280px_minmax(0,1fr)] bg-[#0e131d] max-[1100px]:grid-cols-[260px_minmax(0,1fr)] max-[850px]:block">
      <div className="sticky top-0 h-dvh scrollbar-thin [scrollbar-color:#30384a_transparent] overflow-y-auto border-r [border-right-style:solid] border-r-[#242b38] bg-[#10151e] max-[850px]:hidden">
        {sidebar()}
      </div>
      {open && (
        <Dialog title="Twoja przestrzeń" onClose={close}>
          <div className="mobile-sidebar">{sidebar()}</div>
        </Dialog>
      )}
      <div className="min-w-0">
        <header className="workspace-topbar sticky top-0 z-20 flex min-h-19 items-center justify-between gap-4.5 border-b [border-bottom-style:solid] border-b-[#252c39] bg-[#10151ff2] px-8.5 py-0 max-[1100px]:px-6.25 max-[1100px]:py-0 max-[850px]:min-h-16.25 max-[850px]:gap-2.5 max-[850px]:px-5 max-[850px]:py-0 max-[580px]:px-3.25 max-[580px]:py-0">
          <button
            className="icon-button hidden size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[850px]:inline-flex max-[850px]:shrink-0"
            aria-label="Otwórz nawigację"
            onClick={() => setOpen(true)}
          >
            <Menu className="shrink-0" size={21} aria-hidden="true" />
          </button>
          <div className="flex min-w-0 items-center gap-3 text-sm text-[#7d8ba1] max-[850px]:flex-1 max-[580px]:text-sm [&_strong]:overflow-hidden [&_strong]:font-normal [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[#c2cadb] max-[850px]:[&>span]:hidden max-[850px]:[&>svg]:hidden">
            <span>Twoja przestrzeń</span>
            <ChevronRight className="shrink-0" size={16} aria-hidden="true" />
            <strong>{pageTitle}</strong>
          </div>
          <div className="flex shrink-0 items-center gap-4.25 max-[850px]:gap-2.5 [&>.button]:min-h-8.5 [&>.button]:px-2.75 [&>.button]:py-1.75 [&>.button]:text-sm max-[580px]:[&>.button]:w-8.25 max-[580px]:[&>.button]:p-1.75 max-[580px]:[&>.button>span]:hidden">
            <span className="flex items-center gap-1.5 text-sm text-[#8e9bb0] max-[1100px]:hidden">
              <ShieldCheck className="shrink-0" size={14} aria-hidden="true" />{" "}
              Prywatne spotkania
            </span>
            <JoinByLink compact />
            <NotificationBell />
            <Link
              className="avatar grid size-7.5 shrink-0 place-items-center rounded-full bg-[#a68ce025] text-sm font-medium text-[#c4a7ef] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary in-[.workspace-topbar]:size-7.25 in-[.workspace-topbar]:text-sm data-[tone=1]:bg-[#e9bb8120] data-[tone=1]:text-[#e6c396] data-[tone=2]:bg-[#8ed9bc20] data-[tone=2]:text-[#8ed9bc] data-[tone=3]:bg-[#91bbeb20] data-[tone=3]:text-[#91bbeb] motion-reduce:transition-none"
              href="/settings"
              aria-label="Ustawienia konta"
            >
              {profile?.display_name.slice(0, 2).toUpperCase()}
            </Link>
          </div>
        </header>
        <div className="@container/workspace">{children}</div>
      </div>
    </div>
  );

  function sidebar() {
    return (
      <aside className="flex min-h-full flex-col px-4.25 pt-7.25 pb-4 in-[.mobile-sidebar]:min-h-[72dvh] in-[.mobile-sidebar]:p-0 max-[1100px]:px-3">
        <div className="px-2.5 py-0 in-[.mobile-sidebar]:hidden [&_.brand]:text-3xl">
          <Brand href="/meetings" />
          <span className="mx-0 mt-4.25 mb-7 block text-sm tracking-wide text-[#6f7c91]">
            TWOJA PRZESTRZEŃ
          </span>
        </div>
        <Link
          className="button primary mb-7.5 inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] p-2.75 text-sm leading-5 font-medium text-[#1c1435] no-underline shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary in-[.mobile-sidebar]:mx-0 in-[.mobile-sidebar]:mt-2 in-[.mobile-sidebar]:mb-5 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
          href="/new"
          onClick={close}
        >
          <Plus className="shrink-0" size={17} aria-hidden="true" /> Utwórz
          spotkanie
        </Link>
        <nav
          className="[&>p]:mb-3 [&>p]:px-2.75 [&>p]:py-0 [&>p]:text-sm [&>p]:font-semibold [&>p]:tracking-wide [&>p]:text-[#7f8ba0]"
          aria-label="Nawigacja panelu"
        >
          <p className="m-0 leading-relaxed text-muted">PLANOWANIE</p>
          <AttentionNavigation onClick={close} active={path === "/attention"} />
          <Link
            href="/groups"
            onClick={close}
            aria-current={path === "/groups" ? "page" : undefined}
            className="my-1 flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#9ba7bc] hover:bg-[#1b2030] focus-visible:outline-2 focus-visible:outline-primary aria-[current=page]:bg-[#a388ec15] aria-[current=page]:text-[#cfbdff]"
          >
            <Users aria-hidden="true" className="size-4 shrink-0" />
            Twoje grupy
          </Link>
          <Link
            href="/notifications"
            onClick={close}
            aria-current={path === "/notifications" ? "page" : undefined}
            className="my-1 flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#9ba7bc] hover:bg-[#1b2030] focus-visible:outline-2 focus-visible:outline-primary aria-[current=page]:bg-[#a388ec15] aria-[current=page]:text-[#cfbdff]"
          >
            <Clock3 aria-hidden="true" className="size-4 shrink-0" />
            Powiadomienia
          </Link>
          <Link
            href="/calendar"
            onClick={close}
            className={`mx-0 my-0.75 flex min-h-10.5 items-center gap-2.5 rounded-[7px] px-2.5 py-2.75 text-sm text-[#9ba7bc] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#1b2030] hover:text-[#e3d9fb] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none max-[1100px]:gap-2 max-[1100px]:text-sm [&_svg]:shrink-0 [&_svg]:text-[#8390a6] [&.active]:border [&.active]:border-solid [&.active]:border-[#a388ec23] [&.active]:bg-[#a388ec15] [&.active]:px-2.25 [&.active]:py-2.5 [&.active]:text-[#cfbdff] [&.active_svg]:text-[#b59bee] [&.active>small]:bg-[#b293f51a] [&.active>small]:text-[#cfbafd] [&>small]:min-w-4.75 [&>small]:rounded-sm [&>small]:px-1.25 [&>small]:py-0.5 [&>small]:text-center [&>small]:text-sm [&>small]:font-medium [&>small]:text-[#7d8ba2] [&>span]:min-w-0 [&>span]:flex-1 ${path === "/calendar" ? "active" : ""}`}
            aria-current={path === "/calendar" ? "page" : undefined}
          >
            <CalendarDays className="shrink-0" size={17} aria-hidden="true" />
            <span>Mój kalendarz</span>
          </Link>
          {navigation.map((item) => {
            const href =
              item.view === "all" ? "/meetings" : `/meetings/${item.view}`;
            const active = path === href;
            return (
              <Link
                key={item.view}
                href={href}
                onClick={close}
                className={`mx-0 my-0.75 flex min-h-10.5 items-center gap-2.5 rounded-[7px] px-2.5 py-2.75 text-sm text-[#9ba7bc] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#1b2030] hover:text-[#e3d9fb] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none max-[1100px]:gap-2 max-[1100px]:text-sm [&_svg]:shrink-0 [&_svg]:text-[#8390a6] [&.active]:border [&.active]:border-solid [&.active]:border-[#a388ec23] [&.active]:bg-[#a388ec15] [&.active]:px-2.25 [&.active]:py-2.5 [&.active]:text-[#cfbdff] [&.active_svg]:text-[#b59bee] [&.active>small]:bg-[#b293f51a] [&.active>small]:text-[#cfbafd] [&>small]:min-w-4.75 [&>small]:rounded-sm [&>small]:px-1.25 [&>small]:py-0.5 [&>small]:text-center [&>small]:text-sm [&>small]:font-medium [&>small]:text-[#7d8ba2] [&>span]:min-w-0 [&>span]:flex-1 ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="shrink-0" size={17} />
                <span>{item.label}</span>
                {counts[item.view] !== undefined && (
                  <small className="text-sm">{counts[item.view]}</small>
                )}
              </Link>
            );
          })}
        </nav>
        {Boolean(events?.length) && (
          <div className="mx-1 mt-5.75 mb-7 border-t [border-top-style:solid] border-t-[#242b38] pt-5.75 [&>a]:flex [&>a]:items-center [&>a]:gap-2.25 [&>a]:rounded-md [&>a]:px-2 [&>a]:py-2.25 [&>a]:text-sm [&>a]:text-[#94a0b5] [&>a.active]:bg-[#1d2231] [&>a.active]:text-[#ded4f8] [&>a:hover]:bg-[#1d2231] [&>a:hover]:text-[#ded4f8] [&>a>span:last-child]:overflow-hidden [&>a>span:last-child]:text-ellipsis [&>a>span:last-child]:whitespace-nowrap [&>p]:mb-3 [&>p]:py-0 [&>p]:pr-2.75 [&>p]:pl-1.75 [&>p]:text-sm [&>p]:font-semibold [&>p]:tracking-wide [&>p]:text-[#7f8ba0]">
            <p className="m-0 leading-relaxed text-muted">OSTATNIO UTWORZONE</p>
            {events!.slice(0, 3).map((event) => (
              <Link
                href={`/meeting/${event.id}`}
                key={event.id}
                onClick={close}
                className={
                  path === `/meeting/${event.id}`
                    ? "active text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
                    : "text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
                }
              >
                <Square
                  aria-hidden="true"
                  className={
                    meetingStatus(event, now) === "confirmed"
                      ? "size-2 shrink-0 fill-current text-[#81b99a]"
                      : "size-2 shrink-0 fill-current text-[#a28bc9]"
                  }
                />
                <span>{event.title}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-auto pt-5">
          <div className="relative mx-1 mt-0 mb-5.5 rounded-[10px] border border-solid border-[#2b2b3e] bg-[#a388ec08] px-3.25 py-4.25 in-[.mobile-sidebar]:hidden [&_p]:mt-1.75 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#8790a4] [&_strong]:block [&_strong]:text-sm [&_strong]:leading-relaxed [&_strong]:font-medium [&_strong]:text-[#c7bedb] [&>svg]:mb-2.5 [&>svg]:text-[#a38bcf]">
            <Clock3 className="shrink-0" size={19} aria-hidden="true" />
            <strong>
              Mniej ustalania.
              <br />
              Więcej spotkań.
            </strong>
            <p className="m-0 leading-relaxed text-muted">
              Dobry plan zaczyna się od wspólnego czasu.
            </p>
          </div>
          <Link
            className={`mx-0 my-0.75 flex min-h-10.5 items-center gap-2.5 rounded-[7px] px-2.5 py-2.75 text-sm text-[#9ba7bc] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#1b2030] hover:text-[#e3d9fb] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none max-[1100px]:gap-2 max-[1100px]:text-sm [&_svg]:shrink-0 [&_svg]:text-[#8390a6] [&.active]:border [&.active]:border-solid [&.active]:border-[#a388ec23] [&.active]:bg-[#a388ec15] [&.active]:px-2.25 [&.active]:py-2.5 [&.active]:text-[#cfbdff] [&.active_svg]:text-[#b59bee] [&.active>small]:bg-[#b293f51a] [&.active>small]:text-[#cfbafd] [&>small]:min-w-4.75 [&>small]:rounded-sm [&>small]:px-1.25 [&>small]:py-0.5 [&>small]:text-center [&>small]:text-sm [&>small]:font-medium [&>small]:text-[#7d8ba2] [&>span]:min-w-0 [&>span]:flex-1 ${path === "/settings" ? "active" : ""}`}
            href="/settings"
            onClick={close}
            aria-current={path === "/settings" ? "page" : undefined}
          >
            <Settings2 className="shrink-0" size={17} aria-hidden="true" />
            <span>Ustawienia konta</span>
          </Link>
          <Link
            className="mx-0 my-0.75 flex min-h-10.5 items-center gap-2.5 rounded-[7px] px-2.5 py-2.75 text-sm text-[#9ba7bc] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#1b2030] hover:text-[#e3d9fb] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none max-[1100px]:gap-2 max-[1100px]:text-sm [&_svg]:shrink-0 [&_svg]:text-[#8390a6] [&.active]:border [&.active]:border-solid [&.active]:border-[#a388ec23] [&.active]:bg-[#a388ec15] [&.active]:px-2.25 [&.active]:py-2.5 [&.active]:text-[#cfbdff] [&.active_svg]:text-[#b59bee] [&.active>small]:bg-[#b293f51a] [&.active>small]:text-[#cfbafd] [&>small]:min-w-4.75 [&>small]:rounded-sm [&>small]:px-1.25 [&>small]:py-0.5 [&>small]:text-center [&>small]:text-sm [&>small]:font-medium [&>small]:text-[#7d8ba2] [&>span]:min-w-0 [&>span]:flex-1"
            href="/#how"
            onClick={close}
          >
            <CircleHelp className="shrink-0" size={17} aria-hidden="true" />
            <span>Jak to działa?</span>
          </Link>
          <div className="mt-3.5 flex items-center gap-2 border-t [border-top-style:solid] border-t-[#28303d] px-1 pt-4.25 pb-0 in-[.mobile-sidebar]:mb-1.25 [&_.avatar]:size-8 [&_small]:text-sm [&_small]:text-[#79879e] [&_strong]:overflow-hidden [&_strong]:text-sm [&_strong]:font-medium [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[#cfd5e3] [&>a]:flex [&>a]:min-w-0 [&>a]:flex-1 [&>a]:items-center [&>a]:gap-2.5 [&>a>span:last-child]:flex [&>a>span:last-child]:min-w-0 [&>a>span:last-child]:flex-col [&>a>span:last-child]:gap-1.25">
            <Link
              className="text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
              href="/settings"
              onClick={close}
            >
              <span className="avatar grid size-7.5 shrink-0 place-items-center rounded-full bg-[#a68ce025] text-sm font-medium text-[#c4a7ef] data-[tone=1]:bg-[#e9bb8120] data-[tone=1]:text-[#e6c396] data-[tone=2]:bg-[#8ed9bc20] data-[tone=2]:text-[#8ed9bc] data-[tone=3]:bg-[#91bbeb20] data-[tone=3]:text-[#91bbeb]">
                {profile?.display_name.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{profile?.display_name}</strong>
                <small className="text-sm">Konto osobiste</small>
              </span>
            </Link>
            <button
              className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              aria-label="Wyloguj się"
              disabled={leaving}
              onClick={() => void signOut()}
            >
              <LogOut className="shrink-0" size={16} aria-hidden="true" />
            </button>
          </div>
          {error && (
            <p
              className="m-0 text-sm leading-normal text-[#f1a3a3] [.join-strip_form>&]:absolute [.join-strip_form>&]:top-full [.join-strip_form>&]:text-sm"
              role="alert"
            >
              {error}
              <button
                className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                aria-label="Zamknij błąd"
                onClick={() => setError("")}
              >
                <X className="shrink-0" size={16} aria-hidden="true" />
              </button>
            </p>
          )}
        </div>
      </aside>
    );
  }
}
