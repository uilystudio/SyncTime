"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { errorMessage, getSupabase, isConfigured } from "@/lib/supabase";
import { getProfile, safeNext } from "@/lib/profile";
import { ConfigurationNotice, Panel } from "./ui";

export function AuthForm({
  accountDeleted = false,
}: {
  accountDeleted?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    accountDeleted
      ? "Konto zostało usunięte. Dziękujemy za wspólnie zaplanowane spotkania."
      : "",
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const next = safeNext(
      new URLSearchParams(window.location.search).get("next"),
    );
    const supabase = getSupabase();
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("Jeśli konto istnieje, otrzymasz link do zmiany hasła.");
        return;
      }
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/onboarding?next=${encodeURIComponent(next)}`,
              },
            })
          : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (!result.data.session) {
        setMessage(
          "Sprawdź skrzynkę i potwierdź adres e-mail. Następnie zaloguj się, aby wybrać nick.",
        );
        return;
      }
      const profile = await getProfile(result.data.user!.id);
      window.location.assign(
        profile ? next : `/onboarding?next=${encodeURIComponent(next)}`,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="m-auto max-w-122.5 px-5.5 pt-12.5 pb-15 max-[720px]:px-5 max-[720px]:pt-8.75 max-[720px]:pb-15">
      <Panel className="auth-card rounded-[13px] border border-solid border-border bg-surface p-8.5 max-[720px]:px-5.75 max-[720px]:py-7 [&_.eyebrow]:text-sm [&_form>.text-button]:mt-3.75 [&_form>.text-button]:w-full [&_form>.text-button]:justify-center [&_h1]:mx-0 [&_h1]:mt-3.5 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:leading-[1.3] [&_h1]:tracking-tight max-[720px]:[&_h1]:text-3xl [&>p]:mb-6.25 [&>p]:text-sm">
        <span className="large-icon mb-6.5 grid size-13.75 place-items-center rounded-[15px] border border-solid border-[#9e86ef30] bg-[#9e86ef12] text-[#b5a1ef]">
          <LockKeyhole className="shrink-0" size={26} aria-hidden="true" />
        </span>
        <span className="eyebrow flex items-center gap-2 text-sm font-semibold tracking-wider text-[#b6a5f2] max-[1000px]:text-sm max-[720px]:text-sm">
          TWÓJ CZAS, TWOJE SPOTKANIA
        </span>
        <h1 className="m-0 font-semibold tracking-tight">
          {mode === "signup"
            ? "Miło Cię tu widzieć."
            : mode === "reset"
              ? "Wróćmy do planowania."
              : "Dobrze, że jesteś."}
        </h1>
        <p className="m-0 leading-relaxed text-muted">
          {mode === "signup"
            ? "Utwórz konto, a potem wybierz swój nick. Tylko tyle."
            : mode === "reset"
              ? "Podaj adres swojego konta. Wyślemy link do zmiany hasła."
              : "Zaloguj się i znajdź wspólny czas ze swoją ekipą."}
        </p>
        {!isConfigured && <ConfigurationNotice />}
        {mode !== "reset" && (
          <div className="mx-0 my-6.25 flex gap-0.5 rounded-[7px] border border-solid border-[#262f40] bg-[#0b111b] p-0.75 [&_button]:flex [&_button]:flex-1 [&_button]:items-center [&_button]:justify-center [&_button]:gap-1.5 [&_button]:rounded-sm [&_button]:border-0 [&_button]:border-solid [&_button]:border-current [&_button]:bg-transparent [&_button]:p-2.5 [&_button]:text-sm [&_button]:whitespace-nowrap [&_button]:text-[#9aa7c0] max-[720px]:[&_button]:gap-1.25 max-[720px]:[&_button]:px-1.75 max-[720px]:[&_button]:py-2 max-[720px]:[&_button]:text-sm [&_button.active]:bg-[#292637] [&_button.active]:text-[#c6b2ff] max-[720px]:[&_button>svg]:w-3.25">
            <button
              className={
                mode === "login"
                  ? "active cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              }
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Zaloguj się
            </button>
            <button
              className={
                mode === "signup"
                  ? "active cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  : "cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
              }
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
            >
              Utwórz konto
            </button>
          </div>
        )}
        <form onSubmit={submit}>
          <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
            <span>Adres e-mail</span>
            <div className="relative [&_select]:pl-9.5 [&>svg]:pointer-events-none [&>svg]:absolute [&>svg]:top-3.5 [&>svg]:left-3.25 [&>svg]:text-[#8997b1] [.auth-card_&_input]:pl-9.5">
              <Mail className="shrink-0" size={16} aria-hidden="true" />
              <input
                className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                type="email"
                required
                autoComplete="email"
                placeholder="ty@przyklad.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>
          {mode !== "reset" && (
            <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
              <span>Hasło</span>
              <div className="relative [&_.icon-button]:absolute [&_.icon-button]:top-1.75 [&_.icon-button]:right-2 [&_input]:pr-11">
                <input
                  className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                  type={visible ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder={
                    mode === "signup" ? "Co najmniej 8 znaków" : "Twoje hasło"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                  aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? (
                    <EyeOff className="shrink-0" size={16} aria-hidden="true" />
                  ) : (
                    <Eye className="shrink-0" size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>
          )}
          {mode === "login" && (
            <button
              type="button"
              className="text-button -mt-1.5 mr-0 mb-5.5 ml-auto flex cursor-pointer items-center gap-1.25 border-0 border-solid border-current bg-transparent p-1 text-sm text-[#9ca8bf] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#cfbdf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:max-w-33.75 max-[720px]:justify-end max-[720px]:p-0 max-[720px]:text-right max-[720px]:text-sm"
              onClick={() => {
                setMode("reset");
                setError("");
                setMessage("");
              }}
            >
              Nie pamiętasz hasła?
            </button>
          )}
          {error && (
            <div
              className="mx-0 my-3.5 rounded-lg border border-solid border-[#b96b6b55] bg-[#b96b6b12] px-3.75 py-3.25 text-sm leading-relaxed text-[#f0b2b2] [&_button]:ml-2.5"
              role="alert"
            >
              {error}
            </div>
          )}
          {message && (
            <div
              className="mx-0 my-4.5 flex items-start gap-2.5 rounded-lg border border-solid border-[#75b58b55] bg-[#75b58b13] p-3.5 text-sm leading-relaxed text-[#b5d7b3] [&_svg]:mt-0.5 [&_svg]:shrink-0"
              role="status"
            >
              <Check className="shrink-0" size={17} aria-hidden="true" />
              {message}
            </div>
          )}
          <button
            className="button primary inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
            disabled={busy || !isConfigured}
          >
            {busy ? (
              <LoaderCircle
                size={17}
                className="shrink-0 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <ArrowRight className="shrink-0" size={17} aria-hidden="true" />
            )}
            {mode === "signup"
              ? "Utwórz konto"
              : mode === "reset"
                ? "Wyślij link do zmiany hasła"
                : "Zaloguj się"}
          </button>
          {mode === "reset" && (
            <button
              type="button"
              className="text-button flex cursor-pointer items-center gap-1.25 border-0 border-solid border-current bg-transparent p-1 text-sm text-[#9ca8bf] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#cfbdf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none max-[720px]:max-w-33.75 max-[720px]:justify-end max-[720px]:p-0 max-[720px]:text-right max-[720px]:text-sm"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Wróć do logowania
            </button>
          )}
        </form>
        <div className="mt-6.5 border-t [border-top-style:solid] border-t-border pt-5 text-center text-sm leading-relaxed text-[#8c99af]">
          Zaproszenia udostępniasz linkiem.
          <br />
          Nie wysyłamy e-maili do uczestników.
        </div>
      </Panel>
      <Link
        href="/"
        className="mt-5.75 block text-center text-sm text-[#9ba7bd] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
      >
        <ArrowLeft
          aria-hidden="true"
          className="mr-1.5 inline size-4 shrink-0"
        />
        Wróć do SyncTime
      </Link>
    </main>
  );
}
