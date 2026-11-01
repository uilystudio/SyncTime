"use client";
import { useState } from "react";
import {
  ArrowDown,
  CalendarCheck2,
  Check,
  Copy,
  MousePointer2,
  Share2,
  X,
} from "lucide-react";
export function MeetingStartGuide({
  welcome,
  organizer,
  hasSelection,
  saving,
  onShare,
  onCopy,
}: {
  welcome?: "created" | "joined";
  organizer: boolean;
  hasSelection: boolean;
  saving: boolean;
  onShare: () => void;
  onCopy: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || (!welcome && hasSelection)) return null;
  return (
    <section
      className={`mx-0 mt-0 mb-6 rounded-[11px] border border-solid border-[#4e415f] bg-[#1b1827] px-5.75 py-5.25 max-[720px]:px-4 max-[720px]:py-4.5 [&.created]:border-[#3f5948] [&.created]:bg-[#14231b] ${welcome === "created" ? "created" : ""}`}
      aria-label="Pierwsze kroki w spotkaniu"
    >
      <div className="flex items-start gap-3 [&_h2]:text-lg [&_h2]:leading-normal [&_h2]:tracking-tight max-[720px]:[&_h2]:text-base [&_p]:mt-1.5 [&_p]:text-sm [&_p]:text-[#9b90ad] max-[720px]:[&_p]:text-sm [&>div]:min-w-0 [&>div]:flex-1 [.created_&_p]:text-[#8fa38e]">
        <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#bba0e417] text-[#bba0e4] in-[.created]:bg-[#a3c89e14] in-[.created]:text-[#a3c89e]">
          <Check className="shrink-0" size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="m-0 font-semibold tracking-tight">
            {welcome === "created"
              ? "Spotkanie gotowe. Zaproś swoją ekipę!"
              : welcome === "joined"
                ? "Jesteś na liście. Teraz zaznacz swój czas."
                : "Zacznij od swojej dostępności."}
          </h2>
          <p className="m-0 leading-relaxed text-muted">
            {organizer
              ? "Udostępnij link uczestnikom i zaznacz godziny, w których możesz się spotkać."
              : "Kliknij pasujące godziny w kalendarzu albo dodaj je formularzem od-do. Zapis jest automatyczny."}
          </p>
        </div>
        <button
          className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          aria-label="Ukryj wskazówki"
          onClick={() => setDismissed(true)}
        >
          <X className="shrink-0" size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="mx-0 my-5.25 flex flex-wrap gap-6.25 max-[720px]:gap-[11px_18px] [&_.current]:text-[#c5a8ee] [&_.done]:text-[#a6bd9e] [&>span]:flex [&>span]:items-center [&>span]:gap-1.75 [&>span]:text-sm [&>span]:text-[#7e748d] max-[720px]:[&>span]:text-sm">
        <span className="done">
          <Check className="shrink-0" size={14} aria-hidden="true" />{" "}
          {organizer ? "Spotkanie utworzone" : "Dołączono"}
        </span>
        <span className={hasSelection && !saving ? "done" : "current"}>
          {hasSelection && !saving ? (
            <Check className="shrink-0" size={14} aria-hidden="true" />
          ) : (
            <MousePointer2 aria-hidden="true" className="size-4 shrink-0" />
          )}{" "}
          Zaznacz dostępność
        </span>
        <span>
          <CalendarCheck2 aria-hidden="true" className="size-4 shrink-0" />{" "}
          Sprawdź wspólny termin
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 [&_.text-button]:text-sm max-[720px]:[&>.button]:min-h-9.5 max-[720px]:[&>.button]:text-sm">
        {organizer && (
          <button
            className="button small primary inline-flex min-h-9.25 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-3.25 py-2 text-sm leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            onClick={onCopy}
          >
            <Copy className="shrink-0" size={14} aria-hidden="true" /> Kopiuj
            link zaproszenia
          </button>
        )}
        <a
          className={`button small inline-flex min-h-9.25 items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent px-3.25 py-2 text-sm leading-5 font-medium text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none [&.danger]:border-[#c16b76] [&.danger]:bg-[#ab515c] [&.danger]:text-white [&.primary]:bg-[#b19cfc] [&.primary]:text-[#1c1435] [&.primary]:shadow-[0_3px_12px_#a68bea14] [&.primary:hover]:-translate-y-px [&.primary:hover]:bg-[#c3b0ff] [&.secondary]:border-[#303646] [&.secondary]:bg-[#181e2b] [&.secondary]:text-[#d2d7e4] [&.secondary:hover]:border-[#48516a] [&.secondary:hover]:bg-[#242b3b] ${organizer ? "secondary" : "primary"}`}
          href="#availability-heading"
        >
          <ArrowDown className="shrink-0" size={14} aria-hidden="true" />{" "}
          {hasSelection ? "Edytuj moje godziny" : "Zaznacz moje godziny"}
        </a>
        {organizer && (
          <button
            className="text-button flex cursor-pointer items-center gap-1.25 border-0 border-solid border-current bg-transparent p-1 text-sm text-[#9ca8bf] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#cfbdf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:max-w-33.75 max-[720px]:justify-end max-[720px]:p-0 max-[720px]:text-right max-[720px]:text-sm"
            onClick={onShare}
          >
            <Share2 className="shrink-0" size={16} aria-hidden="true" /> Zobacz
            link
          </button>
        )}
      </div>
    </section>
  );
}
