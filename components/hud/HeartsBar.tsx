import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function HeartsBar({ hearts }: { hearts: number }) {
  return (
    <>
      {/* Compact form for narrow screens: single icon + count, same height
          as the other HUD chips so the row stays perfectly aligned. */}
      <Badge
        tone="alert"
        size="md"
        className="sm:hidden"
        aria-label={`${hearts} vidas restantes`}
      >
        <Heart size={13} aria-hidden className="shrink-0 fill-alert text-alert" />
        <span className="text-ink dark:text-cloud">{hearts}</span>
      </Badge>

      {/* Full hearts row for sm+ — same vertical center as Badge chips. */}
      <div
        className="hidden h-7 items-center gap-1 sm:flex"
        aria-label={`${hearts} vidas restantes`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Heart
            key={i}
            size={18}
            aria-hidden
            className={cn(
              "transition-colors",
              i < hearts
                ? "fill-alert text-alert"
                : "text-cloud-deep dark:text-ink-light",
            )}
          />
        ))}
      </div>
    </>
  );
}
