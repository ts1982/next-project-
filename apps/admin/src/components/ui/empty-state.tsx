import * as React from "react";
import { Inbox, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type EmptyKind = "inbox" | "users" | "search";

const Illus = ({ kind }: { kind: EmptyKind }) => {
  if (kind === "inbox") {
    return (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
        <rect x="18" y="30" width="84" height="68" rx="10" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M18 64 L42 64 L50 74 L70 74 L78 64 L102 64" stroke="var(--border)" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <rect x="34" y="20" width="52" height="3.5" rx="2" fill="var(--border)" />
        <circle cx="60" cy="50" r="3" fill="var(--primary)" opacity="0.45" />
      </svg>
    );
  }
  if (kind === "users") {
    return (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
        <circle cx="60" cy="46" r="16" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M30 96 Q30 74 60 74 Q90 74 90 96" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="40" r="10" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />
        <circle cx="84" cy="40" r="10" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />
        <circle cx="60" cy="46" r="4" fill="var(--primary)" opacity="0.4" />
      </svg>
    );
  }
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
      <circle cx="52" cy="52" r="26" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M72 72 L92 92" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="52" cy="52" r="10" fill="var(--primary)" opacity="0.18" />
    </svg>
  );
};

interface EmptyStateProps {
  kind?: EmptyKind;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; icon?: React.ReactNode };
  className?: string;
}

export function EmptyState({ kind = "inbox", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-12", className)}>
      <Illus kind={kind} />
      <div className="mt-3 text-base font-semibold tracking-tight">{title}</div>
      {description && (
        <div className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</div>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-5">
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
}
