import Link from "next/link";
import { InlineSeparator } from "./inline-separator";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Link2,
  Sparkles,
} from "lucide-react";
import {
  meetingStart,
  meetingStatus,
  type MeetingSummary,
} from "@/lib/meetings";
import { localTime } from "@/lib/time";
export function MeetingInsights({
  events,
  now,
}: {
  events: MeetingSummary[];
  now: Date;
}) {
  const next = events
    .filter((e) => meetingStatus(e, now) === "confirmed")
    .sort((a, b) => meetingStart(a) - meetingStart(b))[0];
  return (
    <aside
      className="flex flex-col gap-4.5 pt-0.75 max-[580px]:flex @max-[950px]/workspace:grid @max-[950px]/workspace:grid-cols-[1fr_1fr] @max-[950px]/workspace:gap-4"
      aria-label="Podsumowanie planowania"
    >
      <section className="rounded-[11px] border border-solid border-[#303c3a] bg-[#141e20] px-5 py-5.25 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:leading-normal [&_h2]:wrap-anywhere [&>.button]:mt-5 [&>.button]:min-h-9.25 [&>.button]:border-[#405447] [&>.button]:bg-[#27382d] [&>.button]:p-2 [&>.button]:text-sm [&>.button]:text-[#c4d8c9] [&>p]:flex [&>p]:items-center [&>p]:gap-1.5 [&>p]:text-sm [&>p]:text-[#a4b8aa]">
        <div className="flex items-center gap-2 text-sm font-medium tracking-[.9px] text-[#a2b8aa] [&_svg]:text-[#94bca0]">
          <CalendarCheck2 className="shrink-0" size={16} aria-hidden="true" />{" "}
          NAJBLIŻSZE SPOTKANIE
        </div>
        {next ? (
          <>
            <div className="mx-0 mt-6 mb-5.5 flex flex-col items-center @max-[950px]/workspace:mx-0 @max-[950px]/workspace:mt-5 @max-[950px]/workspace:mb-3 @max-[950px]/workspace:items-start [&_strong]:text-6xl [&_strong]:leading-[1.3] [&_strong]:font-normal [&_strong]:tracking-tight [&_strong]:text-[#d5e3d8] @max-[950px]/workspace:[&_strong]:text-5xl [&>small]:text-sm [&>small]:text-[#94a99d] [&>small]:capitalize [&>span]:text-sm [&>span]:tracking-wider [&>span]:text-[#94ae9e] [&>span]:uppercase">
              <span>
                {localTime(next.selected_start!, next.timezone, "MMM")}
              </span>
              <strong>
                {localTime(next.selected_start!, next.timezone, "d")}
              </strong>
              <small className="text-sm">
                {localTime(next.selected_start!, next.timezone, "EEEE")}
              </small>
            </div>
            <h2 className="m-0 font-semibold tracking-tight">{next.title}</h2>
            <p className="m-0 leading-relaxed text-muted">
              <Clock3 className="shrink-0" size={14} aria-hidden="true" />{" "}
              {localTime(next.selected_start!, next.timezone)}{" "}
              <InlineSeparator /> {next.meeting_duration_minutes} min
            </p>
            <span className="mt-1.25 block text-sm text-[#7f9989]">
              {next.timezone}
            </span>
            <Link
              className="button secondary inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
              href={`/meeting/${next.id}`}
            >
              Otwórz spotkanie{" "}
              <ArrowRight className="shrink-0" size={15} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <div className="pt-7.5 text-center max-[580px]:px-2.5 max-[580px]:pt-5.5 max-[580px]:pb-2 [&_h2]:text-base [&_h2]:text-[#c1d1c6] [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#839b8e] [&>span]:mb-4.75 [&>span]:inline-grid [&>span]:size-14.5 [&>span]:place-items-center [&>span]:rounded-[14px] [&>span]:border [&>span]:border-dashed [&>span]:border-[#4f6758] [&>span]:text-[#7fa28a]">
            <span>
              <CalendarDays className="shrink-0" size={29} aria-hidden="true" />
            </span>
            <h2 className="m-0 font-semibold tracking-tight">
              Jeszcze nic na sztywno.
            </h2>
            <p className="m-0 leading-relaxed text-muted">
              Po zatwierdzeniu terminu zobaczysz tutaj najbliższe spotkanie.
            </p>
          </div>
        )}
      </section>
      <section className="rounded-[11px] border border-solid border-[#383046] bg-[#1a1725] px-5 py-5.5 max-[580px]:p-6 [&_h3]:mt-4.25 [&_h3]:text-lg [&_h3]:leading-[1.45] [&_h3]:tracking-tight [&_h3]:text-[#d1c6e4] [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#9288a6] [&>a]:mt-5 [&>a]:flex [&>a]:items-center [&>a]:justify-between [&>a]:text-sm [&>a]:text-[#b8a0e0] [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span]:text-sm [&>span]:tracking-wider [&>span]:text-[#b7a2db]">
        <span>
          <Sparkles className="shrink-0" size={16} aria-hidden="true" /> DOBRY
          PLAN
        </span>
        <h3 className="m-0 font-semibold tracking-tight">
          Zrób miejsce dla całej ekipy.
        </h3>
        <p className="m-0 leading-relaxed text-muted">
          Dodaj kilka możliwych terminów. Więcej zaznaczeń to większa szansa na
          wspólną chwilę.
        </p>
        <Link
          className="text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
          href="/new"
        >
          Zaplanuj coś razem{" "}
          <ArrowRight className="shrink-0" size={14} aria-hidden="true" />
        </Link>
      </section>
      <div className="flex items-start gap-2.5 px-1.25 py-0 @max-[950px]/workspace:hidden [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#7f8da4] [&_strong]:font-normal [&_strong]:text-[#9aa7bc] [&>svg]:mt-0.75 [&>svg]:shrink-0 [&>svg]:text-[#77869c]">
        <Link2 className="shrink-0" size={17} aria-hidden="true" />
        <p className="m-0 leading-relaxed text-muted">
          Masz zaproszenie? Użyj przycisku <strong>„Dołącz przez link”</strong>{" "}
          na górze panelu.
        </p>
      </div>
    </aside>
  );
}
