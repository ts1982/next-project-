import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/index";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-[-0.005em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-muted-foreground",
        primary:
          "border-transparent bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        success:
          "border-transparent bg-[color-mix(in_oklch,var(--success)_12%,transparent)] text-[color:var(--success)]",
        warn:
          "border-transparent bg-[color-mix(in_oklch,var(--warn)_18%,transparent)] text-[color:color-mix(in_oklch,var(--warn)_70%,var(--foreground))]",
        destructive:
          "border-transparent bg-destructive/10 text-destructive",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
