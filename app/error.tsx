"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto my-0 max-w-150 px-5.5 pt-7.5 pb-20 in-[.workspace]:pt-8">
      <div className="join-card mt-9 rounded-[13px] border border-solid border-border bg-surface p-8.75 max-[720px]:px-5.75 max-[720px]:py-7 [&_.fine-print]:mt-3.75 [&_.fine-print]:text-center [&_h1]:mx-0 [&_h1]:mt-3.5 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:leading-[1.3] [&_h1]:wrap-anywhere max-[720px]:[&_h1]:text-3xl [.join-event-page_&_.eyebrow]:text-sm [.join-event-page_&_.eyebrow]:tracking-wider">
        <h1 className="m-0 font-semibold tracking-tight">
          Coś przerwało planowanie.
        </h1>
        <p className="m-0 leading-relaxed text-muted">
          Spróbuj ponownie. Zapisane dane pozostają w bazie.
        </p>
        <button
          className="button primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-solid border-transparent bg-[#b19cfc] px-4.5 py-3 leading-5 font-medium text-[#1c1435] shadow-[0_3px_12px_#a68bea14] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:-translate-y-px hover:bg-[#c3b0ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&.small]:min-h-9.25 [&.small]:px-3.25 [&.small]:py-2 [&.small]:text-sm"
          onClick={reset}
        >
          Spróbuj ponownie
        </button>
      </div>
    </main>
  );
}
