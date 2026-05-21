import Link from "next/link";
import { Gem } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function GemsBadge({ gems, href = "/shop/outfits" }: { gems: number; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${gems} gems`}
      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-cloud dark:focus-visible:ring-offset-ink-deep"
    >
      <Badge tone="sky" size="md" className="hover:bg-sky/15 dark:hover:bg-sky/30">
        <Gem size={13} aria-hidden className="shrink-0 text-sky dark:text-sky-soft" />
        <span>{gems.toLocaleString("pt-BR")}</span>
      </Badge>
    </Link>
  );
}
