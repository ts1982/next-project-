"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Settings, Users, BarChart, X, Store, Shield, Bell, Search,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/hooks/use-permissions";
import type { Resource, Action } from "@/lib/auth/permissions";

interface SidebarProps { isOpen: boolean; onClose: () => void; }
interface MenuItem {
  icon: LucideIcon; label: string; href: string;
  permission?: { resource: Resource; action: Action };
  badge?: string;
}

const mainMenuItems: MenuItem[] = [
  { icon: Home, label: "ダッシュボード", href: "/dashboard" },
  { icon: Bell, label: "通知管理", href: "/notifications", permission: { resource: "notifications", action: "read" }, badge: "3" },
  { icon: Users, label: "ユーザー一覧", href: "/users", permission: { resource: "notifications", action: "read" } },
];
const managementMenuItems: MenuItem[] = [
  { icon: Users, label: "管理者管理", href: "/admins", permission: { resource: "admins", action: "read" } },
  { icon: Store, label: "店舗管理", href: "/stores", permission: { resource: "stores", action: "read" } },
  { icon: Shield, label: "ロール管理", href: "/roles", permission: { resource: "roles", action: "read" } },
];
const bottomMenuItems: MenuItem[] = [
  { icon: BarChart, label: "分析", href: "/dashboard/analytics" },
  { icon: Settings, label: "設定", href: "/dashboard/settings" },
];

function NavSection({ label, items, pathname, onClose }: {
  label?: string; items: MenuItem[]; pathname: string; onClose: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-0.5">
      {label && (
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/45">
          {label}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-all",
              isActive
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-x-1.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
            )}
            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground/85")} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-sidebar-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-primary">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { can } = usePermissions();
  const filterItems = (items: MenuItem[]) =>
    items.filter((i) => !i.permission || can(i.permission.resource, i.permission.action));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Workspace header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3 lg:justify-start">
          <button className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1 hover:bg-sidebar-accent/60">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-sidebar-primary to-[color-mix(in_oklch,var(--sidebar-primary)_75%,black)] shadow-sm shadow-sidebar-primary/20">
              <span className="text-[12px] font-bold text-white tracking-tight">N</span>
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className="text-[13px] font-semibold leading-tight text-sidebar-foreground tracking-tight">Next Admin</span>
              <span className="text-[10px] leading-tight text-sidebar-foreground/45">Management</span>
            </div>
          </button>
          <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground/60" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3">
          <Input
            leading={<Search />}
            placeholder="検索…"
            className="h-8 bg-sidebar-accent/40 border-sidebar-border text-[12px]"
          />
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-5 p-3">
          <NavSection items={filterItems(mainMenuItems)} pathname={pathname} onClose={onClose} />
          <NavSection label="管理" items={filterItems(managementMenuItems)} pathname={pathname} onClose={onClose} />
          <div className="mt-auto">
            <NavSection label="その他" items={filterItems(bottomMenuItems)} pathname={pathname} onClose={onClose} />
          </div>
        </nav>

        {/* Footer card */}
        <div className="m-3 mt-0 rounded-md border border-sidebar-border bg-sidebar-accent/40 p-2.5">
          <div className="text-[11px] font-semibold text-sidebar-foreground tracking-tight">v2.4 リリース</div>
          <div className="mt-0.5 text-[10.5px] leading-snug text-sidebar-foreground/55">
            新しい通知ダッシュボードを試す
          </div>
          <button className="mt-1.5 text-[11px] font-medium text-sidebar-primary hover:underline">変更を確認 →</button>
        </div>
      </aside>
    </>
  );
};
