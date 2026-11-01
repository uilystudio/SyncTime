"use client";
import { getSupabase } from "./supabase";

async function verifyPassword(userId: string, password: string) {
  const supabase = getSupabase();
  const { data: current, error: currentError } = await supabase.auth.getUser();
  if (currentError || !current.user?.email || current.user.id !== userId) {
    throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: current.user.email,
    password,
  });
  if (error) throw error;
  if (data.user?.id !== userId)
    throw new Error("Nie udało się potwierdzić konta.");
}

export async function changeAccountPassword(
  userId: string,
  current: string,
  password: string,
) {
  await verifyPassword(userId, current);
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) throw error;
}

export async function deleteOwnAccount(
  userId: string,
  password: string,
  confirmation: string,
) {
  if (confirmation !== "USUŃ KONTO")
    throw new Error("Wpisz dokładnie USUŃ KONTO.");
  await verifyPassword(userId, password);
  const supabase = getSupabase();
  const { error } = await supabase.rpc("delete_own_account", { confirmation });
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}
