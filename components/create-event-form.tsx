"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  Link2,
  LoaderCircle,
  Settings2,
  Users,
} from "lucide-react";
import { addDays, format } from "date-fns";
import { createEvent } from "@/lib/api";
import { deadlineInstant } from "@/lib/deadlines";
import { errorMessage, isConfigured } from "@/lib/supabase";
import { dayLabel, eventDays } from "@/lib/time";
import type { EventInput } from "@/lib/types";
import { validateEvent } from "@/lib/validation";
import { ConfigurationNotice, Panel } from "./ui";
import { useProfile } from "./profile-context";
import { GroupPicker } from "./group-picker";
import { DateRangePicker } from "./date-range-picker";
import { MeetingPlaceFields } from "./meeting-place-fields";
import { MeetingPlace } from "./meeting-place";
import { DisclosureSummary } from "./disclosure-summary";

export function CreateEventForm({
  initialGroupId = "",
}: { initialGroupId?: string } = {}) {
  const profile = useProfile();
  const [input, setInput] = useState<EventInput>(() => ({
    title: "",
    description: "",
    meeting_mode: "undecided",
    meeting_location: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(addDays(new Date(), 4), "yyyy-MM-dd"),
    day_start_time: "09:00",
    day_end_time: "18:00",
    meeting_duration_minutes: 60,
    timezone: profile?.timezone ?? "Europe/Warsaw",
    display_name: profile?.display_name ?? "",
    group_id: initialGroupId,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deadline, setDeadline] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const hours = Array.from(
    { length: 48 },
    (_, i) =>
      `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
  );
  function update(key: keyof EventInput, value: string | number | boolean) {
    setInput((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }
  function changeDates(start: string, end: string) {
    setInput((previous) => ({ ...previous, start_date: start, end_date: end }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.start_date;
      delete next.end_date;
      return next;
    });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateEvent(input);
    let responseDeadline: string | null = null;
    if (deadline) {
      try {
        responseDeadline = deadlineInstant(deadline, input.timezone);
      } catch (e) {
        validation.response_deadline = errorMessage(e);
      }
    }
    setErrors(validation);
    if (Object.keys(validation).length) {
      const target = form.current?.elements.namedItem(
        Object.keys(validation)[0],
      );
      if (target instanceof HTMLElement) {
        const details = target.closest("details");
        if (details) details.open = true;
        target.focus();
      }
      return;
    }
    setBusy(true);
    setFailure("");
    try {
      const result = await createEvent({
        ...input,
        response_deadline: responseDeadline,
      });
      router.push(`/meeting/${result.id}?created=1`);
    } catch (error) {
      setFailure(errorMessage(error));
      setBusy(false);
    }
  }
  const daysValid =
    input.start_date &&
    input.end_date &&
    input.start_date <= input.end_date &&
    !Number.isNaN(Date.parse(input.start_date)) &&
    !Number.isNaN(Date.parse(input.end_date));
  const datesLabel = daysValid
    ? `${dayLabel(input.start_date, "d MMM")} - ${dayLabel(input.end_date, "d MMM yyyy")}`
    : "Wybierz daty";
  const fieldError = (key: string) =>
    errors[key] ? (
      <span
        className="text-sm leading-normal text-[#f1a3a3] [.join-strip_form>&]:absolute [.join-strip_form>&]:top-full [.join-strip_form>&]:text-sm"
        id={`${key}-error`}
      >
        {errors[key]}
      </span>
    ) : null;
  return (
    <main className="create-event-page m-auto max-w-265 px-7.5 pt-7.5 pb-17.5 in-[.workspace]:max-w-262.5 in-[.workspace]:px-7.5 in-[.workspace]:pt-7.5 in-[.workspace]:pb-15 max-[720px]:px-[6%] max-[720px]:pt-6.25 max-[720px]:pb-12.5 max-[580px]:in-[.workspace]:px-4.5 max-[580px]:in-[.workspace]:pt-6.25 max-[580px]:in-[.workspace]:pb-11.25">
      <Link
        href="/meetings"
        className="flex items-center gap-2 text-sm text-[#a7b0c3] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#d6caff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
      >
        <ArrowLeft className="shrink-0" size={16} aria-hidden="true" /> Wróć do
        spotkań
      </Link>
      <div className="mx-0 mt-9.5 mb-6.75 in-[.create-event-page]:mb-7.25 in-[.workspace]:mt-6.5 max-[720px]:mx-0 max-[720px]:mt-7.5 max-[720px]:mb-5.5 [&_h1]:mx-0 [&_h1]:mt-3.25 [&_h1]:mb-2 [&_h1]:text-4xl [&_h1]:tracking-tight max-[720px]:[&_h1]:text-3xl [&_p]:text-base max-[720px]:[&_p]:text-sm [.create-event-page_&_p]:max-w-155">
        <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
          OD POMYSŁU DO WSPÓLNEGO TERMINU
        </span>
        <h1 className="m-0 font-semibold tracking-tight">
          Zaplanuj spotkanie.
        </h1>
        <p className="m-0 leading-relaxed text-muted">
          Wybierz dni, w których możecie się spotkać. Konkretne godziny każdy
          zaznaczy w kalendarzu.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_260px] items-start gap-7 @max-[870px]/workspace:grid-cols-[minmax(0,1fr)]">
        <Panel className="overflow-hidden rounded-[13px] border border-solid border-border bg-surface p-0">
          {!isConfigured && <ConfigurationNotice />}
          <form ref={form} onSubmit={submit} noValidate>
            <fieldset
              disabled={busy}
              className="m-0 min-w-0 border-0 border-solid border-current p-0"
            >
              <section className="border-b [border-bottom-style:solid] border-b-[#293140] px-6.75 pt-6.75 pb-2.25 max-[720px]:px-4.5 max-[720px]:pt-5.75 max-[720px]:pb-1.5">
                <div className="mb-5.75 flex items-start gap-3 [&_h2]:text-lg [&_h2]:leading-normal [&_h2]:tracking-tight max-[720px]:[&_h2]:text-base [&_p]:mt-1.25 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#8d9ab0] max-[720px]:[&_p]:text-sm [&>span]:grid [&>span]:size-6.75 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-solid [&>span]:border-[#a38bd43a] [&>span]:bg-[#a38bd414] [&>span]:text-sm [&>span]:text-[#c4adf4]">
                  <span>1</span>
                  <div>
                    <h2 className="m-0 font-semibold tracking-tight">
                      Jakie spotkanie planujesz?
                    </h2>
                    <p className="m-0 leading-relaxed text-muted">
                      Krótka nazwa pomoże Twojej ekipie je rozpoznać.
                    </p>
                  </div>
                </div>
                <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                  <span id="create-title-label">Nazwa spotkania</span>
                  <input
                    className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                    name="title"
                    aria-labelledby="create-title-label"
                    value={input.title}
                    maxLength={100}
                    placeholder="np. Spotkanie koła naukowego"
                    onChange={(e) => update("title", e.target.value)}
                    required
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? "title-error" : undefined}
                  />
                  {fieldError("title")}
                </label>
                <details className="mb-5.25 [&>summary]:text-[#a99ac9] [&[open]>summary]:mb-3.75">
                  <DisclosureSummary>
                    <span>Dodaj opis</span>
                    <small className="text-sm font-normal text-[#7e8ba1]">
                      opcjonalnie
                    </small>
                  </DisclosureSummary>
                  <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                    <span id="create-description-label">Opis spotkania</span>
                    <textarea
                      className="min-h-21.25 w-full resize-y rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                      name="description"
                      aria-labelledby="create-description-label"
                      value={input.description}
                      maxLength={1000}
                      placeholder="Temat, miejsce lub ważne informacje dla uczestników…"
                      onChange={(e) => update("description", e.target.value)}
                      aria-invalid={Boolean(errors.description)}
                      aria-describedby={
                        errors.description ? "description-error" : undefined
                      }
                    />
                    {fieldError("description")}
                  </label>
                </details>
                <MeetingPlaceFields
                  value={input}
                  errors={errors}
                  onChange={(place) => {
                    setInput((previous) => ({ ...previous, ...place }));
                    setErrors((previous) => {
                      const next = { ...previous };
                      delete next.meeting_mode;
                      delete next.meeting_location;
                      return next;
                    });
                  }}
                />
              </section>
              <section className="border-b [border-bottom-style:solid] border-b-[#293140] px-6.75 pt-6.75 pb-2.25 max-[720px]:px-4.5 max-[720px]:pt-5.75 max-[720px]:pb-1.5">
                <div className="mb-5.75 flex items-start gap-3 [&_h2]:text-lg [&_h2]:leading-normal [&_h2]:tracking-tight max-[720px]:[&_h2]:text-base [&_p]:mt-1.25 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#8d9ab0] max-[720px]:[&_p]:text-sm [&>span]:grid [&>span]:size-6.75 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-solid [&>span]:border-[#a38bd43a] [&>span]:bg-[#a38bd414] [&>span]:text-sm [&>span]:text-[#c4adf4]">
                  <span>2</span>
                  <div>
                    <h2 className="m-0 font-semibold tracking-tight">
                      W które dni szukamy terminu?
                    </h2>
                    <p className="m-0 leading-relaxed text-muted">
                      Wybierz zakres do 31 dni. To propozycje, a nie ostateczna
                      data spotkania.
                    </p>
                  </div>
                </div>
                <DateRangePicker
                  start={input.start_date}
                  end={input.end_date}
                  onChange={changeDates}
                />
                <div className="field-row grid grid-cols-2 gap-4.25 max-[720px]:gap-2.5 max-[480px]:grid-cols-1 [&_input]:min-w-0 [&_input]:text-base max-[720px]:[&_input]:min-w-0 max-[720px]:[&_input]:px-2 max-[720px]:[&_input]:py-2.5 max-[720px]:[&_input]:text-base">
                  <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                    <span id="create-start_date-label">Pierwszy dzień</span>
                    <input
                      className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                      type="date"
                      name="start_date"
                      aria-labelledby="create-start_date-label"
                      value={input.start_date}
                      onChange={(e) => {
                        const start = e.target.value;
                        changeDates(
                          start,
                          start > input.end_date ? start : input.end_date,
                        );
                      }}
                      aria-invalid={Boolean(errors.start_date)}
                      aria-describedby={
                        errors.start_date ? "start_date-error" : undefined
                      }
                    />
                    {fieldError("start_date")}
                  </label>
                  <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                    <span id="create-end_date-label">Ostatni dzień</span>
                    <input
                      className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                      type="date"
                      name="end_date"
                      aria-labelledby="create-end_date-label"
                      value={input.end_date}
                      onChange={(e) => update("end_date", e.target.value)}
                      aria-invalid={Boolean(errors.end_date)}
                      aria-describedby={
                        errors.end_date ? "end_date-error" : undefined
                      }
                    />
                    {fieldError("end_date")}
                  </label>
                </div>
              </section>
              <section className="border-b [border-bottom-style:solid] border-b-[#293140] px-6.75 pt-6.75 pb-2.25 max-[720px]:px-4.5 max-[720px]:pt-5.75 max-[720px]:pb-1.5">
                <div className="mb-5.75 flex items-start gap-3 [&_h2]:text-lg [&_h2]:leading-normal [&_h2]:tracking-tight max-[720px]:[&_h2]:text-base [&_p]:mt-1.25 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#8d9ab0] max-[720px]:[&_p]:text-sm [&>span]:grid [&>span]:size-6.75 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-solid [&>span]:border-[#a38bd43a] [&>span]:bg-[#a38bd414] [&>span]:text-sm [&>span]:text-[#c4adf4]">
                  <span>3</span>
                  <div>
                    <h2 className="m-0 font-semibold tracking-tight">
                      Jak długo i w jakich godzinach?
                    </h2>
                    <p className="m-0 leading-relaxed text-muted">
                      Uczestnicy wybiorą swoją dostępność w tym przedziale
                      każdego dnia.
                    </p>
                  </div>
                </div>
                <fieldset className="mx-0 mt-0 mb-5.5 border-0 border-solid border-current p-0 [&_input]:absolute [&_input]:size-px [&_input]:min-h-0 [&_input]:p-0 [&_input]:opacity-0 [&_label]:cursor-pointer [&_label]:rounded-[7px] [&_label]:border [&_label]:border-solid [&_label]:border-[#323b4d] [&_label]:p-3 [&_label]:text-center [&_label]:text-sm max-[720px]:[&_label]:px-1.25 max-[720px]:[&_label]:py-2.75 [&_label.chosen]:border-[#a68ef1] [&_label.chosen]:bg-[#a68ef118] [&_label.chosen]:text-[#c1acff] [&_label:focus-within]:[outline:2px_solid_var(--color-primary)] [&_label:focus-within]:outline-offset-[3px] [&_legend]:mb-2.5 [&_legend]:text-sm [&_legend]:text-[#c1c8d9] [&>div]:grid [&>div]:grid-cols-[repeat(4,1fr)] [&>div]:gap-2.25 max-[720px]:[&>div]:gap-1.75">
                  <legend>Długość jednego spotkania</legend>
                  <div>
                    {[30, 60, 90, 120].map((duration) => (
                      <label
                        className={
                          input.meeting_duration_minutes === duration
                            ? "chosen"
                            : ""
                        }
                        key={duration}
                      >
                        <input
                          className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                          type="radio"
                          name="meeting_duration_minutes"
                          value={duration}
                          checked={input.meeting_duration_minutes === duration}
                          onChange={() =>
                            update("meeting_duration_minutes", duration)
                          }
                        />
                        {duration} min
                      </label>
                    ))}
                  </div>
                  {fieldError("meeting_duration_minutes")}
                </fieldset>
                <div
                  className="mx-0 mt-0 mb-5.25 flex flex-wrap gap-1.75 [&>button]:flex-[1_1_110px] [&>button]:rounded-[7px] [&>button]:border [&>button]:border-solid [&>button]:border-[#2f3a4d] [&>button]:bg-[#151d2b] [&>button]:px-1.5 [&>button]:py-2.5 [&>button]:text-sm [&>button]:text-[#b0b9cd] [&>button.active]:border-[#8d74b4] [&>button.active]:bg-[#9d80ca15] [&>button.active]:text-[#d0baf6] [&>button:hover]:border-[#7c699d] [&>button>span]:mt-1.25 [&>button>span]:block [&>button>span]:text-sm [&>button>span]:text-[#78899f]"
                  role="group"
                  aria-label="Szybki wybór godzin"
                >
                  {[
                    { label: "Dzień roboczy", from: "09:00", to: "17:00" },
                    { label: "Po zajęciach", from: "15:00", to: "21:00" },
                    { label: "Wieczorem", from: "18:00", to: "22:00" },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      className={
                        input.day_start_time === preset.from &&
                        input.day_end_time === preset.to
                          ? "active cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                          : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                      }
                      onClick={() => {
                        update("day_start_time", preset.from);
                        update("day_end_time", preset.to);
                      }}
                    >
                      {preset.label}
                      <span>
                        {preset.from}-{preset.to}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="field-row grid grid-cols-2 gap-4.25 max-[720px]:gap-3 max-[480px]:grid-cols-1 max-[720px]:[&_input]:min-w-0 max-[720px]:[&_input]:px-2 max-[720px]:[&_input]:py-2.5 max-[720px]:[&_input]:text-base">
                  <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                    <span>Szukamy od godziny</span>
                    <select
                      className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                      name="day_start_time"
                      value={input.day_start_time}
                      onChange={(e) => update("day_start_time", e.target.value)}
                    >
                      {hours.map((hour) => (
                        <option key={hour}>{hour}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                    <span id="create-day_end_time-label">
                      Szukamy do godziny
                    </span>
                    <select
                      className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                      name="day_end_time"
                      aria-labelledby="create-day_end_time-label"
                      value={input.day_end_time}
                      onChange={(e) => update("day_end_time", e.target.value)}
                      aria-invalid={Boolean(errors.day_end_time)}
                      aria-describedby={
                        errors.day_end_time ? "day_end_time-error" : undefined
                      }
                    >
                      {hours.map((hour) => (
                        <option key={hour}>{hour}</option>
                      ))}
                    </select>
                    {fieldError("day_end_time")}
                  </label>
                </div>
              </section>
              <section
                className="space-y-5 border-b border-[#293140] p-5 sm:p-6"
                aria-label="Grupa i agenda"
              >
                <GroupPicker
                  value={input.group_id ?? ""}
                  onChange={(id) => update("group_id", id)}
                  disabled={busy}
                />
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    className="mt-1 size-4 shrink-0 accent-[#b19cfc]"
                    type="checkbox"
                    checked={!!input.agenda_enabled}
                    onChange={(e) => update("agenda_enabled", e.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    <span className="font-medium">
                      Włącz agendę i ustalenia
                    </span>
                    <span className="mt-1 block text-muted">
                      Opcjonalna lista tematów, decyzji i zadań z przypisanymi
                      osobami. Możesz ją włączyć lub wyłączyć później.
                    </span>
                  </span>
                </label>
              </section>
              <details className="border-b border-[#293140] px-6.75 py-5.25 max-[720px]:px-4.5 [&>summary]:text-[#a99ac9] [&[open]>summary]:mb-3.75">
                <DisclosureSummary
                  icon={
                    <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                  }
                >
                  <span>Termin zakończenia odpowiedzi</span>
                  <small className="text-sm font-normal text-[#7e8ba1]">
                    opcjonalnie
                  </small>
                </DisclosureSummary>
                <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                  <span id="create-response_deadline-label">
                    Odpowiedzi do ({input.timezone})
                  </span>
                  <input
                    className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                    type="datetime-local"
                    name="response_deadline"
                    aria-labelledby="create-response_deadline-label"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      setErrors((previous) => {
                        const next = { ...previous };
                        delete next.response_deadline;
                        return next;
                      });
                    }}
                    aria-invalid={Boolean(errors.response_deadline)}
                    aria-describedby={
                      errors.response_deadline
                        ? "response_deadline-error"
                        : "create-deadline-help"
                    }
                  />
                  {fieldError("response_deadline")}
                </label>
                <p
                  id="create-deadline-help"
                  className="fine-print m-0 text-sm leading-relaxed text-[#8a97ad]"
                >
                  Po tej godzinie odpowiedzi i dołączanie zostaną automatycznie
                  zamknięte. Termin możesz później zmienić.
                </p>
              </details>
              <details className="border-b [border-bottom-style:solid] border-b-[#293140] px-6.75 py-5.25 max-[720px]:px-4.5 max-[720px]:py-5.25 [&_.field:last-child]:mb-0 [&>summary]:flex [&>summary]:cursor-pointer [&>summary]:items-center [&>summary]:gap-2 [&>summary]:text-sm [&>summary]:text-[#a99ac9] [&[open]>summary]:mb-5.75">
                <DisclosureSummary
                  icon={
                    <Settings2 className="size-4 shrink-0" aria-hidden="true" />
                  }
                >
                  <span>Strefa czasowa i Twoja nazwa</span>
                </DisclosureSummary>
                <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                  <span>Strefa czasowa spotkania</span>
                  <select
                    className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                    name="timezone"
                    value={input.timezone}
                    onChange={(e) => update("timezone", e.target.value)}
                  >
                    {Array.from(
                      new Set([
                        input.timezone,
                        "Europe/Warsaw",
                        "Europe/London",
                        "Europe/Berlin",
                        "America/New_York",
                        "America/Los_Angeles",
                        "Asia/Tokyo",
                        "Australia/Sydney",
                        "UTC",
                      ]),
                    ).map((zone) => (
                      <option key={zone}>{zone}</option>
                    ))}
                  </select>
                  {fieldError("timezone")}
                </label>
                <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
                  <span id="create-display_name-label">
                    Twój nick w tym spotkaniu
                  </span>
                  <input
                    className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                    name="display_name"
                    aria-labelledby="create-display_name-label"
                    maxLength={40}
                    value={input.display_name}
                    onChange={(e) => update("display_name", e.target.value)}
                    aria-invalid={Boolean(errors.display_name)}
                    aria-describedby={
                      errors.display_name ? "display_name-error" : undefined
                    }
                  />
                  {fieldError("display_name")}
                </label>
              </details>
              {failure && (
                <div
                  className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
                  role="alert"
                >
                  {failure}
                </div>
              )}
              <div className="bg-[#111822] px-6.75 pt-5.75 pb-6.25 max-[720px]:px-4.5 max-[720px]:py-5.5 [&>.button]:text-sm max-[720px]:[&>.button]:text-sm [&>p]:mb-3.5 [&>p]:flex [&>p]:flex-wrap [&>p]:items-center [&>p]:justify-center [&>p]:gap-1.5 [&>p]:text-sm [&>p]:text-[#99a7bb] [&>p>strong]:font-medium [&>p>strong]:text-[#c8bcdf] [&>span]:mt-3 [&>span]:block [&>span]:text-center [&>span]:text-sm [&>span]:leading-relaxed [&>span]:text-[#8391a7]">
                <p className="m-0 leading-relaxed text-muted">
                  <Users className="shrink-0" size={15} aria-hidden="true" />{" "}
                  Organizujesz jako <strong>{input.display_name || "…"}</strong>
                </p>
                <button
                  type="submit"
                  className="button primary inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
                  disabled={busy || !isConfigured}
                >
                  {busy ? (
                    <LoaderCircle
                      className="shrink-0 animate-spin motion-reduce:animate-none"
                      size={18}
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      className="shrink-0"
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                  {busy
                    ? "Tworzymy kalendarz…"
                    : "Utwórz spotkanie i otwórz kalendarz"}
                </button>
                <span>Potem skopiujesz link i zaznaczysz swój wolny czas.</span>
              </div>
            </fieldset>
          </form>
        </Panel>
        <aside className="create-live-summary sticky top-26 rounded-xl border border-solid border-[#343147] bg-[#161b27] px-5.25 py-6 max-[720px]:p-5.5 @max-[870px]/workspace:static @max-[870px]/workspace:grid @max-[870px]/workspace:grid-cols-[1fr_1fr] @max-[870px]/workspace:gap-[0_20px] [&>.eyebrow]:text-sm [&>.eyebrow]:tracking-wider @max-[870px]/workspace:[&>.eyebrow]:col-span-full [&>h2]:mx-0 [&>h2]:mt-4.25 [&>h2]:mb-6 [&>h2]:text-2xl [&>h2]:leading-[1.4] [&>h2]:wrap-anywhere @max-[870px]/workspace:[&>h2]:col-span-full @max-[870px]/workspace:[&>h2]:mx-0 @max-[870px]/workspace:[&>h2]:mt-3.25 @max-[870px]/workspace:[&>h2]:mb-4.5">
          <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
            TAK WYGLĄDA TWÓJ PLAN
          </span>
          <h2 className="m-0 font-semibold tracking-tight">
            {input.title.trim() || "Twoje nowe spotkanie"}
          </h2>
          <MeetingPlace place={input} interactive={false} />
          <div className="mx-0 my-5.5 flex items-start gap-2.75 @max-[870px]/workspace:in-[.create-live-summary]:mx-0 @max-[870px]/workspace:in-[.create-live-summary]:my-4 [&_small]:text-sm [&_small]:text-[#a091b5] [&_span]:text-sm [&_span]:text-[#8190a7] [&_strong]:text-sm [&_strong]:font-normal [&_strong]:wrap-anywhere [&_strong]:text-[#d5cfdf] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1.5 [&>svg]:mt-px [&>svg]:shrink-0 [&>svg]:text-[#a28abb]">
            <CalendarDays className="shrink-0" size={18} aria-hidden="true" />
            <div>
              <span>Proponowane dni</span>
              <strong>{datesLabel}</strong>
              <small className="text-sm">
                {daysValid
                  ? `${eventDays(input.start_date, input.end_date).length} dni do wyboru`
                  : ""}
              </small>
            </div>
          </div>
          <div className="mx-0 my-5.5 flex items-start gap-2.75 @max-[870px]/workspace:in-[.create-live-summary]:mx-0 @max-[870px]/workspace:in-[.create-live-summary]:my-4 [&_small]:text-sm [&_small]:text-[#a091b5] [&_span]:text-sm [&_span]:text-[#8190a7] [&_strong]:text-sm [&_strong]:font-normal [&_strong]:wrap-anywhere [&_strong]:text-[#d5cfdf] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1.5 [&>svg]:mt-px [&>svg]:shrink-0 [&>svg]:text-[#a28abb]">
            <Clock3 className="shrink-0" size={18} aria-hidden="true" />
            <div>
              <span>Długość i zakres godzin</span>
              <strong>{input.meeting_duration_minutes} minut</strong>
              <small className="text-sm">
                Codziennie {input.day_start_time}-{input.day_end_time}
              </small>
            </div>
          </div>
          <div className="mx-0 my-5.5 flex items-start gap-2.75 @max-[870px]/workspace:in-[.create-live-summary]:mx-0 @max-[870px]/workspace:in-[.create-live-summary]:my-4 [&_small]:text-sm [&_small]:text-[#a091b5] [&_span]:text-sm [&_span]:text-[#8190a7] [&_strong]:text-sm [&_strong]:font-normal [&_strong]:wrap-anywhere [&_strong]:text-[#d5cfdf] [&>div]:flex [&>div]:min-w-0 [&>div]:flex-col [&>div]:gap-1.5 [&>svg]:mt-px [&>svg]:shrink-0 [&>svg]:text-[#a28abb]">
            <Globe2 className="shrink-0" size={18} aria-hidden="true" />
            <div>
              <span>Strefa czasowa</span>
              <strong>{input.timezone}</strong>
            </div>
          </div>
          <div className="mt-6 border-t [border-top-style:solid] border-t-[#343044] pt-5.5 @max-[870px]/workspace:hidden [&_h3]:mb-3.75 [&_h3]:text-sm [&_p]:mt-2.75 [&_p]:flex [&_p]:items-center [&_p]:gap-2 [&_p]:text-sm [&_p]:text-[#9f94b2] [&_p>span]:grid [&_p>span]:size-4.75 [&_p>span]:shrink-0 [&_p>span]:place-items-center [&_p>span]:rounded-full [&_p>span]:border [&_p>span]:border-solid [&_p>span]:border-[#51425f] [&_p>span]:text-sm [&_p>span]:text-[#bc9ee0] [&_p>svg]:mx-0.75 [&_p>svg]:my-0 [&_p>svg]:shrink-0 [&_p>svg]:text-[#a9c39e]">
            <h3 className="m-0 font-semibold tracking-tight">A co potem?</h3>
            <p className="m-0 leading-relaxed text-muted">
              <span>1</span> Powstaje wspólny kalendarz.
            </p>
            <p className="m-0 leading-relaxed text-muted">
              <span>2</span> Wysyłasz ekipie link zaproszenia.
            </p>
            <p className="m-0 leading-relaxed text-muted">
              <span>3</span> Każdy zaznacza pasujące godziny.
            </p>
            <p className="m-0 leading-relaxed text-muted">
              <Check className="shrink-0" size={16} aria-hidden="true" />{" "}
              SyncTime proponuje najlepszy termin.
            </p>
          </div>
          <div className="mt-6.5 flex items-start gap-2 border-t [border-top-style:solid] border-t-[#343044] pt-5 text-sm leading-relaxed text-[#8c839e] @max-[870px]/workspace:hidden [&_svg]:mt-0.5 [&_svg]:shrink-0">
            <Link2 className="shrink-0" size={16} aria-hidden="true" />
            <span>
              Nie potrzebujesz adresów e-mail uczestników. Wystarczy jeden link.
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
