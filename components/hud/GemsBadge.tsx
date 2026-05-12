import Link from "next/link";
import { Gem } from "lucide-react";

export function GemsBadge({ gems, href = "/shop" }: { gems: number; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${gems} gems`}
      className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2.5 py-1 text-xs font-extrabold text-sky-deep hover:bg-sky/15"
    >
      <Gem size={14} className="text-sky" />
      {gems}
    </Link>
  );
}
