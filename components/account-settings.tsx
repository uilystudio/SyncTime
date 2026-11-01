"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { changeAccountPassword, deleteOwnAccount } from "@/lib/account";
import {
  profileTimezones,
  saveProfile,
  type ProfileDetails,
} from "@/lib/profile";
import { errorMessage, getSupabase } from "@/lib/supabase";
import {
  ActionButton,
  ActionError,
  SectionCard,
  SelectField,
  TextField,
} from "./collaboration-ui";
import { useProfileContext } from "./profile-context";
import { Dialog } from "./ui";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-[#c1c8d9]">
      <span>{label}</span>
      {children}
      {hint && (
        <span className="text-sm leading-relaxed font-normal text-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label}>
      <span className="relative block">
        <TextField
          aria-label={label}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12"
          required
        />
        <button
          type="button"
          aria-label={`${visible ? "Ukryj" : "Pokaż"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </span>
    </Field>
  );
}

export function AccountSettings() {
  const context = useProfileContext();
  const extendedSettings = typeof context?.profile.timezone === "string";
  const router = useRouter();
  const [name, setName] = useState(context?.profile.display_name ?? "");
  const [details, setDetails] = useState<ProfileDetails>({
    full_name: context?.profile.full_name ?? "",
    organization: context?.profile.organization ?? "",
    timezone: context?.profile.timezone ?? "Europe/Warsaw",
  });
  const [account, setAccount] = useState<{
    email: string;
    createdAt: string;
  } | null>(null);
  const [accountError, setAccountError] = useState("");
  const [busy, setBusy] = useState<"profile" | "password" | "delete" | null>(
    null,
  );
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;
    void getSupabase()
      .auth.getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data.user?.email)
          setAccountError(
            "Nie udało się wczytać danych konta. Odśwież stronę lub zaloguj się ponownie.",
          );
        else
          setAccount({
            email: data.user.email,
            createdAt: data.user.created_at,
          });
      })
      .catch(() => {
        if (active)
          setAccountError(
            "Nie udało się połączyć. Odśwież stronę i spróbuj ponownie.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  function updateDetails(key: keyof ProfileDetails, value: string) {
    setDetails((previous) => ({ ...previous, [key]: value }));
    setProfileSaved(false);
    setProfileError("");
  }
  const dirty =
    name.trim() !== context?.profile.display_name ||
    details.full_name.trim() !== (context?.profile.full_name ?? "") ||
    details.organization.trim() !== (context?.profile.organization ?? "") ||
    details.timezone !== (context?.profile.timezone ?? "Europe/Warsaw");

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!context || busy) return;
    setProfileError("");
    setProfileSaved(false);
    if (!name.trim()) {
      setProfileError("Podaj nick, pod którym dołączysz do spotkań.");
      return;
    }
    setBusy("profile");
    try {
      await saveProfile(
        context.profile.user_id,
        name,
        extendedSettings ? details : undefined,
      );
      context.update({
        ...context.profile,
        display_name: name.trim(),
        ...(extendedSettings
          ? {
              ...details,
              full_name: details.full_name.trim(),
              organization: details.organization.trim(),
            }
          : {}),
      });
      setProfileSaved(true);
    } catch (error) {
      setProfileError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!context || busy) return;
    setPasswordSaved(false);
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Nowe hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    if (newPassword !== repeatPassword) {
      setPasswordError("Nowe hasła nie są takie same.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Wybierz hasło inne niż obecne.");
      return;
    }
    setBusy("password");
    try {
      await changeAccountPassword(
        context.profile.user_id,
        currentPassword,
        newPassword,
      );
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setPasswordSaved(true);
    } catch (error) {
      setPasswordError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function submitDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!context || busy || confirmation !== "USUŃ KONTO") return;
    setBusy("delete");
    setDeleteError("");
    try {
      await deleteOwnAccount(
        context.profile.user_id,
        deletePassword,
        confirmation,
      );
      router.replace("/login?deleted=1");
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  function closeDelete() {
    if (busy === "delete") return;
    setDeleting(false);
    setDeletePassword("");
    setConfirmation("");
    setDeleteError("");
  }

  return (
    <main className="mx-auto max-w-230 px-8 py-9 max-[580px]:px-4 max-[580px]:py-6">
      <header className="mb-8">
        <p className="mb-3 text-sm font-medium tracking-wider text-[#b6a5f2]">
          TWOJA PRZESTRZEŃ
        </p>
        <h1 className="text-4xl font-semibold tracking-tight max-[580px]:text-3xl">
          Ustawienia konta.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Twój profil, codzienne preferencje i bezpieczeństwo w jednym miejscu.
        </p>
      </header>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-xl font-semibold tracking-tight text-primary"
          aria-hidden="true"
        >
          {(context?.profile.display_name || "?").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight wrap-anywhere">
            {context?.profile.display_name || "Twój profil"}
          </h2>
          <p className="mt-1 text-sm wrap-anywhere text-muted">
            {account?.email || "Wczytywanie danych konta…"}
          </p>
          {account?.createdAt && (
            <p className="mt-1 text-sm text-muted">
              Konto od{" "}
              {new Date(account.createdAt).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
      <ActionError>{accountError}</ActionError>

      <SectionCard
        title="Twój profil"
        description="Wybierz, jak się przedstawiasz. Imię i organizacja są opcjonalne i pozostają prywatne."
      >
        <form onSubmit={submitProfile}>
          <fieldset disabled={Boolean(busy)} className="space-y-5">
            <legend className="sr-only">Dane profilu</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Twój nick"
                hint="Domyślna nazwa przy nowych spotkaniach. W istniejących zachowasz dotychczasowy nick."
              >
                <TextField
                  aria-label="Twój nick"
                  autoComplete="nickname"
                  maxLength={40}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setProfileSaved(false);
                    setProfileError("");
                  }}
                  required
                />
              </Field>
              <Field
                label="Imię i nazwisko"
                hint="Tylko do Twojego profilu. Nie zastępuje nicku."
              >
                <TextField
                  aria-label="Imię i nazwisko"
                  autoComplete="name"
                  disabled={!extendedSettings}
                  maxLength={100}
                  value={details.full_name}
                  onChange={(e) => updateDetails("full_name", e.target.value)}
                  placeholder="np. Aleksandra Nowak"
                />
              </Field>
            </div>
            <Field label="Organizacja lub koło naukowe">
              <TextField
                aria-label="Organizacja lub koło naukowe"
                autoComplete="organization"
                disabled={!extendedSettings}
                maxLength={120}
                value={details.organization}
                onChange={(e) => updateDetails("organization", e.target.value)}
                placeholder="np. Koło Naukowe Informatyków"
              />
            </Field>
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Globe2
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                Twoja strefa czasowa
              </p>
              <Field
                label="Domyślna strefa czasowa"
                hint="Użyjemy jej przy tworzeniu nowych spotkań i otwieraniu Twojego kalendarza. Istniejące spotkania zachowają swoją strefę."
              >
                <SelectField
                  aria-label="Domyślna strefa czasowa"
                  disabled={!extendedSettings}
                  value={details.timezone}
                  onChange={(e) => updateDetails("timezone", e.target.value)}
                >
                  {Array.from(
                    new Set([details.timezone, ...profileTimezones]),
                  ).map((zone) => (
                    <option key={zone}>{zone}</option>
                  ))}
                </SelectField>
              </Field>
            </div>
            {!extendedSettings && (
              <p role="status" className="text-sm leading-relaxed text-muted">
                Odśwież stronę, aby wczytać dodatkowe ustawienia profilu.
              </p>
            )}
            <ActionError>{profileError}</ActionError>
            <div className="flex flex-wrap items-center gap-4">
              <ActionButton
                type="submit"
                primary
                disabled={!dirty || !name.trim()}
              >
                {busy === "profile" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                )}
                {busy === "profile" ? "Zapisywanie…" : "Zapisz profil"}
              </ActionButton>
              {profileSaved && (
                <p
                  role="status"
                  className="flex items-center gap-2 text-sm text-success"
                >
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  Zapisano profil
                </p>
              )}
            </div>
          </fieldset>
        </form>
      </SectionCard>

      <SectionCard
        title="Logowanie i bezpieczeństwo"
        description="Zmień hasło bez wychodzenia z konta. Potwierdzimy zmianę Twoim obecnym hasłem."
      >
        <div className="mb-6">
          <Field
            label="Adres e-mail"
            hint="Adres używany do logowania i odzyskiwania hasła."
          >
            <span className="relative block">
              <Mail
                aria-hidden="true"
                className="absolute top-3.5 left-3 size-4 text-muted"
              />
              <TextField
                aria-label="Adres e-mail"
                type="email"
                value={account?.email ?? ""}
                readOnly
                className="pl-10 text-muted"
              />
            </span>
          </Field>
        </div>
        <form onSubmit={submitPassword}>
          <fieldset disabled={Boolean(busy) || !account} className="space-y-5">
            <legend className="sr-only">Zmiana hasła</legend>
            <PasswordField
              label="Obecne hasło"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(value) => {
                setCurrentPassword(value);
                setPasswordSaved(false);
                setPasswordError("");
              }}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <PasswordField
                label="Nowe hasło"
                autoComplete="new-password"
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value);
                  setPasswordSaved(false);
                  setPasswordError("");
                }}
              />
              <PasswordField
                label="Powtórz nowe hasło"
                autoComplete="new-password"
                value={repeatPassword}
                onChange={(value) => {
                  setRepeatPassword(value);
                  setPasswordSaved(false);
                  setPasswordError("");
                }}
              />
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Użyj co najmniej 8 znaków. Wybierz hasło, którego nie używasz w
              innych serwisach.
            </p>
            <ActionError>{passwordError}</ActionError>
            <div className="flex flex-wrap items-center gap-4">
              <ActionButton
                type="submit"
                disabled={!currentPassword || !newPassword || !repeatPassword}
              >
                {busy === "password" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <LockKeyhole aria-hidden="true" className="size-4 shrink-0" />
                )}
                {busy === "password" ? "Zmienianie hasła…" : "Zmień hasło"}
              </ActionButton>
              {passwordSaved && (
                <p
                  role="status"
                  className="flex items-center gap-2 text-sm text-success"
                >
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                  Hasło zostało zmienione
                </p>
              )}
            </div>
          </fieldset>
        </form>
      </SectionCard>

      <section
        className="rounded-xl border border-red-300/25 bg-red-300/5 p-5 sm:p-6"
        aria-labelledby="delete-account-heading"
      >
        <h2
          id="delete-account-heading"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <Trash2 aria-hidden="true" className="size-5 shrink-0 text-red-300" />
          Usunięcie konta
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Usunięcie jest trwałe. Zniknie Twój profil, odpowiedzi i komentarze
          oraz wszystkie spotkania i grupy, których jesteś właścicielem.
        </p>
        <button
          type="button"
          disabled={Boolean(busy) || !account || !extendedSettings}
          onClick={() => setDeleting(true)}
          className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-300/40 bg-transparent px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" className="size-4 shrink-0" />
          Usuń konto
        </button>
        {!extendedSettings && (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Odśwież stronę, aby włączyć usuwanie konta.
          </p>
        )}
      </section>
      <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-muted">
        <ShieldCheck
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 text-success"
        />
        Twój e-mail i dodatkowe dane profilu pozostają prywatne. Uczestnicy
        wspólnych spotkań widzą Twój nick i odpowiedzi.
      </p>

      {deleting && (
        <Dialog title="Usunąć Twoje konto?" onClose={closeDelete}>
          <p className="leading-relaxed text-muted">
            Tej operacji nie można cofnąć. Zanim potwierdzisz, upewnij się, że
            pozostali uczestnicy wiedzą o usunięciu Twoich spotkań.
          </p>
          <ul className="mb-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>Usuniemy konto, profil, Twoje odpowiedzi i komentarze.</li>
            <li>
              Usuniemy wszystkie organizowane przez Ciebie spotkania i należące
              do Ciebie grupy, także u pozostałych członków.
            </li>
            <li>
              Spotkania innych organizatorów pozostaną. Przypisane Ci w nich
              zadania zostaną bez przypisania.
            </li>
            <li>Wszystkie Twoje sesje zostaną unieważnione.</li>
          </ul>
          <form onSubmit={submitDelete}>
            <fieldset disabled={busy === "delete"} className="space-y-5">
              <legend className="sr-only">Potwierdzenie usunięcia konta</legend>
              <PasswordField
                label="Hasło do konta"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(value) => {
                  setDeletePassword(value);
                  setDeleteError("");
                }}
              />
              <Field label="Wpisz USUŃ KONTO, aby potwierdzić">
                <TextField
                  aria-label="Wpisz USUŃ KONTO, aby potwierdzić"
                  value={confirmation}
                  onChange={(e) => {
                    setConfirmation(e.target.value);
                    setDeleteError("");
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </Field>
              <ActionError>{deleteError}</ActionError>
              <div className="flex flex-wrap justify-end gap-3 max-[480px]:flex-col">
                <ActionButton onClick={closeDelete}>
                  Zachowaj konto
                </ActionButton>
                <button
                  type="submit"
                  disabled={confirmation !== "USUŃ KONTO" || !deletePassword}
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-300/40 bg-red-300/15 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-300/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === "delete" ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
                    />
                  ) : (
                    <Trash2 aria-hidden="true" className="size-4 shrink-0" />
                  )}
                  {busy === "delete"
                    ? "Usuwanie konta…"
                    : "Usuń konto na zawsze"}
                </button>
              </div>
            </fieldset>
          </form>
        </Dialog>
      )}
    </main>
  );
}
