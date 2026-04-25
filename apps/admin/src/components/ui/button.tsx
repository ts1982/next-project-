"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/index";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium tracking-[-0.005em] " +
    "transition-all duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "active:scale-[0.98] " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-110 " +
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.10)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:brightness-110",
        outline:
          "border border-border bg-card text-foreground shadow-xs hover:bg-muted hover:border-foreground/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 rounded-[6px] px-2.5 text-xs",
        lg: "h-10 rounded-md px-4 text-[14px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
