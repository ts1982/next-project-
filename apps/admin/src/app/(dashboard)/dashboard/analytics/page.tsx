export const dynamic = "force-dynamic";

import { BarChart as BarChartIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChartIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分析</h1>
          <p className="text-muted-foreground">データ分析と統計情報</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー統計</CardTitle>
            <CardDescription>
              ユーザーの登録推移と活動状況
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-75 flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">グラフを表示予定（準備中）</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>月間アクティブユーザー</CardTitle>
              <CardDescription>過去30日間のアクティブユーザー数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-2">準備中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>平均セッション時間</CardTitle>
              <CardDescription>ユーザーの平均利用時間</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-2">準備中</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
