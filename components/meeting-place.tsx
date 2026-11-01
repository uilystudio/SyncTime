import { ExternalLink, MapPin, Video } from "lucide-react";
import { meetingUrl } from "@/lib/meeting-place";
import type { MeetingPlaceInput } from "@/lib/types";

export function MeetingPlace({
  place,
  interactive = true,
}: {
  place: MeetingPlaceInput;
  interactive?: boolean;
}) {
  const mode = place.meeting_mode ?? "undecided";
  if (mode === "undecided") return null;
  const location = place.meeting_location ?? "";
  const href = mode === "online" ? meetingUrl(location) : null;
  const Icon = mode === "online" ? Video : MapPin;
  return (
    <div className="my-3 flex min-w-0 items-start gap-2 text-sm leading-relaxed text-foreground">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <div className="min-w-0">
        <span className="block font-medium">
          {mode === "online" ? "Spotkanie online" : "Stacjonarnie"}
        </span>
        {href && interactive ? (
          <a
            className="inline-flex max-w-full items-start gap-1.5 rounded-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            <span className="wrap-anywhere">{location}</span>
            <ExternalLink
              aria-hidden="true"
              className="mt-1 size-3.5 shrink-0"
            />
            <span className="sr-only"> (otwiera się w nowej karcie)</span>
          </a>
        ) : (
          <span
            className={
              interactive
                ? "block wrap-anywhere text-muted"
                : "line-clamp-2 wrap-anywhere text-muted"
            }
            title={location}
          >
            {location || "Miejsce do ustalenia"}
          </span>
        )}
      </div>
    </div>
  );
}
