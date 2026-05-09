import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border-2 border-cloud-deep bg-white px-4 text-base text-ink placeholder:text-ink/40 focus:border-sky focus:outline-none",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
