import { Suspense } from "react"
import { Users, TrendingUp, UserPlus } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function getDashboardStats() {
  const [totalUsers, recentUsers] = await Promise.all([
    prisma.admin.count(),
    prisma.admin.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
  ])

  // 今月の新規ユーザー数を計算
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newUsersThisMonth = await prisma.admin.count({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
  })

  return {
    totalUsers,
    newUsersThisMonth,
    recentUsers,
  }
}

function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 w-10 bg-muted rounded-lg" />
      </div>
      <div className="h-8 w-20 bg-muted rounded mb-1" />
      <div className="h-3 w-32 bg-muted rounded" />
    </div>
  )
}

async function DashboardStats() {
  const stats = await getDashboardStats()

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-0 shadow-md shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">総ユーザー数</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.totalUsers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              登録済みユーザーの総数
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md shadow-chart-2/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今月の新規登録</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
              <UserPlus className="h-5 w-5 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.newUsersThisMonth}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              今月登録されたユーザー
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md shadow-chart-3/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">アクティブ率</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
              <TrendingUp className="h-5 w-5 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">-</div>
            <p className="mt-1 text-xs text-muted-foreground">
              準備中
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">最近登録されたユーザー</CardTitle>
          <CardDescription>直近5名の登録ユーザー</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {stats.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="mt-1 text-sm text-muted-foreground">アプリケーションの概要を確認できます</p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        }
      >
        <DashboardStats />
      </Suspense>
    </div>
  )
}

export default DashboardPage
