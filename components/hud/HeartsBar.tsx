import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeartsBar({ hearts }: { hearts: number }) {
  return (
    <>
      {/* Compact form for narrow screens: single icon + count. */}
      <div
        className="flex items-center gap-1 rounded-full bg-alert/10 px-2 py-1 sm:hidden"
        aria-label={`${hearts} vidas restantes`}
      >
        <Heart size={16} className="fill-alert text-alert" />
        <span className="text-sm font-extrabold text-ink">{hearts}</span>
      </div>
      {/* Full hearts row for sm+. */}
      <div
        className="hidden items-center gap-1 sm:flex"
        aria-label={`${hearts} vidas restantes`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Heart
            key={i}
            size={20}
            className={cn(
              "transition-colors",
              i < hearts ? "fill-alert text-alert" : "text-cloud-deep",
            )}
          />
        ))}
      </div>
    </>
  );
}
