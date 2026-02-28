"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings, Users, BarChart, X, Store, Shield, Bell, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { Resource, Action } from "@/lib/auth/permissions"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  icon: LucideIcon
  label: string
  href: string
  /** このメニューを表示するために必要なパーミッション（省略時は常に表示） */
  permission?: { resource: Resource; action: Action }
}

/** メニューをセクション分割 */
const mainMenuItems: MenuItem[] = [
  { icon: Home, label: "ダッシュボード", href: "/dashboard" },
  { icon: Bell, label: "通知管理", href: "/notifications", permission: { resource: "notifications", action: "read" } },
  { icon: Users, label: "ユーザー一覧", href: "/users", permission: { resource: "notifications", action: "read" } },
]

const managementMenuItems: MenuItem[] = [
  { icon: Users, label: "管理者管理", href: "/admins", permission: { resource: "admins", action: "read" } },
  { icon: Store, label: "店舗管理", href: "/stores", permission: { resource: "stores", action: "read" } },
  { icon: Shield, label: "ロール管理", href: "/roles", permission: { resource: "roles", action: "read" } },
]

const bottomMenuItems: MenuItem[] = [
  { icon: BarChart, label: "分析", href: "/dashboard/analytics" },
  { icon: Settings, label: "設定", href: "/dashboard/settings" },
]

function NavSection({
  label,
  items,
  pathname,
  onClose,
}: {
  label?: string
  items: MenuItem[]
  pathname: string
  onClose: () => void
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1">
      {label && (
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          {label}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-primary/15 text-sidebar-primary shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className={cn(
              "h-4.5 w-4.5 shrink-0 transition-colors",
              isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
            )} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname()
  const { can } = usePermissions()

  // パーミッションでメニューをフィルタ
  const filterItems = (items: MenuItem[]) =>
    items.filter((item) => {
      if (!item.permission) return true
      return can(item.permission.resource, item.permission.action)
    })

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 transform bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-sidebar-primary to-sidebar-primary/70 shadow-md shadow-sidebar-primary/25">
              <span className="text-base font-bold text-white">N</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">Next Admin</span>
              <span className="text-[10px] font-medium text-sidebar-foreground/40">Management Console</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6 p-4">
          <NavSection items={filterItems(mainMenuItems)} pathname={pathname} onClose={onClose} />
          <NavSection label="管理" items={filterItems(managementMenuItems)} pathname={pathname} onClose={onClose} />
          <NavSection label="その他" items={filterItems(bottomMenuItems)} pathname={pathname} onClose={onClose} />
        </nav>
      </aside>
    </>
  )
}
