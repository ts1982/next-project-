import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leading, trailing, ...props }, ref) => {
    if (leading || trailing) {
      return (
        <div className={cn("relative w-full", className)}>
          {leading && (
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
              {leading}
            </span>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-card text-foreground shadow-xs",
              "px-3 py-1 text-sm transition-all outline-none",
              "placeholder:text-muted-foreground",
              "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leading && "pl-8",
              trailing && "pr-8",
            )}
            {...props}
          />
          {trailing && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
              {trailing}
            </span>
          )}
        </div>
      );
    }
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-card text-foreground shadow-xs",
          "px-3 py-1 text-sm transition-all outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
