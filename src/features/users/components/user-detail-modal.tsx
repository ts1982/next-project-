"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { formatDateTime } from "@/lib/utils/date-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleBadge } from "./role-badge"
import { RoleSelect } from "./role-select"
import type { User } from "../types/user.types"

interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  roleId?: string
}

interface UserDetailModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  timezone: string
}

export function UserDetailModal({ user, isOpen, onClose, timezone }: UserDetailModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("detail")
  const [formData, setFormData] = useState<UpdateUserInput>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // userが変わったら編集フォームを初期化
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        roleId: user.roleId,
      })
    }
  }, [user])

  if (!user) return null

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // 簡易バリデーション
    const fieldErrors: Record<string, string> = {}
    if (formData.name && formData.name.length < 1) {
      fieldErrors.name = "名前は必須です"
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      fieldErrors.email = "有効なメールアドレスを入力してください"
    }
    if (formData.password && formData.password.length > 0 && formData.password.length < 4) {
      fieldErrors.password = "パスワードは4文字以上で入力してください"
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const updateData: UpdateUserInput = {}
      if (formData.name) updateData.name = formData.name
      if (formData.email) updateData.email = formData.email
      if (formData.password) updateData.password = formData.password
      if (formData.roleId && formData.roleId !== user.roleId) updateData.roleId = formData.roleId

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("更新に失敗しました")
      }

      router.refresh()
      onClose()
      setActiveTab("detail")
    } catch (error) {
      console.error(error)
      alert("更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`「${user.name}」を削除してもよろしいですか？`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("削除に失敗しました")
      }

      router.refresh()
      onClose()
    } catch (error) {
      console.error(error)
      alert("削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setActiveTab("detail")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription>ユーザーの詳細情報</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detail">詳細</TabsTrigger>
            <TabsTrigger value="edit">編集</TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">名前</label>
                <p className="text-base">{user.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  メールアドレス
                </label>
                <p className="text-base">{user.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">ロール</label>
                <div className="mt-1">
                  <RoleBadge roleName={user.role.name} />
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  作成日: {formatDateTime(user.createdAt, timezone)}
                </p>
                <p className="text-xs text-muted-foreground">
                  更新日: {formatDateTime(user.updatedAt, timezone)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
              <Button onClick={() => setActiveTab("edit")} className="gap-2">
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="mt-4">
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="text-sm font-medium">
                  名前 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="edit-email" className="text-sm font-medium">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="edit-password" className="text-sm font-medium">
                  新しいパスワード
                  <span className="text-xs text-muted-foreground ml-2">
                    (変更する場合のみ入力)
                  </span>
                </label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="4文字以上"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-role" className="text-sm font-medium">
                  ロール
                </label>
                <RoleSelect
                  id="edit-role"
                  value={formData.roleId || user.roleId}
                  onChange={(roleId) => setFormData({ ...formData, roleId })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("detail")}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "更新中..." : "更新"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
