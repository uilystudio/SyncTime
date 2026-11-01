"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | undefined;
let sessionPromise: Promise<string> | undefined;
export const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export function getSupabase() {
  if (!isConfigured) throw new Error("Brak konfiguracji Supabase. Uzupełnij plik .env.local według README.");
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  return client;
}
export function ensureSession(): Promise<string> {
  sessionPromise ??= (async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session.user.id;
    throw new Error("Zaloguj się, aby kontynuować.");
  })().finally(() => { sessionPromise = undefined; });
  return sessionPromise;
}
export function errorMessage(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Nie udało się połączyć. Spróbuj ponownie.";
  if (/invalid login credentials/i.test(message)) return "Niepoprawny e-mail lub hasło.";
  if (/email not confirmed/i.test(message)) return "Potwierdź adres e-mail linkiem otrzymanym przy rejestracji.";
  if (/email rate limit/i.test(message)) return "Limit wiadomości został osiągnięty. Spróbuj później.";
  return message;
}
