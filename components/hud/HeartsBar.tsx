import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeartsBar({ hearts }: { hearts: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${hearts} vidas restantes`}>
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
  );
}
