"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Copy, Link2, Plus, RotateCw, Users } from "lucide-react";
import { joinGroup, manageGroup, previewGroup, readGroups } from "@/lib/api";
import { errorMessage } from "@/lib/supabase";
import type { GroupPreview, ParticipantGroup } from "@/lib/types";
import { useProfile } from "./profile-context";
import {
  ActionButton,
  ActionError,
  SectionCard,
  TextField,
} from "./collaboration-ui";
import { Dialog } from "./ui";
import { InlineSeparator } from "./inline-separator";

type GroupOperation = {
  group: ParticipantGroup;
  action: "rename" | "rotate" | "remove" | "leave";
  memberId?: string;
  memberName?: string;
};
export function GroupsScreen() {
  const router = useRouter();
  const profile = useProfile()!;
  const [groups, setGroups] = useState<ParticipantGroup[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState<GroupOperation | null>(null);
  const [newName, setNewName] = useState("");
  const [linkGroup, setLinkGroup] = useState<ParticipantGroup | null>(null);
  const [joinLink, setJoinLink] = useState("");
  const load = useCallback(async () => {
    setGroups(await readGroups());
  }, []);
  useEffect(() => {
    let active = true;
    void readGroups()
      .then((data) => {
        if (active) setGroups(data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await manageGroup(null, "create", name);
      setName("");
      await load();
      setMessage("Utworzono grupę. Skopiuj link i zaproś członków.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if (!operation) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await manageGroup(
        operation.group.id,
        operation.action,
        operation.action === "rename" ? newName : null,
        operation.memberId,
      );
      await load();
      setOperation(null);
      setMessage("Zapisano zmianę grupy.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function openOperation(value: GroupOperation) {
    setError("");
    setNewName(value.group.name);
    setOperation(value);
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-7">
      <h1 className="text-3xl font-semibold tracking-tight">Twoje grupy</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Zbierz stałą ekipę raz. Potem zapraszaj ją do kolejnych spotkań.
      </p>
      {!operation && <ActionError>{error}</ActionError>}
      {message && (
        <p
          role="status"
          className="my-4 text-sm leading-relaxed text-[#8ed9bc]"
        >
          {message}
        </p>
      )}
      <SectionCard
        title="Utwórz grupę"
        description="Jako właściciel zarządzasz nazwą, członkami i linkiem zaproszenia."
      >
        <form
          className="flex flex-col items-start gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => void create(e)}
        >
          <label className="flex w-full flex-1 flex-col gap-2 text-sm font-medium">
            Nazwa grupy
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              placeholder="np. Zarząd koła"
              disabled={busy}
            />
          </label>
          <ActionButton type="submit" primary disabled={busy}>
            <Plus aria-hidden="true" className="size-4" />
            Utwórz grupę
          </ActionButton>
        </form>
      </SectionCard>
      <SectionCard title="Masz zaproszenie do grupy?">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const match = joinLink
              .trim()
              .match(/(?:\/g\/)?([a-f0-9]{64})(?:[?#].*)?$/i);
            if (!match) {
              setError("Wklej poprawny link zaproszenia do grupy.");
              return;
            }
            router.push(`/g/${match[1].toLowerCase()}`);
          }}
        >
          <label className="flex flex-1 flex-col gap-2 text-sm font-medium">
            Link zaproszenia
            <TextField
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              placeholder="Wklej link grupy"
              required
            />
          </label>
          <ActionButton type="submit" className="self-end">
            <Link2 aria-hidden="true" className="size-4" />
            Otwórz zaproszenie
          </ActionButton>
        </form>
      </SectionCard>
      {groups === null && !error && (
        <p role="status" className="text-base text-muted">
          Wczytywanie grup...
        </p>
      )}
      {error && !operation && (
        <ActionButton
          onClick={() =>
            void load()
              .then(() => setError(""))
              .catch((e) => setError(errorMessage(e)))
          }
        >
          Spróbuj ponownie
        </ActionButton>
      )}
      {groups?.length === 0 && (
        <p className="py-6 text-base leading-relaxed text-muted">
          Nie należysz jeszcze do żadnej grupy. Utwórz pierwszą lub otwórz
          zaproszenie.
        </p>
      )}
      {groups?.map((group) => (
        <SectionCard
          key={group.id}
          title={group.name}
          description={
            <>
              {group.members.length} osób <InlineSeparator />{" "}
              {group.owner_id === profile.user_id
                ? "Jesteś właścicielem"
                : "Jesteś członkiem"}
            </>
          }
          actions={
            <Link
              href={`/new?group=${group.id}`}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[#cfbdff] underline underline-offset-4"
            >
              Zaplanuj spotkanie
            </Link>
          }
        >
          <ul className="divide-y divide-[#293140]">
            {group.members.map((member) => (
              <li
                key={member.user_id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2 wrap-anywhere">
                  <Users aria-hidden="true" className="size-4 shrink-0" />
                  {member.display_name}
                  {member.user_id === group.owner_id && (
                    <>
                      <InlineSeparator />
                      Właściciel
                    </>
                  )}
                  {member.user_id === profile.user_id && " (Ty)"}
                </span>
                {group.owner_id === profile.user_id &&
                  member.user_id !== profile.user_id && (
                    <ActionButton
                      disabled={busy}
                      onClick={() =>
                        openOperation({
                          group,
                          action: "remove",
                          memberId: member.user_id,
                          memberName: member.display_name,
                        })
                      }
                    >
                      Usuń z grupy
                    </ActionButton>
                  )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {group.owner_id === profile.user_id ? (
              <>
                <ActionButton
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setLinkGroup(group);
                  }}
                >
                  <Copy aria-hidden="true" className="size-4" />
                  Zaproś linkiem
                </ActionButton>
                <ActionButton
                  disabled={busy}
                  onClick={() => openOperation({ group, action: "rename" })}
                >
                  Zmień nazwę
                </ActionButton>
                <ActionButton
                  disabled={busy}
                  onClick={() => openOperation({ group, action: "rotate" })}
                >
                  <RotateCw aria-hidden="true" className="size-4" />
                  Zmień link
                </ActionButton>
              </>
            ) : (
              <ActionButton
                disabled={busy}
                onClick={() => openOperation({ group, action: "leave" })}
              >
                Opuść grupę
              </ActionButton>
            )}
          </div>
        </SectionCard>
      ))}
      {linkGroup && (
        <Dialog
          title={`Zaproś do grupy ${linkGroup.name}`}
          onClose={() => setLinkGroup(null)}
        >
          <p className="mb-4 text-base leading-relaxed text-muted">
            Każdy posiadacz linku może dołączyć po zalogowaniu. Link udostępnia
            właściciel.
          </p>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Link grupy
            <TextField
              readOnly
              value={`${window.location.origin}/g/${linkGroup.token}`}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <ActionButton
            className="mt-4"
            onClick={() => {
              void navigator.clipboard
                .writeText(`${window.location.origin}/g/${linkGroup.token}`)
                .then(() => setMessage("Skopiowano link grupy."))
                .catch(() => setError("Skopiuj link ręcznie z pola."));
            }}
          >
            Kopiuj link
          </ActionButton>
          <ActionError>{error}</ActionError>
        </Dialog>
      )}
      {operation && (
        <Dialog
          title={
            operation.action === "rename"
              ? "Zmień nazwę grupy"
              : operation.action === "rotate"
                ? "Wygenerować nowy link grupy?"
                : operation.action === "leave"
                  ? "Opuścić grupę?"
                  : "Usunąć członka grupy?"
          }
          onClose={() => {
            if (!busy) {
              setOperation(null);
              setError("");
            }
          }}
        >
          {operation.action === "rename" ? (
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nowa nazwa
              <TextField
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                minLength={2}
                maxLength={80}
                disabled={busy}
              />
            </label>
          ) : (
            <p className="text-base leading-relaxed text-muted">
              {operation.action === "rotate"
                ? "Stary link przestanie działać. Dotychczasowi członkowie zachowają dostęp."
                : operation.action === "leave"
                  ? "Nie będziesz otrzymywać zaproszeń do nowych spotkań tej grupy. Zachowasz dostęp do spotkań, do których już dołączyłeś."
                  : `${operation.memberName} straci dostęp do grupy. Wcześniejsze zaproszenia i członkostwo w spotkaniach pozostaną ważne.`}
            </p>
          )}
          <ActionError>{error}</ActionError>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ActionButton
              disabled={busy}
              onClick={() => {
                setOperation(null);
                setError("");
              }}
            >
              Anuluj
            </ActionButton>
            <ActionButton
              primary
              disabled={
                busy ||
                (operation.action === "rename" && newName.trim().length < 2)
              }
              onClick={() => void apply()}
            >
              {busy ? "Zapisywanie..." : "Potwierdź"}
            </ActionButton>
          </div>
        </Dialog>
      )}
    </main>
  );
}

export function GroupInvitation({ token }: { token: string }) {
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setPreview(await previewGroup(token));
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [token]);
  useEffect(() => {
    let active = true;
    void previewGroup(token)
      .then((data) => {
        if (active) setPreview(data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function accept() {
    setBusy(true);
    setError("");
    try {
      await joinGroup(token);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <SectionCard
        title={preview?.name ?? "Zaproszenie do grupy"}
        description={
          preview ? `${preview.member_count} osób w grupie` : undefined
        }
      >
        <ActionError>{error}</ActionError>
        {!preview && !error && <p role="status">Wczytywanie zaproszenia...</p>}
        {preview && (
          <>
            <p className="mb-5 text-base leading-relaxed text-muted">
              {preview.joined
                ? "Należysz już do tej grupy. Nowe zaproszenia do spotkań znajdziesz w powiadomieniach."
                : "Dołączając, udostępnisz członkom grupy swój nick i będziesz otrzymywać zaproszenia do spotkań. Każde z nich przyjmujesz osobno."}
            </p>
            {preview.joined ? (
              <Link
                className="text-sm font-medium text-[#cfbdff] underline underline-offset-4"
                href="/groups"
              >
                Otwórz moje grupy
              </Link>
            ) : (
              <ActionButton
                primary
                disabled={busy}
                onClick={() => void accept()}
              >
                Dołącz do grupy
              </ActionButton>
            )}
          </>
        )}
        {error && (
          <ActionButton onClick={() => void load()}>
            Sprawdź ponownie
          </ActionButton>
        )}
      </SectionCard>
    </main>
  );
}
