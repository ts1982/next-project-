"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Left — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[color-mix(in_oklch,var(--primary)_70%,black)] shadow-md shadow-primary/20">
              <span className="text-base font-bold text-white tracking-tight">N</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold tracking-tight">Next Admin</span>
              <span className="text-[11px] text-muted-foreground">Management Console</span>
            </div>
          </div>

          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] leading-tight">
            おかえりなさい
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            アカウントにサインインして続行します
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground/80">メールアドレス</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leading={<Mail />}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-foreground/80">パスワード</label>
                <button type="button" className="text-[11.5px] font-medium text-primary hover:underline">
                  忘れた場合
                </button>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leading={<Lock />}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/8 px-3 py-2 text-[12px] text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "サインイン中…" : "サインイン"}
            </Button>
          </form>

          <p className="mt-6 text-[11.5px] text-muted-foreground text-center">
            アクセスに問題がある場合は管理者にお問い合わせください
          </p>
        </div>
      </div>

      {/* Right — visual panel */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.97_0.012_245)] lg:block dark:bg-[oklch(0.20_0.025_250)]">
        <div className="absolute inset-0 [background:radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_55%),radial-gradient(circle_at_75%_80%,color-mix(in_oklch,var(--chart-2)_18%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px] opacity-40" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            すべてのシステムが稼働中
          </div>

          {/* Floating preview cards */}
          <div className="space-y-3 max-w-[420px]">
            <Card className="p-4 shadow-md shadow-primary/5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M3 12 L9 18 L21 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold tracking-tight">通知が送信されました</div>
                  <div className="text-[11px] text-muted-foreground">2,431 ユーザーに配信</div>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground">2分前</div>
              </div>
            </Card>
            <Card className="p-4 ml-8 shadow-md shadow-primary/5 backdrop-blur">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">今週のアクティブユーザー</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-[28px] font-semibold tracking-tight">12,489</span>
                <span className="text-[11px] font-medium text-success">+8.2%</span>
              </div>
              <div className="mt-2 flex h-12 items-end gap-1">
                {[40, 55, 35, 60, 45, 70, 65, 85, 75, 90].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-primary/30" style={{ height: `${h}%` }} />
                ))}
              </div>
            </Card>
          </div>

          <div className="text-[11px] text-muted-foreground">
            © 2026 Next Admin. すべての権利を保有します。
          </div>
        </div>
      </div>
    </div>
  );
}
