"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  Check,
  Circle,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { InlineSeparator } from "./inline-separator";

const days = ["Pon", "Wt", "Śr"];
const hours = ["10:00", "11:00", "12:00"];
const availability = [1, 2, 1, 2, 2, 0, 2, 1, 2];
const avatars = [
  {
    name: "Ala",
    initials: "AL",
    className: "border-[#826cbd] bg-[#392d52] text-[#d4c1ff]",
  },
  {
    name: "Marek",
    initials: "MA",
    className: "border-[#5f8c7c] bg-[#263f39] text-[#a3dec5]",
  },
];

export function OnboardingPreview({
  name,
  complete,
}: {
  name: string;
  complete: boolean;
}) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(4);
  const count = selected === null ? 0 : availability[selected] + 1;
  const displayName = name.trim() || "Ty";
  return (
    <div className="relative mx-auto w-full max-w-110 py-5 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-8 rounded-full bg-primary/12 blur-3xl"
      />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 22, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.1 }}
        className="relative rounded-3xl border border-[#414259] bg-[#141b28] p-4 shadow-[0_24px_80px_#00000040] sm:p-5"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-[#ddd6ef]">
            <CalendarDays
              aria-hidden="true"
              className="size-4 text-[#b9a5f8]"
            />
            Spotkanie ekipy
          </span>
          <span className="rounded-full border border-[#3e3b52] bg-[#292237] px-2.5 py-1 text-sm text-[#c4b5e2]">
            Podgląd
          </span>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {avatars.map((avatar, index) => (
            <motion.span
              key={avatar.name}
              initial={reduced ? false : { opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.2 + index * 0.1 }}
              className={`grid size-10 shrink-0 place-items-center rounded-full border text-sm font-medium ${avatar.className}`}
              aria-label={avatar.name}
            >
              {avatar.initials}
            </motion.span>
          ))}
          <motion.span
            layout={!reduced}
            className="flex min-h-10 max-w-full min-w-10 items-center gap-2 rounded-full border border-[#a58fe9]/40 bg-[#a58fe9]/15 px-3 text-sm font-medium text-[#ded1ff]"
          >
            <Circle
              aria-hidden="true"
              className="size-1.5 shrink-0 fill-current text-[#c4a7ef]"
            />
            <span className="min-w-0 wrap-anywhere">{displayName}</span>
          </motion.span>
        </div>
        <div
          role="group"
          aria-label="Interaktywny podgląd kalendarza"
          className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-2"
        >
          <span />
          {days.map((day) => (
            <span
              key={day}
              className="pb-2 text-center text-sm font-medium text-[#9ea9be]"
            >
              {day}
            </span>
          ))}
          {hours.map((hour, row) => (
            <div key={hour} className="contents">
              <span className="flex items-center pr-1 text-sm text-[#8c9ab2]">
                {hour}
              </span>
              {days.map((day, col) => {
                const index = row * 3 + col,
                  active = selected === index,
                  value = availability[index] + (active ? 1 : 0);
                return (
                  <motion.button
                    key={index}
                    type="button"
                    initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: reduced ? 0 : 0.25,
                      delay: reduced ? 0 : 0.28 + index * 0.045,
                    }}
                    whileHover={reduced ? undefined : { scale: 1.04 }}
                    whileTap={reduced ? undefined : { scale: 0.96 }}
                    aria-label={`${day}, ${hour}. Przykładowa dostępność: ${value} z 3 osób`}
                    aria-pressed={active}
                    onClick={() => setSelected(active ? null : index)}
                    className={`flex min-h-12 cursor-pointer items-center justify-center gap-1 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${active ? "border-[#a1e9c4] bg-[#8ed9bc] text-[#112d25] shadow-[0_0_20px_#8ed9bc18]" : value === 2 ? "border-[#42695f] bg-[#27483f] text-[#b7d9cc] hover:border-[#85b6a0]" : "border-[#2e3a4b] bg-[#1b2735] text-[#92a3b9] hover:border-[#8b7cac]"}`}
                  >
                    {active && (
                      <Check aria-hidden="true" className="size-4 shrink-0" />
                    )}
                    {value}/3
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-2 border-t border-[#2a3242] pt-4 text-sm leading-relaxed text-[#92a0b8]">
          <MousePointer2
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 text-[#c4b2ef]"
          />
          <span>Kliknij pole. Tak prosto zaznaczysz, kiedy masz czas.</span>
        </div>
      </motion.div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={complete ? "ready" : `${selected}`}
          initial={reduced ? false : { opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduced ? 0 : -6 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
          className="relative mx-3 -mt-1 flex items-center gap-3 rounded-2xl border border-[#66735e] bg-[#222e2c] p-4 shadow-[0_12px_35px_#00000030] sm:mx-6"
          role="status"
          aria-live="polite"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#8ed9bc]/15 text-[#a4e3c6]">
            {count === 3 || complete ? (
              <Check aria-hidden="true" className="size-5" />
            ) : (
              <Sparkles aria-hidden="true" className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#d4eee0]">
              {complete
                ? "Teraz pora na Twoją ekipę."
                : count === 3
                  ? "Mamy wspólny czas!"
                  : selected === null
                    ? "Wybierz swoją wolną godzinę."
                    : "Każde zaznaczenie pomaga."}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-[#a2bbae]">
              {complete ? (
                "Twój profil jest już gotowy."
              ) : selected === null ? (
                "To tylko podgląd. Możesz śmiało klikać."
              ) : (
                <>
                  {days[selected % 3]}, {hours[Math.floor(selected / 3)]}
                  <InlineSeparator />
                  {count} z 3 osób może się spotkać.
                </>
              )}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
