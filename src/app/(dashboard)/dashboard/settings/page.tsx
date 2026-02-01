"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { useRouter } from "next/navigation";

const SettingsPage = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [timezone, setTimezone] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      setTimezone(session.user.timezone || "");
    }
  }, [session]);

  const handleTimezoneUpdate = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone }),
      });

      if (!response.ok) {
        throw new Error("タイムゾーンの更新に失敗しました");
      }

      // セッションを更新（新しいタイムゾーンを渡す）
      await update({
        user: {
          ...session.user,
          timezone: timezone,
        },
      });
      
      setMessage({ type: "success", text: "タイムゾーンを更新しました" });
      
      // 少し待ってからリフレッシュ（セッション更新を確実にする）
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Error updating timezone:", error);
      setMessage({ type: "error", text: "タイムゾーンの更新に失敗しました" });
    } finally {
      setIsLoading(false);
    }
  };

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
              ユーザー情報を確認できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">名前</label>
              <p className="text-sm text-muted-foreground">{session?.user?.name || "未設定"}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">メールアドレス</label>
              <p className="text-sm text-muted-foreground">{session?.user?.email || "未設定"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>タイムゾーン設定</CardTitle>
            <CardDescription>
              日時表示のタイムゾーンを設定します
              {timezone && (
                <span className="block mt-2 font-medium text-foreground">
                  現在の設定: {timezone}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="timezone" className="text-sm font-medium">
                タイムゾーン
              </label>
              <TimezoneSelect
                value={timezone}
                onChange={setTimezone}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                選択したタイムゾーンで日時が表示されます
              </p>
            </div>
            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}
            <Button
              onClick={handleTimezoneUpdate}
              disabled={isLoading || !timezone}
            >
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;