"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "@/lib/supabase";
export function AuthNav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isConfigured) return;
    const supabase = getSupabase();
    let live = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (live) setLoggedIn(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setLoggedIn(Boolean(session)),
    );
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  async function signOut() {
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      setError("Nie udało się wylogować. Spróbuj ponownie.");
      return;
    }
    router.push("/");
  }
  return (
    <div className="auth-nav flex items-center gap-2 max-[720px]:[&_.icon-button]:size-9">
      {loggedIn ? (
        <>
          <Link
            href="/meetings"
            className="flex items-center gap-1.75 text-sm whitespace-nowrap text-[#bac3d5] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#c5b1ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none max-[720px]:in-[.auth-nav]:text-sm max-[720px]:[.auth-nav_&>span]:hidden"
          >
            <UserRound className="shrink-0" size={15} aria-hidden="true" />
            <span>Moje spotkania</span>
          </Link>
          <button
            className="icon-button inline-flex size-9 cursor-pointer items-center justify-center rounded-md border-0 border-solid border-current bg-transparent text-[#a9b4c9] transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:bg-[#293244] hover:text-[#e4e8f1] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            aria-label="Wyloguj się"
            onClick={() => void signOut()}
          >
            <LogOut className="shrink-0" size={16} aria-hidden="true" />
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-1.75 text-sm whitespace-nowrap text-[#bac3d5] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:text-[#c5b1ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none max-[720px]:in-[.auth-nav]:text-sm max-[720px]:[.auth-nav_&>span]:hidden"
        >
          Zaloguj się
        </Link>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
