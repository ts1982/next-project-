"use client";

import { ArrowUpRight, ArrowDownRight, Users, Bell, Store, Activity, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/charts/sparkline";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";

const stats = [
  { label: "総ユーザー数", value: "12,489", delta: 8.2, up: true, icon: Users, spark: [10, 12, 11, 14, 13, 18, 17, 22, 25, 28, 32, 35] },
  { label: "アクティブ通知", value: "47", delta: 12.4, up: true, icon: Bell, spark: [4, 6, 5, 8, 7, 10, 12, 14, 16, 18, 17, 20] },
  { label: "登録店舗", value: "238", delta: -1.8, up: false, icon: Store, spark: [30, 28, 32, 30, 28, 26, 28, 27, 25, 24, 25, 23] },
  { label: "応答率", value: "94.2%", delta: 2.1, up: true, icon: Activity, spark: [80, 82, 85, 84, 88, 90, 89, 91, 92, 93, 94, 94] },
];

const series = Array.from({ length: 30 }).map((_, i) => ({
  label: `${i + 1}`,
  v: Math.round(800 + Math.sin(i / 3) * 220 + i * 12 + (Math.random() * 60)),
}));

const channels = [
  { label: "Web", v: 4280 },
  { label: "iOS", v: 3120 },
  { label: "Android", v: 2890 },
  { label: "Email", v: 1450 },
  { label: "API", v: 760 },
];

const recent = [
  { name: "佐藤 由美", email: "yumi.sato@example.jp", role: "店舗管理者", status: "active", joined: "2分前" },
  { name: "高橋 健", email: "ken.t@example.jp", role: "閲覧者", status: "active", joined: "12分前" },
  { name: "田中 美咲", email: "misaki@example.jp", role: "管理者", status: "pending", joined: "1時間前" },
  { name: "山本 直樹", email: "naoki.y@example.jp", role: "店舗管理者", status: "active", joined: "3時間前" },
  { name: "鈴木 慶子", email: "keiko@example.jp", role: "閲覧者", status: "inactive", joined: "本日" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6 sm:p-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] leading-tight">
            ダッシュボード
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            管理コンソールの概要 — 過去30日間のアクティビティ
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm">CSV エクスポート</Button>
          <Button size="sm">通知を作成</Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} interactive>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant={s.up ? "success" : "destructive"} className="gap-0.5">
                    {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(s.delta)}%
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className="mt-0.5 font-display text-[24px] font-semibold tracking-[-0.02em] leading-none">{s.value}</div>
                  </div>
                  <Sparkline data={s.spark} width={88} height={32} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>通知配信数</CardTitle>
              <CardDescription>過去30日</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {["7D", "30D", "90D"].map((t, i) => (
                <button
                  key={t}
                  className={
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors " +
                    (i === 1 ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <AreaChart data={series} height={220} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>チャネル別配信</CardTitle>
            <CardDescription>今週の合計</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={channels} height={180} />
            <div className="mt-3 space-y-1.5">
              {channels.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-mono font-medium tabular-nums">{c.v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>最近のユーザー</CardTitle>
            <CardDescription>直近の登録</CardDescription>
          </div>
          <Button variant="ghost" size="sm">すべて表示</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recent.map((u) => (
              <div key={u.email} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[12px] font-semibold text-primary">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium tracking-tight truncate">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                </div>
                <Badge variant="default" className="hidden sm:inline-flex">{u.role}</Badge>
                <Badge
                  variant={u.status === "active" ? "success" : u.status === "pending" ? "warn" : "default"}
                >
                  {u.status === "active" ? "有効" : u.status === "pending" ? "保留" : "無効"}
                </Badge>
                <span className="hidden md:inline text-[11px] text-muted-foreground tabular-nums">{u.joined}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
