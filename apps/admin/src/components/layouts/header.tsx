"use client";

import { useEffect, useState } from "react";
import { Menu, Search, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { data: session } = useSession();
  // Radix(Dialog/Sheet)はSSR時にIDがズレてhydration mismatchになることがあるため、
  // マウント後にのみ描画して初期HTMLとクライアント初期描画を一致させる。
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration mismatch回避の定番パターン
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-accent"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">管理コンソール</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="flex h-9 w-9 rounded-lg hover:bg-accent"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex h-9 w-9 rounded-lg hover:bg-accent relative"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="mx-2 hidden sm:block h-6 w-px bg-border" />
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={session?.user?.image || undefined}
                      alt={session?.user?.name || "User"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-lg">ユーザーメニュー</SheetTitle>
                  <SheetDescription asChild>
                    <div className="mt-1 rounded-lg bg-muted/50 p-3">
                      {session?.user?.name && (
                        <span className="block text-sm font-medium text-foreground">
                          {session.user.name}
                        </span>
                      )}
                      {session?.user?.email && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {session.user.email}
                        </span>
                      )}
                    </div>
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <Link href="/dashboard/settings">
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-lg hover:bg-accent"
                    >
                      <User className="mr-3 h-4 w-4 text-muted-foreground" />
                      設定
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    ログアウト
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
              aria-label="ユーザーメニュー"
              disabled
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
