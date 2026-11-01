import Link from "next/link";
import { CalendarDays } from "lucide-react";
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="brand flex items-center text-3xl font-semibold tracking-tight text-inherit no-underline transition-[background,border-color,color,transform,translate] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary motion-reduce:transition-none max-[720px]:text-2xl"
      aria-label="SyncTime - strona główna"
    >
      <span className="mr-2.75 grid h-9 w-8.5 -rotate-5 place-items-center rounded-[10px] bg-[#a08af2] text-[#17112e] max-[720px]:mr-2 max-[720px]:h-7.75 max-[720px]:w-7.5 max-[720px]:[&>svg]:size-4.75">
        <CalendarDays
          className="shrink-0"
          size={21}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </span>
      sync<span className="font-normal text-[#c3c8d5]">time</span>
      <span className="text-primary">.</span>
    </Link>
  );
}
