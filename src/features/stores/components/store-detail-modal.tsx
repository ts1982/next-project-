"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // storeが変わったら編集フォームを初期化
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        description: store.description || "",
        address: store.address,
        phone: store.phone || "",
        email: store.email || "",
      })
      setPublishedAt(store.publishedAt ? new Date(store.publishedAt) : undefined)
      setUnpublishedAt(store.unpublishedAt ? new Date(store.unpublishedAt) : undefined)
    }
  }, [store])

  if (!store) return null

  // 編集フォームの初期化
  const initializeEditForm = () => {
    setFormData({
      name: store.name,
      description: store.description || "",
      address: store.address,
      phone: store.phone || "",
      email: store.email || "",
    })
    setPublishedAt(store.publishedAt ? new Date(store.publishedAt) : undefined)
    setUnpublishedAt(store.unpublishedAt ? new Date(store.unpublishedAt) : undefined)
    setErrors({})
  }

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
    try {
      const response = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
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
    if (!confirm(`「${store.name}」を削除してもよろしいですか？`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/stores/${store.id}`, {
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
          <DialogTitle>{store.name}</DialogTitle>
          <DialogDescription>店舗の詳細情報</DialogDescription>
        </DialogHeader>

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
                    <p>開始: {new Date(store.publishedAt).toLocaleString("ja-JP", { timeZone: timezone })} ({timezone})</p>
                    <p>終了: {store.unpublishedAt ? `${new Date(store.unpublishedAt).toLocaleString("ja-JP", { timeZone: timezone })} (${timezone})` : "無期限"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">未設定</p>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  作成日: {new Date(store.createdAt).toLocaleString("ja-JP", { timeZone: timezone })} ({timezone})
                </p>
                <p className="text-xs text-muted-foreground">
                  更新日: {new Date(store.updatedAt).toLocaleString("ja-JP", { timeZone: timezone })} ({timezone})
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
  )
}
