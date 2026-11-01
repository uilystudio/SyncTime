"use client";
import { DisclosureSummary } from "./disclosure-summary";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MeetingPlace } from "./meeting-place";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  LoaderCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useClock } from "@/hooks/use-clock";
import { collectionClosed } from "@/lib/responses";
import { joinEvent, previewEvent, readEvent } from "@/lib/api";
import { ensureSession, errorMessage, isConfigured } from "@/lib/supabase";
import { dayLabel, eventDays } from "@/lib/time";
import type { MeetingEvent } from "@/lib/types";
import { ConfigurationNotice, Panel } from "./ui";
import { useProfile } from "./profile-context";

export function EventScreen({ token }: { token: string }) {
  const profile = useProfile();
  const router = useRouter();
  const validToken = /^[a-f0-9]{64}$/i.test(token);
  const [preview, setPreview] = useState<{
    event: MeetingEvent;
    participant_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(isConfigured && validToken);
  const [error, setError] = useState(
    validToken ? "" : "Ten link zaproszenia jest niepoprawny.",
  );
  const [nickname, setNickname] = useState(profile?.display_name ?? "");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const load = useCallback(() => {
    if (!isConfigured || !validToken) return;
    const sequence = ++request.current;
    return ensureSession()
      .then(async (uid) => {
        const data = await previewEvent(token);
        const snapshot = await readEvent(data.event.id).catch((error) => {
          if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "42501"
          )
            return null;
          throw error;
        });
        if (sequence !== request.current) return;
        if (snapshot?.participants.some((p) => p.user_id === uid)) {
          router.replace(`/meeting/${data.event.id}`);
          return;
        }
        setPreview(data);
        setError("");
      })
      .catch((e) => {
        if (sequence === request.current) setError(errorMessage(e));
      })
      .finally(() => {
        if (sequence === request.current) setLoading(false);
      });
  }, [token, validToken, router]);
  useEffect(() => {
    void load();
  }, [load]);
  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !preview) return;
    setBusy(true);
    setError("");
    try {
      await joinEvent(token, nickname.trim());
      router.replace(`/meeting/${preview.event.id}?joined=1`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }
  const now = useClock();
  const closed = preview ? collectionClosed(preview.event, now) : false;
  const days = preview
    ? eventDays(preview.event.start_date, preview.event.end_date)
    : [];
  return (
    <main className="join-event-page mx-auto my-0 max-w-150 px-5.5 pt-7.5 pb-20 in-[.workspace]:pt-8">
      <Link
        className="flex items-center gap-2 text-sm text-[#a7b0c3] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#d6caff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
        href="/meetings"
      >
        <ArrowLeft className="shrink-0" size={16} aria-hidden="true" /> Wróć do
        spotkań
      </Link>
      {loading ? (
        <div
          className="mt-8.75 rounded-[13px] border border-solid border-border bg-surface p-7.5"
          role="status"
          aria-label="Wczytywanie zaproszenia"
        >
          <div className="mb-5 h-8.75 w-[75%] animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.short]:h-5 [&.short]:w-[45%] [&.tall]:h-67.5 [&.tall]:w-full" />
          <div className="short mb-5 h-5 w-[45%] animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.tall]:h-67.5 [&.tall]:w-full" />
          <div className="tall mb-5 h-67.5 w-full animate-pulse rounded-[7px] bg-[#293244] in-[.meeting-tile-skeleton]:mx-0 in-[.meeting-tile-skeleton]:my-5 in-[.meeting-tile-skeleton]:h-5 motion-reduce:animate-none [&.short]:h-5 [&.short]:w-[45%]" />
        </div>
      ) : (
        <Panel className="join-card invitation-preview mt-7 rounded-[13px] border border-solid border-border bg-surface p-8.75 max-[720px]:px-5.75 max-[720px]:py-7 [&_.fine-print]:mt-3.75 [&_.fine-print]:text-center [&_h1]:mx-0 [&_h1]:mt-3.5 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:leading-[1.3] [&_h1]:wrap-anywhere max-[720px]:[&_h1]:text-3xl [.join-event-page_&_.eyebrow]:text-sm [.join-event-page_&_.eyebrow]:tracking-wider">
          <span className="large-icon mb-6.5 grid size-13.75 place-items-center rounded-[15px] border border-solid border-[#9e86ef30] bg-[#9e86ef12] text-[#b5a1ef]">
            <CalendarDays className="shrink-0" size={28} aria-hidden="true" />
          </span>
          {!isConfigured ? (
            <ConfigurationNotice />
          ) : preview ? (
            <>
              <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
                ZAPROSZENIE DO WSPÓLNEGO PLANOWANIA
              </span>
              <h1 className="m-0 font-semibold tracking-tight">
                {preview.event.title}
              </h1>
              <p className="m-0 leading-relaxed text-muted in-[.join-card]:text-base">
                {preview.event.description ||
                  "Znajdźcie chwilę, która pasuje całej ekipie."}
              </p>
              <div
                className="invitation-days mx-0 my-6 flex gap-1.75 max-[720px]:gap-1.25 [&_small]:text-sm [&_small]:text-[#9484a6] [&_strong]:text-2xl [&_strong]:font-medium [&_strong]:text-[#c7b0e8] [&>div]:flex [&>div]:min-w-11.25 [&>div]:flex-1 [&>div]:flex-col [&>div]:items-center [&>div]:gap-1.75 [&>div]:rounded-lg [&>div]:border [&>div]:border-solid [&>div]:border-[#3d3451] [&>div]:bg-[#a188d30b] [&>div]:px-1.25 [&>div]:py-3.25 max-[720px]:[&>div]:min-w-8.75 [&>div>span]:text-sm [&>div>span]:tracking-[.6px] [&>div>span]:text-[#91839f] [&>div>span]:uppercase"
                aria-label="Proponowane dni"
              >
                {days.slice(0, 5).map((day) => (
                  <div key={day}>
                    <span>{dayLabel(day, "EEE")}</span>
                    <strong>{dayLabel(day, "d")}</strong>
                    <small className="text-sm">{dayLabel(day, "MMM")}</small>
                  </div>
                ))}
                {days.length > 5 && (
                  <div className="in-[.invitation-days]:justify-center in-[.invitation-days]:border-dashed [.invitation-days_&_strong]:text-lg">
                    <strong>+{days.length - 5}</strong>
                    <small className="text-sm">dni</small>
                  </div>
                )}
              </div>
              <div className="mx-0 my-6 flex flex-wrap gap-3.5 border-t border-b [border-top-style:solid] [border-bottom-style:solid] border-t-border border-b-border px-0 py-5 text-sm text-[#acb7cb] in-[.invitation-preview]:grid in-[.invitation-preview]:grid-cols-[1fr_1fr] in-[.invitation-preview]:gap-[16px_12px] in-[.invitation-preview]:text-sm max-[720px]:gap-[14px_20px] max-[720px]:in-[.invitation-preview]:grid-cols-[1fr] max-[720px]:in-[.invitation-preview]:gap-3.25 max-[720px]:in-[.invitation-preview]:text-sm [&>span]:flex [&>span]:items-center [&>span]:gap-1.75">
                <span>
                  <Clock3 className="shrink-0" size={16} aria-hidden="true" />{" "}
                  {preview.event.meeting_duration_minutes} minut spotkania
                </span>
                <span>
                  <Users className="shrink-0" size={16} aria-hidden="true" />{" "}
                  {preview.participant_count} uczestników
                </span>
                <span>
                  <Globe2 className="shrink-0" size={16} aria-hidden="true" />{" "}
                  {preview.event.timezone}
                </span>
                <span>
                  <CalendarDays
                    className="shrink-0"
                    size={16}
                    aria-hidden="true"
                  />{" "}
                  Godziny {preview.event.day_start_time.slice(0, 5)}-
                  {preview.event.day_end_time.slice(0, 5)}
                </span>
              </div>
              <MeetingPlace place={preview.event} />
              {closed && (
                <div
                  className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
                  role="status"
                >
                  Organizator zamknął zbieranie. Nowe osoby mogą dołączyć
                  dopiero po jego wznowieniu.
                </div>
              )}
              <div className="mx-0 mt-0 mb-6 flex items-start gap-2.75 rounded-lg border border-solid border-[#445b4d] bg-[#83b68e0a] p-4.25 max-[720px]:gap-2 max-[720px]:p-3.75 [&_p]:mt-1.75 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#96a693] [&_strong]:text-sm [&_strong]:leading-relaxed [&_strong]:font-medium [&_strong]:text-[#c3d4bd] [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>svg]:text-[#9dbb9c]">
                <Check className="shrink-0" size={18} aria-hidden="true" />
                <div>
                  <strong>Najpierw dołączasz. Potem wybierasz godziny.</strong>
                  <p className="m-0 leading-relaxed text-muted">
                    Dołączenie nie oznacza potwierdzenia konkretnego terminu. W
                    kalendarzu zaznaczysz wszystkie pasujące Ci godziny.
                  </p>
                </div>
              </div>
              <form onSubmit={join}>
                <div className="flex items-center gap-3 rounded-lg border border-solid border-[#2d3547] bg-[#0f1621] p-3.75 [&_strong]:text-sm [&_strong]:font-medium [&_strong]:wrap-anywhere [&>div]:flex [&>div]:min-w-0 [&>div]:flex-1 [&>div]:flex-col [&>div]:gap-1.5 [&>div>span]:text-sm [&>div>span]:text-[#8392ab] [&>svg]:text-[#7d9380]">
                  <span className="avatar grid size-7.5 shrink-0 place-items-center rounded-full bg-[#a68ce025] text-sm font-medium text-[#c4a7ef] data-[tone=1]:bg-[#e9bb8120] data-[tone=1]:text-[#e6c396] data-[tone=2]:bg-[#8ed9bc20] data-[tone=2]:text-[#8ed9bc] data-[tone=3]:bg-[#91bbeb20] data-[tone=3]:text-[#91bbeb]">
                    {nickname.trim().slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <span>Dołączysz jako</span>
                    <strong>{nickname.trim() || "Wpisz swoją nazwę"}</strong>
                  </div>
                  <ShieldCheck
                    className="shrink-0"
                    size={18}
                    aria-hidden="true"
                  />
                </div>
                <details
                  className="mx-0 mt-3 mb-5.5 [&>summary]:cursor-pointer [&>summary]:text-sm [&>summary]:text-[#9c89bd] [&[open]>summary]:mb-3.75"
                  open={!profile?.display_name}
                >
                  <DisclosureSummary>
                    <span>Zmień nazwę w tym spotkaniu</span>
                  </DisclosureSummary>
                  <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                    <span>Twój nick</span>
                    <input
                      className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={40}
                      required
                      autoComplete="nickname"
                    />
                  </label>
                </details>
                {error && (
                  <div
                    className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
                <button
                  className="button primary inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
                  disabled={busy || !nickname.trim() || closed}
                >
                  {busy ? (
                    <LoaderCircle
                      size={17}
                      className="shrink-0 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      className="shrink-0"
                      size={17}
                      aria-hidden="true"
                    />
                  )}
                  {busy
                    ? "Otwieramy Twój kalendarz…"
                    : closed
                      ? "Dołączanie jest zamknięte"
                      : "Dołącz i zaznacz dostępność"}
                </button>
                <p className="fine-print m-0 text-sm leading-relaxed text-[#8a97ad]">
                  Twoje godziny zapiszą się na koncie. Możesz je później zmienić
                  lub usunąć.
                </p>
              </form>
            </>
          ) : (
            <>
              <h1 className="m-0 font-semibold tracking-tight">
                Nie udało się otworzyć zaproszenia.
              </h1>
              <p className="m-0 leading-relaxed text-muted">
                Sprawdź, czy link został skopiowany w całości.
              </p>
              {error && (
                <div
                  className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
                  role="alert"
                >
                  {error}
                </div>
              )}
              <button
                className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
                disabled={!validToken}
                onClick={() => {
                  setLoading(true);
                  void load();
                }}
              >
                Spróbuj ponownie
              </button>
            </>
          )}
        </Panel>
      )}
    </main>
  );
}
