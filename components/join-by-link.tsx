"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";
import { invitationToken } from "@/lib/invitations";
import { Dialog } from "./ui";
export function JoinByLink({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = invitationToken(link);
    if (!token) {
      setError("Wklej pełny link zaproszenia od organizatora.");
      return;
    }
    setOpen(false);
    setLink("");
    setError("");
    router.push(`/e/${token}`);
  }
  return (
    <>
      <button
        type="button"
        className={`button secondary join-by-link-trigger inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-4.5 py-3 leading-5 font-medium text-[#d2d7e4] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm ${compact ? "small compact" : ""}`}
        aria-label="Dołącz do spotkania przez link"
        onClick={() => setOpen(true)}
      >
        <Link2 className="shrink-0" size={15} aria-hidden="true" />
        <span>{compact ? "Dołącz przez link" : "Dołącz do spotkania"}</span>
      </button>
      {open && (
        <Dialog
          title="Masz link do spotkania?"
          onClose={() => {
            setOpen(false);
            setError("");
          }}
        >
          <p className="m-0 leading-relaxed text-muted">
            Wklej zaproszenie od organizatora. Najpierw zobaczysz szczegóły
            spotkania, a potem dołączysz i wybierzesz godziny w kalendarzu.
          </p>
          <form onSubmit={submit}>
            <label className="field mb-5 flex flex-col gap-2.25 text-sm text-[#c1c8d9] [&_small]:ml-1.25 [&_small]:text-sm [&_small]:font-normal [&_small]:text-[#7d89a0]">
              <span>Link zaproszenia</span>
              <input
                className="min-h-10.75 w-full rounded-[7px] border border-solid border-[#323b4d] bg-[#0e141f] px-3.25 py-3 text-base text-[#e5e9f4] [-webkit-tap-highlight-color:transparent] placeholder:text-[#7e899e] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary aria-invalid:border-[#f29a9a]"
                autoFocus
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError("");
                }}
                placeholder="https://…/e/…"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "join-link-error" : undefined}
              />
            </label>
            {error && (
              <p
                className="m-0 text-sm leading-normal text-[#f1a3a3] [.join-strip_form>&]:absolute [.join-strip_form>&]:top-full [.join-strip_form>&]:text-sm"
                id="join-link-error"
                role="alert"
              >
                {error}
              </p>
            )}
            <button className="button primary inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm">
              Zobacz spotkanie{" "}
              <ArrowRight className="shrink-0" size={15} aria-hidden="true" />
            </button>
          </form>
        </Dialog>
      )}
    </>
  );
}
