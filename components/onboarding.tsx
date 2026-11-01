"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  Circle,
  CheckCheck,
  Link2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { getSupabase, errorMessage, isConfigured } from "@/lib/supabase";
import { getProfile, safeNext, saveProfile } from "@/lib/profile";
import { ConfigurationNotice } from "./ui";
import { OnboardingPreview } from "./onboarding-preview";

const steps = ["Poznaj SyncTime", "Twój profil", "Gotowe"];
const benefits = [
  {
    icon: CalendarDays,
    title: "Zaznacz wolne godziny",
    text: "Kliknij lub przeciągnij po kalendarzu.",
  },
  {
    icon: Link2,
    title: "Zaproś swoją ekipę",
    text: "Udostępnij link lub zaproś stałą grupę.",
  },
  {
    icon: CheckCheck,
    title: "Znajdźcie wspólny czas",
    text: "Porównaj propozycje i potwierdźcie obecność.",
  },
];
const confetti = [
  "left-3 top-3 bg-[#b6a0ff]",
  "right-7 top-0 bg-[#8ed9bc]",
  "left-0 top-16 bg-[#e8c38b]",
  "right-0 top-15 bg-[#b6a0ff]",
  "bottom-1 left-7 bg-[#8ed9bc]",
  "right-6 bottom-3 bg-[#e8c38b]",
];
const primaryButton =
  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-transparent bg-[#b9a3fa] px-5 py-3 text-base leading-relaxed font-medium text-[#211537] shadow-[0_6px_24px_#a68bea18] transition-colors hover:bg-[#ccb8ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";
const subtleButton =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#a9a1bb] transition-colors hover:bg-[#a58fe9]/10 hover:text-[#ddd0fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";

export function Onboarding() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [next, setNext] = useState("/meetings");
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(1);
  const saving = useRef(false);
  const focusRequested = useRef(false);
  const focusStepHeading = useCallback((node: HTMLHeadingElement | null) => {
    if (node && focusRequested.current) {
      node.focus();
      focusRequested.current = false;
    }
  }, []);
  useEffect(() => {
    if (!isConfigured) return;
    let live = true;
    async function load() {
      try {
        const { data, error } = await getSupabase().auth.getSession();
        if (!live) return;
        if (error) throw error;
        const destination = safeNext(
          new URLSearchParams(window.location.search).get("next"),
        );
        if (!data.session) {
          router.replace(`/login?next=${encodeURIComponent(destination)}`);
          return;
        }
        const profile = await getProfile(data.session.user.id);
        if (!live) return;
        if (profile) {
          router.replace(destination);
          return;
        }
        setNext(destination);
        setUid(data.session.user.id);
        setChecking(false);
        setError("");
      } catch (e) {
        if (live) {
          setError(errorMessage(e));
          setChecking(false);
        }
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [attempt, router]);
  function go(target: number) {
    if (busy) return;
    setDirection(target > step ? 1 : -1);
    focusRequested.current = true;
    setStep(target);
    setError("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || saving.current || !name.trim() || name.trim().length > 40)
      return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await saveProfile(uid, name.trim());
      setDirection(1);
      focusRequested.current = true;
      setStep(2);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const invitation = /^\/(?:e|g)\//.test(next);
  const groupInvitation = next.startsWith("/g/");
  const canStart = isConfigured && !!uid && !checking;
  return (
    <main className="relative isolate mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-12 lg:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-120 max-w-200 bg-radial from-[#7560a8]/12 to-transparent"
      />
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 sm:mb-10">
        <span className="flex items-center gap-2 text-sm font-medium text-[#bfb0e2]">
          <Sparkles aria-hidden="true" className="size-4" />
          Twój dobry początek
        </span>
        <span className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck aria-hidden="true" className="size-4 text-[#9dc8b1]" />
          E-mail zostaje prywatny
        </span>
      </div>
      <div className="grid items-center gap-7 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <aside
          aria-label="Jak działa SyncTime"
          className={
            step === 0
              ? "order-2 min-w-0 lg:order-1"
              : "hidden min-w-0 lg:order-1 lg:block"
          }
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.45 }}
          >
            <p className="mb-3 text-sm font-medium tracking-widest text-[#b7a5e7]">
              DOBRZE SIĘ ZGRAĆ.
            </p>
            <h2 className="m-0 text-3xl leading-tight font-semibold tracking-tight text-[#f0ecf8] sm:text-4xl">
              Każdy ma swój plan.
              <br />
              <span className="text-[#bca8ed]">Znajdźcie wspólny.</span>
            </h2>
            <p className="mt-4 max-w-100 text-base leading-relaxed text-muted">
              Od „kiedy możecie?” do „widzimy się!”. W kilku prostych krokach.
            </p>
          </motion.div>
          <OnboardingPreview name={name} complete={step === 2} />
        </aside>
        <section
          aria-label="Konfiguracja profilu"
          className="relative order-1 min-w-0 overflow-hidden rounded-3xl border border-[#373448] bg-linear-to-br from-[#1b1d2d] via-[#171c28] to-[#121924] p-5 shadow-[0_24px_80px_#00000025] sm:p-8 lg:order-2 lg:p-9"
        >
          <nav aria-label="Postęp wprowadzenia" className="mb-8">
            <ol className="grid grid-cols-3 gap-2 sm:gap-3">
              {steps.map((label, index) => (
                <li
                  key={label}
                  aria-current={step === index ? "step" : undefined}
                >
                  <div className="relative mb-2 h-1 overflow-hidden rounded-full bg-[#303044]">
                    <motion.div
                      initial={false}
                      animate={{ scaleX: index <= step ? 1 : 0 }}
                      transition={{ duration: reduced ? 0 : 0.4 }}
                      className="h-full origin-left rounded-full bg-[#b9a3fa]"
                    />
                  </div>
                  <span
                    className={`flex flex-wrap items-center gap-1 text-sm ${index <= step ? "text-[#d0c2ec]" : "text-[#8c8b9d]"}`}
                  >
                    {index < step ? (
                      <Check
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-[#9acdb5]"
                      />
                    ) : (
                      <span aria-hidden="true">0{index + 1}</span>
                    )}
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
          <p aria-live="polite" className="sr-only">
            Krok {step + 1} z 3: {steps[step]}
          </p>
          {!isConfigured && <ConfigurationNotice />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={
                reduced ? { opacity: 0 } : { opacity: 0, x: 20 * direction }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -15 * direction }}
              transition={{ duration: reduced ? 0 : 0.22 }}
            >
              {step === 0 && (
                <>
                  <span className="mb-5 inline-grid size-14 place-items-center rounded-2xl border border-[#a58fe9]/30 bg-[#a58fe9]/10 text-[#c3aff7]">
                    <motion.span
                      initial={reduced ? false : { rotate: -15, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 13,
                      }}
                    >
                      <Sparkles aria-hidden="true" className="size-7" />
                    </motion.span>
                  </span>
                  <h1
                    ref={focusStepHeading}
                    tabIndex={-1}
                    className="text-3xl leading-tight font-semibold tracking-tight outline-none sm:text-4xl"
                  >
                    Hej, dobrze, że jesteś.
                  </h1>
                  <p className="mt-4 text-base leading-relaxed text-muted">
                    Poznaj miejsce, w którym Wasze kalendarze w końcu się
                    spotykają.
                  </p>
                  <ul className="my-7 space-y-4">
                    {benefits.map((benefit, index) => (
                      <motion.li
                        key={benefit.title}
                        initial={reduced ? false : { opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: reduced ? 0 : 0.12 + index * 0.12,
                          duration: reduced ? 0 : 0.3,
                        }}
                        className="flex items-start gap-3"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#38364d] bg-[#232336] text-[#baa7eb]">
                          <benefit.icon
                            aria-hidden="true"
                            className="size-4.5"
                          />
                        </span>
                        <div>
                          <p className="text-base font-medium text-[#dfd8ed]">
                            {benefit.title}
                          </p>
                          <p className="mt-0.5 text-sm leading-relaxed text-muted">
                            {benefit.text}
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                  {invitation && (
                    <p className="mb-5 flex items-start gap-2 rounded-xl border border-[#4a4763] bg-[#a58fe9]/8 p-3 text-sm leading-relaxed text-[#c8bddf]">
                      <Link2
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                      />
                      Twoje zaproszenie{" "}
                      {groupInvitation ? "do grupy" : "na spotkanie"} czeka.
                      Wrócisz do niego po ustawieniu profilu.
                    </p>
                  )}
                  <button
                    type="button"
                    className={primaryButton}
                    disabled={!canStart}
                    onClick={() => go(1)}
                  >
                    {checking && isConfigured ? (
                      <>
                        <LoaderCircle
                          aria-hidden="true"
                          className="size-4 animate-spin motion-reduce:animate-none"
                        />
                        Sprawdzanie konta...
                      </>
                    ) : (
                      <>
                        Poznajmy się
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-center text-sm text-[#9690a7]">
                    Jeszcze tylko nick. Bez zbędnych formalności.
                  </p>
                </>
              )}
              {step === 1 && (
                <>
                  <span className="mb-5 inline-grid size-14 place-items-center rounded-2xl border border-[#a58fe9]/30 bg-[#a58fe9]/10 text-[#c3aff7]">
                    <UserRound aria-hidden="true" className="size-7" />
                  </span>
                  <h1
                    ref={focusStepHeading}
                    tabIndex={-1}
                    className="text-3xl leading-tight font-semibold tracking-tight outline-none sm:text-4xl"
                  >
                    Jak mówi na Ciebie ekipa?
                  </h1>
                  <p className="mt-4 text-base leading-relaxed text-muted">
                    Imię, pseudonim, ksywka. Wybierz nazwę, po której inni Cię
                    rozpoznają.
                  </p>
                  <form onSubmit={submit} className="mt-7">
                    <label
                      htmlFor="onboarding-name"
                      className="mb-2 flex items-center justify-between gap-2 text-sm font-medium text-[#d3cbe2]"
                    >
                      Twój nick
                      <span
                        aria-hidden="true"
                        className="text-sm font-normal text-muted"
                      >
                        {name.length}/40
                      </span>
                    </label>
                    <input
                      id="onboarding-name"
                      required
                      minLength={1}
                      maxLength={40}
                      autoComplete="nickname"
                      aria-describedby="onboarding-name-help"
                      placeholder="np. Miłosz"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={busy}
                      className="min-h-13 w-full rounded-xl border border-[#454157] bg-[#0e141f] px-4 py-3 text-base leading-relaxed font-medium text-[#f0e9fc] transition-colors placeholder:text-[#7e899e] focus-visible:border-[#b49be9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 motion-reduce:transition-none"
                    />
                    <p
                      id="onboarding-name-help"
                      className="mt-2 text-sm leading-relaxed text-muted"
                    >
                      Nick możesz później zmienić w ustawieniach konta.
                    </p>
                    <div className="my-6 rounded-2xl border border-[#3c354e] bg-[#a58fe9]/5 p-4">
                      <p className="mb-4 text-sm text-[#a79abf]">
                        Tak zobaczy Cię Twoja ekipa
                      </p>
                      <div className="flex items-center gap-3">
                        <motion.span
                          animate={
                            reduced
                              ? undefined
                              : { scale: name.trim() ? 1 : 0.92 }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 250,
                            damping: 18,
                          }}
                          className="grid size-13 shrink-0 place-items-center rounded-2xl border border-[#a58fe9]/35 bg-linear-to-br from-[#b79be8]/25 to-[#6e5b99]/20 text-lg font-medium text-[#d8c7f5]"
                        >
                          {name.trim().slice(0, 2).toUpperCase() || "TY"}
                        </motion.span>
                        <div className="min-w-0">
                          <p className="text-base font-medium wrap-anywhere text-[#e4d9f5]">
                            {name.trim() || "Tutaj pojawi się Twój nick"}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#9ac6af]">
                            <Circle
                              aria-hidden="true"
                              className="size-1.5 shrink-0 fill-current text-[#8ed9bc]"
                            />
                            Gotowość na dobry plan
                          </p>
                        </div>
                      </div>
                    </div>
                    {error && (
                      <p
                        role="alert"
                        className="mb-4 rounded-xl border border-[#b96b6b55] bg-[#b96b6b12] p-3 text-sm leading-relaxed text-[#f0b2b2]"
                      >
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      className={primaryButton}
                      disabled={!canStart || !name.trim() || busy}
                    >
                      {busy ? (
                        <>
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin motion-reduce:animate-none"
                          />
                          Zapisywanie profilu...
                        </>
                      ) : (
                        <>
                          To ja. Zaczynamy!
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </>
                      )}
                    </button>
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        className={subtleButton}
                        disabled={busy}
                        onClick={() => go(0)}
                      >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Wróć do wprowadzenia
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 2 && (
                <>
                  <div
                    aria-hidden="true"
                    className="relative mx-auto mb-6 flex size-34 items-center justify-center"
                  >
                    {confetti.map((className, index) => (
                      <motion.span
                        key={className}
                        initial={
                          reduced
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0, y: 18, rotate: -45 }
                        }
                        animate={
                          reduced
                            ? { opacity: 0.7, scale: 1, y: 0, rotate: 0 }
                            : {
                                opacity: [0, 1, 0.7],
                                scale: 1,
                                y: 0,
                                rotate: index % 2 ? 35 : -20,
                              }
                        }
                        transition={{
                          duration: reduced ? 0 : 0.7,
                          delay: reduced ? 0 : 0.1 + index * 0.05,
                        }}
                        className={`absolute size-2.5 rounded-xs ${className}`}
                      />
                    ))}
                    <motion.span
                      initial={reduced ? false : { scale: 0.5, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 12,
                      }}
                      className="grid size-23 place-items-center rounded-full border border-[#8ed9bc]/35 bg-[#8ed9bc]/10 shadow-[0_0_45px_#8ed9bc10]"
                    >
                      <Check
                        aria-hidden="true"
                        className="size-10 text-[#a5e1c7]"
                      />
                    </motion.span>
                  </div>
                  <h1
                    ref={focusStepHeading}
                    tabIndex={-1}
                    className="text-center text-3xl leading-tight font-semibold tracking-tight wrap-anywhere outline-none sm:text-4xl"
                  >
                    Gotowe, {name.trim()}.
                  </h1>
                  <p className="mt-4 text-center text-base leading-relaxed text-muted">
                    Twój profil już jest. Teraz znajdźcie czas na to, co chcecie
                    zrobić razem.
                  </p>
                  <div className="my-7 space-y-3 rounded-2xl border border-[#333d47] bg-[#101a22] p-4">
                    <p className="flex items-center gap-3 text-sm text-[#d4e0d8]">
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[#8ed9bc]"
                      />
                      Profil zapisany i gotowy do działania
                    </p>
                    <p className="flex items-center gap-3 text-sm text-[#b8bdcc]">
                      <Users
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[#bfa8f1]"
                      />
                      Twoja ekipa rozpozna Cię po nicku
                    </p>
                    <p className="flex items-center gap-3 text-sm text-[#b8bdcc]">
                      <Bell
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[#bfa8f1]"
                      />
                      Nowe ustalenia znajdziesz w powiadomieniach
                    </p>
                  </div>
                  <Link href={next} className={primaryButton}>
                    {invitation
                      ? groupInvitation
                        ? "Otwórz zaproszenie do grupy"
                        : "Otwórz zaproszenie na spotkanie"
                      : next === "/new"
                        ? "Zaplanuj pierwsze spotkanie"
                        : "Wejdź do swojej przestrzeni"}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                  </Link>
                  {!invitation && next !== "/new" && (
                    <div className="mt-3 flex justify-center">
                      <Link href="/new" className={subtleButton}>
                        Utwórz pierwsze spotkanie
                      </Link>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
          {error && step === 0 && (
            <div className="mt-4">
              <p
                role="alert"
                className="mb-3 text-sm leading-relaxed text-[#f0b2b2]"
              >
                {error}
              </p>
              <button
                type="button"
                className={subtleButton}
                onClick={() => {
                  setError("");
                  setChecking(true);
                  setAttempt((value) => value + 1);
                }}
              >
                Spróbuj ponownie
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
