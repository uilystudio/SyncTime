"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Circle } from "lucide-react";
import { AuthNav } from "./auth-nav";
import { Brand } from "./brand";
export function AppHeader() {
  const path = usePathname();
  if (
    [
      "/calendar",
      "/meetings",
      "/meeting",
      "/e",
      "/new",
      "/settings",
      "/attention",
    ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  )
    return null;
  return (
    <header className="m-auto flex h-22.75 w-full max-w-425 items-center justify-between border-b [border-bottom-style:solid] border-b-[#202631] px-[5.6%] py-0 max-[720px]:h-18.75 max-[720px]:px-[6%] max-[720px]:py-0 max-[720px]:[&_.button]:min-h-8.5 max-[720px]:[&_.button]:gap-1.5 max-[720px]:[&_.button]:px-2.5 max-[720px]:[&_.button]:py-1.75 max-[720px]:[&_.button]:text-sm [&_nav]:flex [&_nav]:items-center [&_nav]:gap-8.75 max-[720px]:[&_nav]:gap-3.25">
      <Brand />
      <nav aria-label="Menu główne">
        <span className="flex items-center gap-2 text-sm text-[#a1a8b9] max-[1000px]:hidden">
          <Circle
            aria-hidden="true"
            className="status-dot inline-block size-1.5 shrink-0 fill-success text-success"
          />{" "}
          Mniej ustalania. Więcej spotkań.
        </span>
        <AuthNav />
        <Link
          className="button small secondary inline-flex min-h-9.25 items-center justify-center gap-2.5 rounded-[9px] border border-solid border-[#303646] bg-[#181e2b] px-3.25 py-2 text-sm leading-5 font-medium text-[#d2d7e4] no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] hover:border-[#48516a] hover:bg-[#242b3b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none"
          href="/new"
          aria-label="Nowe spotkanie"
        >
          <span className="max-[580px]:hidden">Nowe spotkanie</span>{" "}
          <ArrowUpRight className="shrink-0" size={15} aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}
