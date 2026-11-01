import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function DisclosureSummary({
  children,
  icon,
  className = "",
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <summary
      className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden ${className}`}
    >
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none [[open]>summary>&]:rotate-90"
      />
      {icon}
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        {children}
      </span>
    </summary>
  );
}
