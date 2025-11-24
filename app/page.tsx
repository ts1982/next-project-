import { Button } from "@/components/ui/button"
import { BarChart, Users, FileText, TrendingUp } from "lucide-react"

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">アプリケーションの概要を確認できます</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">総ユーザー数</p>
              <h3 className="text-2xl font-bold">2,543</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="text-green-600">+12%</span> 前月比
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">アクティブ率</p>
              <h3 className="text-2xl font-bold">68.2%</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="text-green-600">+5.2%</span> 前月比
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">投稿数</p>
              <h3 className="text-2xl font-bold">12,847</h3>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="text-green-600">+18%</span> 前月比
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">分析データ</p>
              <h3 className="text-2xl font-bold">94.5%</h3>
            </div>
            <BarChart className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="text-green-600">+2.1%</span> 前月比
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold mb-4">最近のアクティビティ</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 border-b pb-4 last:border-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">新しいユーザーが登録しました</p>
                  <p className="text-xs text-muted-foreground">{i}時間前</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-4">クイックアクション</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              新規ユーザー追加
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              レポート作成
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              分析を表示
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
