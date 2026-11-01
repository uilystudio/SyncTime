"use client";
import { useRef, useState } from "react";
import { InlineSeparator } from "./inline-separator";
import {
  ExternalLink,
  LoaderCircle,
  MessageSquare,
  Pencil,
  Pin,
  PinOff,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { addComment, deleteComment, editComment, pinComment } from "@/lib/api";
import { commentParts } from "@/lib/comment-text";
import { errorMessage } from "@/lib/supabase";
import { localTime } from "@/lib/time";
import type { MeetingComment } from "@/lib/types";
import { useComments } from "@/hooks/use-comments";
import { Dialog } from "./ui";

const button =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
const primary =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-violet-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
const textarea =
  "min-h-28 w-full resize-y rounded-lg border border-border bg-background px-3 py-3 text-base leading-relaxed text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

export function MeetingComments({
  meetingId,
  userId,
  organizerId,
  timezone,
}: {
  meetingId: string;
  userId: string;
  organizerId: string;
  timezone: string;
}) {
  const {
    data,
    error: loadError,
    refreshing,
    refresh,
    loadOlder,
  } = useComments(meetingId);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<{
    comment: MeetingComment;
    body: string;
  } | null>(null);
  const [removing, setRemoving] = useState<MeetingComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestId = useRef<string | null>(null);
  const organizer = userId === organizerId;

  async function mutate(
    action: () => Promise<unknown>,
    success: string,
    after?: () => void,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      after?.();
      setNotice(success);
      await refresh();
    } catch (e) {
      const message = errorMessage(e);
      setError(
        message.replace(/^COMMENT_CHANGED:\s*/, "") +
          (/COMMENT_CHANGED/.test(message) && editing
            ? " Anuluj edycję i otwórz komentarz ponownie."
            : ""),
      );
      if (/COMMENT_CHANGED/.test(message)) await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    requestId.current ??= crypto.randomUUID();
    const id = requestId.current;
    await mutate(
      () => addComment(meetingId, id, body.trim()),
      "Komentarz został dodany.",
      () => {
        setBody("");
        requestId.current = null;
      },
    );
  }
  function renderComment(comment: MeetingComment) {
    const own = comment.user_id === userId;
    return (
      <article
        key={comment.id}
        aria-label={`Komentarz: ${comment.display_name}`}
        className="min-w-0 rounded-xl border border-border bg-background/30 p-4 data-[pinned=true]:border-primary/40 data-[pinned=true]:bg-primary/5"
        data-pinned={comment.is_pinned}
      >
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 text-sm">
            <strong className="font-medium wrap-anywhere text-foreground">
              {comment.display_name}
              {own && <span className="font-normal text-muted"> (Ty)</span>}
            </strong>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
              <time dateTime={comment.created_at} title={timezone}>
                {localTime(comment.created_at, timezone, "d MMM yyyy, HH:mm")}
              </time>
              {comment.edited_at && (
                <span
                  title={localTime(
                    comment.edited_at,
                    timezone,
                    "d MMM yyyy, HH:mm",
                  )}
                >
                  Edytowano
                </span>
              )}
              {comment.is_pinned && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Pin aria-hidden="true" className="size-3.5" /> Przypięty
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {organizer && (
              <button
                className={button}
                disabled={busy}
                onClick={() =>
                  void mutate(
                    () =>
                      pinComment(
                        meetingId,
                        comment.id,
                        !comment.is_pinned,
                        comment.revision,
                      ),
                    comment.is_pinned
                      ? "Komentarz został odpięty."
                      : "Komentarz został przypięty.",
                  )
                }
              >
                {comment.is_pinned ? (
                  <PinOff aria-hidden="true" className="size-4" />
                ) : (
                  <Pin aria-hidden="true" className="size-4" />
                )}
                {comment.is_pinned ? "Odepnij" : "Przypnij"}
              </button>
            )}
            {own && (
              <button
                className={button}
                disabled={busy}
                onClick={() => {
                  setEditing({ comment, body: comment.body });
                  setError("");
                }}
              >
                <Pencil aria-hidden="true" className="size-4" /> Edytuj
              </button>
            )}
            {(own || organizer) && (
              <button
                className={button}
                disabled={busy}
                onClick={() => {
                  setRemoving(comment);
                  setError("");
                }}
              >
                <Trash2 aria-hidden="true" className="size-4" /> Usuń
              </button>
            )}
          </div>
        </header>
        {editing?.comment.id === comment.id ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing.body.trim() || busy) return;
              void mutate(
                () =>
                  editComment(
                    meetingId,
                    comment.id,
                    editing.body.trim(),
                    editing.comment.revision,
                  ),
                "Zmiany komentarza zostały zapisane.",
                () => setEditing(null),
              );
            }}
          >
            <label className="flex flex-col gap-2 text-sm text-foreground">
              Edytuj komentarz
              <textarea
                className={textarea}
                maxLength={2000}
                required
                value={editing.body}
                disabled={busy}
                onChange={(e) =>
                  setEditing({ ...editing, body: e.target.value })
                }
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <span className="mr-auto text-sm text-muted">
                {editing.body.length}/2000
              </span>
              <button
                type="button"
                className={button}
                disabled={busy}
                onClick={() => {
                  setEditing(null);
                  setError("");
                }}
              >
                Anuluj edycję
              </button>
              <button
                type="submit"
                className={primary}
                disabled={busy || !editing.body.trim()}
              >
                Zapisz komentarz
              </button>
            </div>
          </form>
        ) : (
          <p className="m-0 text-base leading-relaxed wrap-anywhere whitespace-pre-wrap text-foreground">
            {commentParts(comment.body).map((part, i) =>
              part.href ? (
                <a
                  key={i}
                  className="rounded-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  href={part.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  {part.text}
                  <ExternalLink
                    aria-hidden="true"
                    className="ml-1 inline size-3.5"
                  />
                  <span className="sr-only"> (otwiera się w nowej karcie)</span>
                </a>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </p>
        )}
      </article>
    );
  }

  return (
    <section
      aria-labelledby="meeting-comments-heading"
      className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            id="meeting-comments-heading"
            className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-foreground"
          >
            <MessageSquare aria-hidden="true" className="size-5 text-primary" />{" "}
            Komentarze{" "}
            {data && (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-sm font-medium text-muted">
                {data.total}
              </span>
            )}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Ustalenia, pytania i linki dla uczestników spotkania. Organizator
            może przypiąć jedną ważną wiadomość.
          </p>
        </div>
        <button
          className={button}
          aria-label="Odśwież komentarze"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-4 shrink-0 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
          />
        </button>
      </header>
      {loadError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300/30 bg-red-300/5 p-3 text-sm text-red-200"
        >
          Nie udało się odświeżyć komentarzy: {loadError}
          <button className={button} onClick={() => void refresh()}>
            Spróbuj ponownie
          </button>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-300/30 bg-red-300/5 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      <p role="status" className="text-sm text-success">
        {notice}
      </p>
      {!data && !loadError && (
        <p role="status" className="py-4 text-sm text-muted">
          Wczytywanie komentarzy…
        </p>
      )}
      {data?.pinned && (
        <div aria-label="Przypięty komentarz" className="mb-5">
          {renderComment(data.pinned)}
        </div>
      )}
      {data?.has_more && (
        <button
          className={`${button} mb-3 w-full border border-border`}
          disabled={refreshing}
          onClick={() => void loadOlder()}
        >
          {refreshing ? "Wczytywanie…" : "Pokaż starsze komentarze"}
        </button>
      )}
      {data?.total === 0 && (
        <div className="mb-5 rounded-lg border border-dashed border-border p-5 text-sm leading-relaxed text-muted">
          Jeszcze bez komentarzy. Dodaj pierwsze ustalenia albo zadaj pytanie.
        </div>
      )}
      <div className="grid gap-3">
        {data?.items
          .filter((comment) => comment.id !== data.pinned?.id)
          .map(renderComment)}
      </div>
      <form onSubmit={send} className="mt-5 border-t border-border pt-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          Dodaj komentarz
          <textarea
            className={textarea}
            placeholder="np. Przygotujmy po jednym pomyśle. Link do rozmowy: https://…"
            value={body}
            maxLength={2000}
            required
            disabled={busy}
            onChange={(e) => {
              setBody(e.target.value);
              requestId.current = null;
            }}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {body.length}/2000 <InlineSeparator /> Widoczne dla uczestników
          </span>
          <button
            className={primary}
            type="submit"
            disabled={busy || !body.trim()}
          >
            {busy ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Send aria-hidden="true" className="size-4" />
            )}{" "}
            Dodaj komentarz
          </button>
        </div>
      </form>
      {removing && (
        <Dialog
          title="Usunąć komentarz?"
          onClose={() => {
            if (!busy) setRemoving(null);
          }}
        >
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Komentarz autora {removing.display_name} zostanie usunięty ze
            spotkania.{" "}
            {removing.is_pinned && "Usunięcie wyłączy również przypięcie."}
          </p>
          <blockquote className="mb-5 max-h-48 overflow-auto rounded-lg border border-border bg-background p-3 text-sm wrap-anywhere whitespace-pre-wrap text-foreground">
            {removing.body}
          </blockquote>
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-200">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className={button}
              disabled={busy}
              onClick={() => setRemoving(null)}
            >
              Anuluj
            </button>
            <button
              className={primary}
              disabled={busy}
              onClick={() =>
                void mutate(
                  () =>
                    deleteComment(meetingId, removing.id, removing.revision),
                  "Komentarz został usunięty.",
                  () => {
                    if (editing?.comment.id === removing.id) setEditing(null);
                    setRemoving(null);
                  },
                )
              }
            >
              Usuń komentarz
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
