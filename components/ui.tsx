"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          className="fixed bottom-6.25 left-1/2 z-100 flex w-max max-w-[calc(100%-30px)] -translate-x-1/2 items-center gap-3 rounded-[10px] border border-solid border-[#57634d] bg-[#233229] px-4.5 py-3.75 text-sm text-[#d4e6ca] shadow-[0_10px_40px_#0006] [&>button]:ml-2 [&>button]:flex [&>button]:border-0 [&>button]:border-solid [&>button]:border-current [&>button]:bg-transparent [&>button]:text-[#a8b9a7] [&>svg]:shrink-0 [&>svg]:text-[#a2d997]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Check className="shrink-0" size={17} aria-hidden="true" />
          {message}
          <button
            className="cursor-pointer text-inherit transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            aria-label="Zamknij powiadomienie"
            onClick={onClose}
          >
            <X className="shrink-0" size={16} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const headingId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-136 overflow-y-auto overscroll-contain rounded-[15px] border border-solid border-[#3d455a] bg-[#171e2b] p-6.75 text-[#e5eaf5] shadow-[0_30px_100px_#0007] backdrop:bg-[#060b17bb] backdrop:backdrop-blur-[5px] max-[720px]:p-6 [&>p]:mb-5.5 [&>p]:text-sm"
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < bounds.left ||
          e.clientX > bounds.right ||
          e.clientY < bounds.top ||
          e.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-2.5 [&_h2]:text-xl max-[720px]:[&_h2]:text-lg">
        <h2 className="m-0 font-semibold tracking-tight" id={headingId}>
          {title}
        </h2>
        <button
          type="button"
          className="icon-button inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          aria-label="Zamknij"
          onClick={onClose}
        >
          <X className="shrink-0" size={19} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfigurationNotice() {
  return (
    <div
      className="mx-0 my-3.5 rounded-lg border border-solid border-[#bca35f55] bg-[#bca35f0c] px-3.75 py-3.25 text-sm leading-relaxed text-[#e2c889] [&_p]:mt-1.25 [&_p]:text-sm [&_p]:text-[#bcb39c]"
      role="status"
    >
      <strong>Połącz swoją bazę Supabase</strong>
      <p className="m-0 leading-relaxed text-muted">
        Aby tworzyć spotkania i trwale zapisywać dostępność, dodaj adres
        projektu i klucz publiczny do <code>.env.local</code>, wykonaj migrację
        SQL i włącz logowanie e-mailem. Dokładne kroki znajdziesz w README
        projektu.
      </p>
    </div>
  );
}
