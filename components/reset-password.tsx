"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, LoaderCircle } from "lucide-react";
import { errorMessage, getSupabase, isConfigured } from "@/lib/supabase";
export function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isConfigured) return;
    const supabase = getSupabase();
    let live = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (live) setReady(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setReady(Boolean(session)),
    );
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) {
      setError(errorMessage(error));
      setBusy(false);
    } else router.push("/meetings");
  }
  return (
    <main className="m-auto max-w-122.5 px-5.5 pt-12.5 pb-15 max-[720px]:px-5 max-[720px]:pt-8.75 max-[720px]:pb-15">
      <div className="auth-card rounded-[13px] border border-solid border-border bg-surface p-8.5 max-[720px]:px-5.75 max-[720px]:py-7 [&_.eyebrow]:text-sm [&_form>.text-button]:mt-3.75 [&_form>.text-button]:w-full [&_form>.text-button]:justify-center [&_h1]:mx-0 [&_h1]:mt-3.5 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:leading-[1.3] [&_h1]:tracking-tight max-[720px]:[&_h1]:text-3xl [&>p]:mb-6.25 [&>p]:text-sm">
        <span className="large-icon mb-6.5 grid size-13.75 place-items-center rounded-[15px] border border-solid border-[#9e86ef30] bg-[#9e86ef12] text-[#b5a1ef]">
          <LockKeyhole className="shrink-0" size={26} aria-hidden="true" />
        </span>
        <h1 className="m-0 font-semibold tracking-tight">Nowy początek.</h1>
        <p className="m-0 leading-relaxed text-muted">
          Ustaw nowe hasło do swojego konta.
        </p>
        {ready ? (
          <form onSubmit={submit}>
            <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
              <span>Nowe hasło</span>
              <input
                className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
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
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle
                  size={16}
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <ArrowRight className="shrink-0" size={16} aria-hidden="true" />
              )}{" "}
              Zapisz hasło
            </button>
          </form>
        ) : (
          <p className="m-0 leading-relaxed text-muted">
            Otwórz aktualny link do zmiany hasła ze swojej skrzynki lub{" "}
            <Link
              className="text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
              href="/login"
            >
              wróć do logowania
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
