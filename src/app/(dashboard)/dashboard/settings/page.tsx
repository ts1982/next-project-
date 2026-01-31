import { Settings as SettingsIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">設定</h1>
          <p className="text-muted-foreground">アプリケーションの設定を管理します</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール設定</CardTitle>
            <CardDescription>
              ユーザー情報を更新できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                名前
              </label>
              <Input id="name" placeholder="山田 太郎" />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                メールアドレス
              </label>
              <Input id="email" type="email" placeholder="yamada@example.com" />
            </div>
            <Button>保存</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>通知設定</CardTitle>
            <CardDescription>
              通知の受信設定を変更できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">メール通知</p>
                <p className="text-sm text-muted-foreground">
                  重要な更新をメールで受け取る
                </p>
              </div>
              <Button variant="outline" size="sm">
                オン
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">プッシュ通知</p>
                <p className="text-sm text-muted-foreground">
                  ブラウザでプッシュ通知を受け取る
                </p>
              </div>
              <Button variant="outline" size="sm">
                オフ
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>セキュリティ</CardTitle>
            <CardDescription>
              パスワードとセキュリティ設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium">
                現在のパスワード
              </label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                新しいパスワード
              </label>
              <Input id="new-password" type="password" />
            </div>
            <Button>パスワードを変更</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage
