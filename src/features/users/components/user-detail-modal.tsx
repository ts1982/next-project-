"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Bell } from "lucide-react"
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
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { RoleBadge } from "./role-badge"
import { RoleSelect } from "./role-select"
import { NotificationListModal } from "@/features/notifications/components/notification-list-modal"
import { updateUserSchema, type UpdateUserInput } from "../schemas/user.schema"
import type { User } from "../types/user.types"

interface UserDetailModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  timezone: string
}

export function UserDetailModal({ user, isOpen, onClose, timezone }: UserDetailModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("detail")
  const [formData, setFormData] = useState<Partial<UpdateUserInput>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    setGeneralError(null)

    const updateData: Record<string, string> = {}
    if (formData.name) updateData.name = formData.name
    if (formData.email) updateData.email = formData.email
    if (formData.password) updateData.password = formData.password
    if (formData.roleId && formData.roleId !== user.roleId) updateData.roleId = formData.roleId

    const result = updateUserSchema.safeParse(updateData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        if (data.fields) {
          setErrors(data.fields)
        } else {
          setGeneralError(data.error || "更新に失敗しました")
        }
        return
      }

      router.refresh()
      onClose()
      setActiveTab("detail")
    } catch {
      setGeneralError("更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    setGeneralError(null)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setGeneralError(data.error || "削除に失敗しました")
        return
      }

      router.refresh()
      onClose()
    } catch {
      setGeneralError("削除に失敗しました")
    } finally {
      setIsSubmitting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setActiveTab("detail")
          setGeneralError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription>ユーザーの詳細情報</DialogDescription>
        </DialogHeader>

        {generalError && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800"
          >
            {generalError}
          </div>
        )}

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
                variant="outline"
                onClick={() => setIsNotificationModalOpen(true)}
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                通知一覧
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
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
                  placeholder="8文字以上（英字と数字を含む）"
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

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="削除の確認"
        description={`「${user.name}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmLabel="削除"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />

      {/* 通知一覧モーダル */}
      <NotificationListModal
        userId={user.id}
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        timezone={timezone}
      />
    </>
  )
}
