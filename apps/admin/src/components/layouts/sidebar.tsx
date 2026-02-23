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

const menuItems: MenuItem[] = [
  { icon: Home, label: "ダッシュボード", href: "/dashboard" },
  { icon: Bell, label: "通知管理", href: "/notifications", permission: { resource: "notifications", action: "read" } },
  { icon: Users, label: "ユーザー一覧", href: "/users", permission: { resource: "notifications", action: "read" } },
  { icon: Users, label: "管理者管理", href: "/admins", permission: { resource: "admins", action: "read" } },
  { icon: Store, label: "店舗管理", href: "/stores", permission: { resource: "stores", action: "read" } },
  { icon: Shield, label: "ロール管理", href: "/roles", permission: { resource: "roles", action: "read" } },
  { icon: BarChart, label: "分析", href: "/dashboard/analytics" },
  { icon: Settings, label: "設定", href: "/dashboard/settings" },
]

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname()
  const { can } = usePermissions()

  // パーミッションでメニューをフィルタ
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true
    return can(item.permission.resource, item.permission.action)
  })

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 transform border-r bg-background transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4 lg:justify-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
            <span className="font-semibold text-xl">Next App</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-2 p-4">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
