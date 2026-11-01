"use client";
import { useState } from "react";
import { RotateCw, Users } from "lucide-react";
import { inviteGroupToMeeting, rotateMeetingInvitation } from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import { collectionClosed } from "@/lib/responses";
import type { EventSnapshot } from "@/lib/types";
import { ActionButton, ActionError } from "./collaboration-ui";
import { GroupPicker } from "./group-picker";
import { Dialog } from "./ui";

export function MeetingInvitationControls({
  snapshot,
  disabled,
  onChanged,
}: {
  snapshot: EventSnapshot;
  disabled: boolean;
  onChanged: (message: string) => Promise<void>;
}) {
  const [rotate, setRotate] = useState(false);
  const [invite, setInvite] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newToken, setNewToken] = useState("");
  async function changeLink() {
    setBusy(true);
    setError("");
    try {
      const token = await rotateMeetingInvitation(
        snapshot.event.id,
        snapshot.invitation,
      );
      setNewToken(token);
      await onChanged("Wygenerowano nowy link. Poprzedni został unieważniony.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function inviteGroup() {
    setBusy(true);
    setError("");
    try {
      const count = await inviteGroupToMeeting(snapshot.event.id, groupId);
      await onChanged(
        count
          ? `Wysłano zaproszenia w aplikacji: ${count}.`
          : "Wszyscy członkowie już należą do spotkania lub otrzymali zaproszenie.",
      );
      setInvite(false);
      window.dispatchEvent(new Event("synctime:notifications"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div
        className="mb-5 flex flex-wrap gap-2"
        aria-label="Zaproszenia do spotkania"
      >
        <ActionButton
          disabled={disabled}
          onClick={() => {
            setNewToken("");
            setError("");
            setRotate(true);
          }}
        >
          <RotateCw aria-hidden="true" className="size-4" />
          Zmień link zaproszenia
        </ActionButton>
        <ActionButton
          disabled={disabled || collectionClosed(snapshot.event)}
          onClick={() => {
            setError("");
            setInvite(true);
          }}
        >
          <Users aria-hidden="true" className="size-4" />
          Zaproś grupę
        </ActionButton>
      </div>
      {rotate && (
        <Dialog
          title={newToken ? "Nowy link zaproszenia" : "Unieważnić stary link?"}
          onClose={() => {
            if (!busy) setRotate(false);
          }}
        >
          {newToken ? (
            <>
              <p className="mb-4 text-base leading-relaxed text-muted">
                Stary link już nie działa. Skopiuj nowy i przekaż go zapraszanym
                osobom.
              </p>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Nowy link
                <input
                  className="min-h-11 w-full rounded-lg border border-[#323b4d] bg-[#0e141f] px-3 py-2 text-base leading-relaxed focus-visible:outline-2 focus-visible:outline-primary"
                  readOnly
                  value={`${window.location.origin}/e/${newToken}`}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <ActionButton
                className="mt-4"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(`${window.location.origin}/e/${newToken}`)
                    .catch(() => setError("Skopiuj link ręcznie z pola."));
                }}
              >
                Kopiuj nowy link
              </ActionButton>
            </>
          ) : (
            <>
              <p className="text-base leading-relaxed text-muted">
                Poprzedni link przestanie działać natychmiast. Obecni uczestnicy
                zachowają dostęp do spotkania. Zaproszenia wysłane grupom w
                aplikacji pozostaną ważne.
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <ActionButton disabled={busy} onClick={() => setRotate(false)}>
                  Anuluj
                </ActionButton>
                <ActionButton
                  primary
                  disabled={busy}
                  onClick={() => void changeLink()}
                >
                  Wygeneruj nowy link
                </ActionButton>
              </div>
            </>
          )}
          <ActionError>{error}</ActionError>
        </Dialog>
      )}
      {invite && (
        <Dialog
          title="Zaproś grupę do spotkania"
          onClose={() => {
            if (!busy) setInvite(false);
          }}
        >
          <GroupPicker value={groupId} onChange={setGroupId} disabled={busy} />
          <ActionError>{error}</ActionError>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ActionButton disabled={busy} onClick={() => setInvite(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              primary
              disabled={busy || !groupId}
              onClick={() => void inviteGroup()}
            >
              Wyślij zaproszenia w aplikacji
            </ActionButton>
          </div>
        </Dialog>
      )}
    </>
  );
}
