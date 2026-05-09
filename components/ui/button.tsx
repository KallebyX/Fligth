import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold uppercase tracking-wide transition-transform active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        primary: "bg-sky text-white shadow-pop hover:brightness-105",
        secondary: "bg-grass text-white shadow-pop hover:brightness-105",
        warn: "bg-sun text-white shadow-pop hover:brightness-105",
        danger: "bg-alert text-white shadow-pop hover:brightness-105",
        ghost: "text-ink/80 hover:bg-cloud",
        outline: "border-2 border-cloud-deep bg-white text-ink hover:bg-cloud shadow-pop",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
