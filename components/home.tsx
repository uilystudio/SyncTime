"use client";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Circle,
  Copyright,
  Square,
  Link2,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Users,
  CalendarDays,
  Globe2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "./ui";
import { InlineSeparator } from "./inline-separator";

const illustrationColors = [
  "bg-[#1c2530]",
  "bg-[#203d3d]",
  "bg-[#285148]",
  "bg-[#3d705c]",
  "bg-[#70b28e]",
] as const;

function GridIllustration() {
  return (
    <div
      className="relative mt-4.5 transform-[perspective(1200px)_rotateY(-3deg)_rotateX(1deg)] rounded-[15px] border border-solid border-[#303648] bg-[#131925] shadow-[0_24px_90px_#00000030] max-[720px]:mt-2.5 max-[720px]:mr-2 max-[720px]:mb-0 max-[720px]:ml-0 max-[720px]:w-[calc(100%-8px)] max-[720px]:max-w-130 max-[720px]:transform-none min-[1500px]:mx-2.5 min-[1500px]:my-0"
      aria-label="Ilustracja wyboru wspólnego terminu; dane poglądowe"
    >
      <div className="flex min-h-16 items-center justify-between gap-3 border-b [border-bottom-style:solid] border-b-border px-5.5 py-0 max-[1200px]:px-3.75 max-[1200px]:py-0 max-[720px]:min-h-16 max-[720px]:px-4.5 max-[720px]:py-0 [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2 [&>span:first-child]:text-sm [&>span:first-child]:tracking-wider [&>span:first-child]:text-[#a7afc0] max-[1200px]:[&>span:first-child]:text-sm max-[1000px]:[&>span:first-child]:tracking-wider max-[720px]:[&>span:first-child]:text-sm max-[720px]:[&>span:first-child]:tracking-wider">
        <span>
          <Circle
            aria-hidden="true"
            className="status-dot inline-block size-1.5 shrink-0 fill-success text-success"
          />{" "}
          WSPÓLNY TERMIN
        </span>
        <span className="rounded-[5px] border border-solid border-[#333b4e] px-1.75 py-0.75 text-sm text-[#8b95aa]">
          Podgląd
        </span>
      </div>
      <div className="grid grid-cols-[45px_repeat(5,1fr)] gap-1.5 pt-5.25 pr-6 pb-7.5 pl-3.5 max-[1200px]:gap-1 max-[1200px]:pr-4.25 max-[720px]:gap-1.5 max-[720px]:pt-4 max-[720px]:pr-5 max-[720px]:pb-6.25 max-[720px]:pl-2.5">
        <div className="grid grid-rows-[63px_repeat(5,48px)] text-center text-sm text-[#858fa6] max-[1000px]:grid-rows-[63px_repeat(5,42px)] max-[720px]:grid-rows-[63px_repeat(5,46px)] [&_span:not(:first-child)]:-translate-y-1">
          <span />
          <span>10:00</span>
          <span>11:00</span>
          <span>12:00</span>
          <span>13:00</span>
          <span>14:00</span>
        </div>
        {["PON", "WT", "ŚR", "CZW", "PT"].map((d, col) => (
          <div
            className="grid grid-rows-[59px_repeat(10,20px)] gap-1 max-[1000px]:grid-rows-[59px_repeat(10,17px)] max-[720px]:grid-rows-[59px_repeat(10,19px)]"
            key={d}
          >
            <div className="flex flex-col items-center gap-1.25 text-center text-sm tracking-wider text-[#9ca5b8] [&_strong]:text-lg [&_strong]:font-medium [&_strong]:tracking-tight [&_strong]:text-[#e2e5ee]">
              {d}
              <strong>{26 + col}</strong>
            </div>
            {Array.from({ length: 10 }, (_, row) => (
              <div
                key={row}
                className={`rounded-[3px] ${col === 2 && row >= 4 && row <= 5 ? "border border-[#c2f7d1] bg-[#8ad7ad] shadow-[0_0_20px_#84d4a732]" : illustrationColors[(col * 3 + row * 2) % 5]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="floating-result absolute -right-4.5 bottom-16.25 left-9 flex items-center gap-2.75 rounded-[10px] border border-solid border-[#496a58] bg-[#202c2d] px-4 py-3.75 shadow-[0_8px_35px_#0005] max-[1200px]:-right-2.5 max-[1200px]:left-3.75 max-[1000px]:bottom-15.75 max-[1000px]:gap-2 max-[1000px]:px-2.5 max-[1000px]:py-3 max-[720px]:-right-3.5 max-[720px]:bottom-15 max-[720px]:left-5 max-[720px]:px-3 max-[720px]:py-3.75 [&_div>span]:text-sm [&_div>span]:text-[#a5bcb0] max-[1000px]:[&_div>span]:text-sm max-[720px]:[&_div>span]:text-sm [&_strong]:text-sm [&_strong]:font-medium [&_strong]:whitespace-normal max-[1000px]:[&_strong]:text-sm max-[720px]:[&_strong]:text-sm [&>div:nth-child(2)]:flex [&>div:nth-child(2)]:flex-col [&>div:nth-child(2)]:gap-1.25">
        <span className="grid size-8.25 shrink-0 place-items-center rounded-full bg-[#82bf9222] text-[#9cdfb3]">
          <Check className="shrink-0" size={20} aria-hidden="true" />
        </span>
        <div>
          <strong>Znaleźliśmy wspólny czas.</strong>
          <span>
            Środa, 12:00-13:00 <InlineSeparator /> Wszyscy mogą!
          </span>
        </div>
        <div className="ml-auto flex pl-1.25 max-[1000px]:in-[.floating-result]:hidden [&>span]:-ml-1.75 [&>span]:grid [&>span]:size-6.5 [&>span]:place-items-center [&>span]:rounded-full [&>span]:border-2 [&>span]:border-solid [&>span]:border-[#202c2d] [&>span]:bg-[#b8a4d1] [&>span]:text-sm! [&>span]:font-semibold [&>span]:text-[#2a1b40]! [&>span:nth-child(2)]:bg-[#d6b099] [&>span:nth-child(3)]:bg-[#a1b7ca]">
          {["A", "M", "K"].map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      </div>
      <div className="flex min-h-12 items-center justify-between border-t [border-top-style:solid] border-t-[#252e3b] px-5.5 py-0 text-sm text-[#929eb1] max-[1000px]:px-3.25 max-[1000px]:py-0 max-[1000px]:text-sm max-[720px]:px-4.5 max-[720px]:py-0 max-[720px]:text-sm [&>span]:flex [&>span]:items-center [&>span]:gap-1.75">
        <span>
          <MousePointer2 className="shrink-0" size={14} aria-hidden="true" />{" "}
          Zaznacz. Udostępnij. Spotkaj się.
        </span>
        <div aria-hidden="true" className="flex gap-0.75 max-[1000px]:hidden">
          {[
            "text-[#203d3d]",
            "text-[#285148]",
            "text-[#3d705c]",
            "text-[#70b28e]",
            "text-[#96d1a7]",
          ].map((tone) => (
            <Square
              key={tone}
              aria-hidden="true"
              className={`size-2.5 shrink-0 fill-current ${tone}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const [invitation, setInvitation] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  function openInvitation(e: React.FormEvent) {
    e.preventDefault();
    const match = invitation
      .trim()
      .match(/(?:\/e\/)?([a-f0-9]{64})(?:[?#].*)?$/i);
    if (!match) {
      setError("Wklej pełny link zaproszenia do SyncTime.");
      return;
    }
    router.push(`/e/${match[1]}`);
  }
  return (
    <main className="m-auto max-w-350 px-[5.6%] py-0 max-[720px]:px-[6%] max-[720px]:py-0 min-[1500px]:max-w-375">
      <Panel className="grid min-h-143.75 grid-cols-[1fr_1.1fr] items-center gap-14.5 px-0 pt-18.25 pb-16.25 max-[1200px]:gap-7.5 max-[1000px]:min-h-137.5 max-[1000px]:px-0 max-[1000px]:py-13.75 max-[720px]:flex max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-7.5 max-[720px]:px-0 max-[720px]:pt-11.25 max-[720px]:pb-10 min-[1500px]:min-h-162.5 [&_h1]:mt-5.75 [&_h1]:text-[clamp(40px,4.15vw,60px)] [&_h1]:leading-[1.13] [&_h1]:font-semibold [&_h1]:tracking-tight max-[1200px]:[&_h1]:text-5xl max-[1000px]:[&_h1]:text-5xl max-[1000px]:[&_h1]:tracking-tight max-[720px]:[&_h1]:mt-5.5 max-[720px]:[&_h1]:text-5xl max-[720px]:[&_h1]:leading-[1.13] max-[720px]:[&_h1]:tracking-tight min-[1500px]:[&_h1]:text-6xl [&_h1>span]:text-[#a3aabd]">
        <div className="max-[720px]:max-w-112.5 [&>p]:mx-0 [&>p]:mt-6 [&>p]:mb-6.5 [&>p]:max-w-90 [&>p]:text-base [&>p]:leading-relaxed max-[1000px]:[&>p]:max-w-77.5 max-[1000px]:[&>p]:text-sm max-[720px]:[&>p]:mx-0 max-[720px]:[&>p]:mt-5.25 max-[720px]:[&>p]:mb-5.75 max-[720px]:[&>p]:max-w-90 max-[720px]:[&>p]:text-base min-[1500px]:[&>p]:text-base">
          <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
            <span className="grid size-5.5 place-items-center rounded-md border border-solid border-[#a590f22b] bg-[#a590f216]">
              <Sparkles className="shrink-0" size={16} aria-hidden="true" />
            </span>{" "}
            DOBRY CZAS ZACZYNA SIĘ TUTAJ
          </span>
          <h1 className="m-0 font-semibold tracking-tight">
            Wspólny termin.
            <br />
            <span>
              Bez zbędnych
              <br className="max-[720px]:hidden" /> wiadomości.
            </span>
          </h1>
          <p className="m-0 leading-relaxed text-muted">
            Każdy ma swój kalendarz. Znajdźcie chwilę, która pasuje wszystkim -
            prosto i bez długich ustaleń.
          </p>
          <Link
            href="/new"
            className="button primary inline-flex min-h-11 items-center justify-center gap-7 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-5.25 py-3.5 leading-5 font-medium text-[#1c1435] no-underline shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
          >
            Utwórz spotkanie{" "}
            <ArrowRight className="shrink-0" size={18} aria-hidden="true" />
          </Link>
          <div className="mt-4.5 flex items-center gap-1.75 text-sm text-[#929aae] max-[1000px]:text-sm max-[720px]:text-sm [&>svg]:text-[#b9abed]">
            <ShieldCheck aria-hidden="true" className="shrink-0" size={15} />{" "}
            Bezpłatnie <InlineSeparator /> Prywatne spotkania{" "}
            <InlineSeparator /> Po prostu działa
          </div>
        </div>
        <GridIllustration />
      </Panel>
      <section
        className="border-t [border-top-style:solid] border-t-[#232a36] px-0 pt-10.75 pb-10 max-[720px]:px-0 max-[720px]:py-8"
        id="how"
      >
        <div className="text-center [&_h2]:mt-2.75 [&_h2]:text-2xl [&_h2]:tracking-tight max-[720px]:[&_h2]:text-2xl [&>span]:text-sm [&>span]:tracking-wider [&>span]:text-[#929caf] max-[720px]:[&>span]:text-sm">
          <span>MNIEJ PLANOWANIA, WIĘCEJ SPOTKAŃ</span>
          <h2 className="m-0 font-semibold tracking-tight">
            Trzy kroki. Jeden wspólny czas.
          </h2>
        </div>
        <div className="mt-7.25 grid grid-cols-[repeat(3,1fr)] gap-5 max-[1000px]:gap-3 max-[720px]:mt-6 max-[720px]:grid-cols-[1fr] max-[720px]:gap-2.75 [&_article]:rounded-[11px] [&_article]:border [&_article]:border-solid [&_article]:border-[#252c39] [&_article]:bg-[#121721] [&_article]:px-6.25 [&_article]:py-5.75 max-[1000px]:[&_article]:p-5 max-[720px]:[&_article]:grid max-[720px]:[&_article]:grid-cols-[42px_1fr] max-[720px]:[&_article]:gap-x-4.25 max-[720px]:[&_article]:p-5 min-[1500px]:[&_article]:p-6.75 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:tracking-tight max-[1000px]:[&_h3]:text-base max-[720px]:[&_h3]:mx-0 max-[720px]:[&_h3]:mt-px max-[720px]:[&_h3]:mb-1.25 max-[720px]:[&_h3]:text-base [&_p]:max-w-65 [&_p]:text-sm [&_p]:leading-relaxed max-[1000px]:[&_p]:text-sm max-[720px]:[&_p]:max-w-none max-[720px]:[&_p]:text-sm">
          {[
            {
              n: "01",
              icon: CalendarDays,
              title: "Zaproponuj spotkanie",
              text: "Wybierz dni, godziny i czas trwania. Resztę ogarniemy razem.",
            },
            {
              n: "02",
              icon: Link2,
              title: "Zaproś swoją ekipę",
              text: "Wyślij jeden link. Każdy zaznacza, kiedy ma wolną chwilę.",
            },
            {
              n: "03",
              icon: Users,
              title: "Znajdźcie wspólny termin",
              text: "Zobacz najlepsze propozycje i wybierzcie czas dla Was.",
            },
          ].map((step) => (
            <article key={step.n}>
              <div className="step-top mb-5.25 flex items-center justify-between max-[720px]:row-[span_2] max-[720px]:m-0 max-[720px]:block">
                <span className="inline-grid size-9.75 shrink-0 place-items-center rounded-[10px] border border-solid border-[#a58fe91e] bg-[#a58fe913] text-[#b6a3f5] max-[1000px]:in-[.join-strip]:hidden max-[720px]:in-[.join-strip]:grid">
                  <step.icon className="shrink-0" size={20} />
                </span>
                <span className="text-sm text-[#727d94] tabular-nums max-[720px]:in-[.step-top]:hidden">
                  {step.n}
                </span>
              </div>
              <h3 className="m-0 font-semibold tracking-tight">{step.title}</h3>
              <p className="m-0 leading-relaxed text-muted">{step.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="join-strip flex items-center justify-between gap-5 rounded-[11px] border border-solid border-[#29303d] bg-[#111620] px-6.25 py-5.5 max-[1000px]:p-5 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-4.5 max-[720px]:p-5.5 [&_form]:relative [&_form]:flex [&_form]:w-[46%] [&_form]:gap-2 max-[1000px]:[&_form]:w-[51%] max-[720px]:[&_form]:w-full max-[720px]:[&_form]:flex-wrap max-[720px]:[&_form>.button]:min-h-10.25 max-[720px]:[&_form>.button]:p-2.5 max-[720px]:[&_form>.button]:text-sm [&_form>input]:min-w-0 [&_form>input]:flex-1 [&_form>input]:bg-[#0c111b] max-[720px]:[&_form>input]:w-[60%] max-[720px]:[&_form>input]:text-base [&_h3]:text-base [&_h3]:tracking-tight max-[1000px]:[&_h3]:text-base max-[720px]:[&_h3]:text-base [&_p]:mt-1 [&_p]:text-sm max-[1000px]:[&_p]:text-sm max-[720px]:[&_p]:text-sm">
        <div className="flex items-center gap-3.5">
          <span className="inline-grid size-9.75 shrink-0 place-items-center rounded-[10px] border border-solid border-[#a58fe91e] bg-[#a58fe913] text-[#b6a3f5] max-[1000px]:in-[.join-strip]:hidden max-[720px]:in-[.join-strip]:grid">
            <Link2 className="shrink-0" size={21} aria-hidden="true" />
          </span>
          <div>
            <h3 className="m-0 font-semibold tracking-tight">
              Masz już zaproszenie?
            </h3>
            <p className="m-0 leading-relaxed text-muted">
              Dołącz do spotkania przez udostępniony link.
            </p>
          </div>
        </div>
        <form onSubmit={openInvitation}>
          <label className="sr-only" htmlFor="invitation">
            Link zaproszenia
          </label>
          <input
            className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
            id="invitation"
            placeholder="Wklej link do spotkania…"
            value={invitation}
            onChange={(e) => setInvitation(e.target.value)}
            aria-describedby={error ? "invitation-error" : undefined}
          />
          <button
            className="button secondary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            type="submit"
          >
            Dołącz{" "}
            <ArrowRight className="shrink-0" size={16} aria-hidden="true" />
          </button>
          {error && (
            <span
              id="invitation-error"
              className="text-sm leading-normal text-[#f1a3a3] [.join-strip_form>&]:absolute [.join-strip_form>&]:top-full [.join-strip_form>&]:text-sm"
            >
              {error}
            </span>
          )}
        </form>
      </section>
      <footer className="flex items-center justify-between px-0 pt-7.25 pb-6.25 text-sm text-[#7c879d] max-[720px]:flex-col max-[720px]:items-start max-[720px]:gap-3 max-[720px]:px-0 max-[720px]:py-6.25 max-[720px]:text-sm [&>span]:flex [&>span]:items-center [&>span]:gap-1.75">
        <span>
          <Copyright aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="sr-only">Copyright</span>
          {new Date().getFullYear()} SyncTime{" "}
          <span className="px-1.5 py-0 text-[#464f61]">/</span> Zróbmy czas na
          to, co ważne.
        </span>
        <span>
          <Globe2 className="shrink-0" size={14} aria-hidden="true" />{" "}
          Stworzone, żeby się spotkać.
        </span>
      </footer>
    </main>
  );
}
