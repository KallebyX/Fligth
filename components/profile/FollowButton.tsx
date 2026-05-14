"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/app/actions/follow";
import { impact, notify } from "@/lib/haptics";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

export function FollowButton({
  targetId,
  initialFollowing,
  followsYou,
  size = "md",
  className,
}: {
  targetId: string;
  initialFollowing: boolean;
  followsYou?: boolean;
  size?: Size;
  className?: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next); // optimistic
    void impact("light");
    start(async () => {
      const res = next
        ? await followUser(targetId)
        : await unfollowUser(targetId);
      if (!res.ok) {
        // revert
        setFollowing(!next);
        void notify("error");
        return;
      }
      void notify(next ? "success" : "warning");
    });
  }

  if (following) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn("min-w-[120px]", className)}
        onClick={toggle}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <UserCheck size={16} />
        )}
        Seguindo
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="primary"
      className={cn("min-w-[120px]", className)}
      onClick={toggle}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <UserPlus size={16} />
      )}
      {followsYou ? "Seguir de volta" : "Seguir"}
    </Button>
  );
}
