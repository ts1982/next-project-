"use client";

import { useEffect, useState } from "react";
import { Menu, User, LogOut, Sun, Moon, Bell, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface HeaderProps { onMenuClick: () => void; }

const titleMap: Record<string, string> = {
  "/dashboard": "ダッシュボード",
  "/notifications": "通知管理",
  "/users": "ユーザー一覧",
  "/admins": "管理者管理",
  "/stores": "店舗管理",
  "/roles": "ロール管理",
  "/dashboard/analytics": "分析",
  "/dashboard/settings": "設定",
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark, mounted]);

  const handleLogout = async () => { await signOut({ callbackUrl: "/login" }); };
  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || "U";
  const title = titleMap[pathname] || "管理コンソール";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="hidden lg:flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">管理</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-semibold text-foreground tracking-tight">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Cmd-K search */}
          <button className="hidden md:flex items-center gap-2 h-8 rounded-md border border-border bg-card px-2.5 text-[12px] text-muted-foreground hover:border-foreground/20 transition-colors">
            <Command className="h-3.5 w-3.5" />
            <span>検索</span>
            <kbd className="ml-2 rounded border border-border bg-muted px-1 py-px text-[10px] font-mono">⌘K</kbd>
          </button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark((d) => !d)} aria-label="theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>

          <div className="mx-1.5 hidden sm:block h-5 w-px bg-border" />

          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full ring-1 ring-border hover:ring-primary/30">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[12px] font-semibold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-base tracking-tight">アカウント</SheetTitle>
                  <SheetDescription asChild>
                    <div className="mt-1 rounded-md border border-border bg-muted/40 p-3">
                      {session?.user?.name && (
                        <span className="block text-[13px] font-semibold text-foreground tracking-tight">{session.user.name}</span>
                      )}
                      {session?.user?.email && (
                        <span className="block text-[12px] text-muted-foreground mt-0.5">{session.user.email}</span>
                      )}
                    </div>
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-5 space-y-1">
                  <Link href="/dashboard/settings">
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />設定
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />ログアウト
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full" disabled aria-label="user">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-muted-foreground text-[12px]">U</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
