"use client"

import { useEffect, useState } from "react"
import { Menu, Search, Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

interface HeaderProps {
  onMenuClick: () => void
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { data: session } = useSession()
  // Radix(Dialog/Sheet)はSSR時にIDがズレてhydration mismatchになることがあるため、
  // マウント後にのみ描画して初期HTMLとクライアント初期描画を一致させる。
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint (react-hooks/set-state-in-effect) 対策: effect内で同期的にsetStateせず、
    // マイクロタスクに逃がして初回レンダーの安定性を優先する。
    Promise.resolve().then(() => setMounted(true))
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
            <span className="font-semibold text-xl hidden sm:inline-block">Next App</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Bell className="h-5 w-5" />
          </Button>
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>ユーザーメニュー</SheetTitle>
                  <SheetDescription>
                    {session?.user?.name && (
                      <span className="block mt-2 text-sm">
                        ログイン中: {session.user.name}
                      </span>
                    )}
                    {session?.user?.email && (
                      <span className="block text-xs text-muted-foreground">
                        {session.user.email}
                      </span>
                    )}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Link href="/dashboard/settings">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      設定
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full"
              aria-label="ユーザーメニュー"
              disabled
            >
              <Avatar>
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
