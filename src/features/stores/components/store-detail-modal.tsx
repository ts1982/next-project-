"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
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
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { PublicationStatusBadge } from "./publication-status-badge"
import { updateStoreSchema, type UpdateStoreSchema } from "../schemas/store.schema"
import type { Store } from "../types/store.types"

interface StoreDetailModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
  timezone: string
}

export function StoreDetailModal({ store, isOpen, onClose, timezone }: StoreDetailModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("detail")
  const [formData, setFormData] = useState<UpdateStoreSchema>({})
  const [publishedAt, setPublishedAt] = useState<Date | undefined>()
  const [unpublishedAt, setUnpublishedAt] = useState<Date | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const initializeEditForm = useCallback(() => {
    if (!store) return;
    setFormData({
      name: store.name,
      description: store.description || "",
      address: store.address,
      phone: store.phone || "",
      email: store.email || "",
    });
    setPublishedAt(
      store.publishedAt ? toZonedTime(store.publishedAt, timezone) : undefined
    );
    setUnpublishedAt(
      store.unpublishedAt ? toZonedTime(store.unpublishedAt, timezone) : undefined
    );
    setErrors({});
  }, [store, timezone])

  useEffect(() => {
    initializeEditForm();
  }, [initializeEditForm])

  if (!store) return null

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // 公開日時をフォームデータに追加
    // ✅ ローカル日時文字列として送信（UTC変換はbackendで実施）
    const submitData = {
      ...formData,
      publishedAt: publishedAt ? format(publishedAt, "yyyy-MM-dd'T'HH:mm:ss") : null,
      unpublishedAt: unpublishedAt ? format(unpublishedAt, "yyyy-MM-dd'T'HH:mm:ss") : null,
      timezone,
    }

    const result = updateStoreSchema.safeParse(submitData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    setGeneralError(null)
    try {
      const response = await fetch(`/api/stores/${store.id}`, {
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
      const response = await fetch(`/api/stores/${store.id}`, {
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
          <DialogTitle>{store.name}</DialogTitle>
          <DialogDescription>店舗の詳細情報</DialogDescription>
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
            <TabsTrigger
              value="edit"
              onClick={() => {
                if (activeTab !== "edit") {
                  initializeEditForm()
                }
              }}
            >
              編集
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">公開状態</label>
                <div className="mt-1">
                  <PublicationStatusBadge
                    publishedAt={store.publishedAt}
                    unpublishedAt={store.unpublishedAt}
                    timezone={timezone}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">店舗名</label>
                <p className="text-base">{store.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">住所</label>
                <p className="text-base">{store.address}</p>
              </div>

              {store.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">電話番号</label>
                  <p className="text-base">{store.phone}</p>
                </div>
              )}

              {store.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    メールアドレス
                  </label>
                  <p className="text-base">{store.email}</p>
                </div>
              )}

              {store.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">説明</label>
                  <p className="text-base whitespace-pre-wrap">{store.description}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <label className="text-sm font-medium text-muted-foreground">公開期間</label>
                {store.publishedAt ? (
                  <div className="text-sm mt-1">
                    <p>開始: {formatDateTime(store.publishedAt, timezone)}</p>
                    <p>終了: {store.unpublishedAt ? formatDateTime(store.unpublishedAt, timezone) : "無期限"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">未設定</p>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  作成日: {formatDateTime(store.createdAt, timezone)}
                </p>
                <p className="text-xs text-muted-foreground">
                  更新日: {formatDateTime(store.updatedAt, timezone)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
                  店舗名 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="edit-address" className="text-sm font-medium">
                  住所 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="edit-phone" className="text-sm font-medium">
                  電話番号
                </label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="edit-email" className="text-sm font-medium">
                  メールアドレス
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
                <label htmlFor="edit-description" className="text-sm font-medium">
                  説明
                </label>
                <textarea
                  id="edit-description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-20 px-3 py-2 border rounded-md"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              {/* 公開設定セクション */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">公開設定</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  タイムゾーン: {timezone}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">公開開始日時</label>
                    <DateTimePicker
                      value={publishedAt}
                      onChange={setPublishedAt}
                      placeholder="公開開始日時を選択（未設定の場合は未公開）"
                      timezone={timezone}
                    />
                    {errors.publishedAt && (
                      <p className="text-sm text-red-500 mt-1">{errors.publishedAt}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">公開終了日時（オプション）</label>
                    <DateTimePicker
                      value={unpublishedAt}
                      onChange={setUnpublishedAt}
                      placeholder="公開終了日時を選択（未設定の場合は無期限）"
                      timezone={timezone}
                    />
                    {errors.unpublishedAt && (
                      <p className="text-sm text-red-500 mt-1">{errors.unpublishedAt}</p>
                    )}
                  </div>
                </div>
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
        description={`「${store.name}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmLabel="削除"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </>
  )
}
