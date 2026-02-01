"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Store as StoreIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/common/form-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { createStoreSchema, type CreateStoreSchema } from "../schemas/store.schema"

interface StoreCreateModalProps {
  isOpen: boolean
  onClose: () => void
  timezone: string
}

export function StoreCreateModal({ isOpen, onClose, timezone }: StoreCreateModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateStoreSchema>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
  })
  const [publishedAt, setPublishedAt] = useState<Date | undefined>()
  const [unpublishedAt, setUnpublishedAt] = useState<Date | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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

    // バリデーション
    const result = createStoreSchema.safeParse(submitData)
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
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })

      if (!response.ok) {
        throw new Error("店舗の作成に失敗しました")
      }

      router.refresh()
      onClose()
      setFormData({
        name: "",
        description: "",
        address: "",
        phone: "",
        email: "",
      })
      setPublishedAt(undefined)
      setUnpublishedAt(undefined)
    } catch (error) {
      console.error(error)
      alert("店舗の作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" />
            新規店舗登録
          </DialogTitle>
          <DialogDescription>新しい店舗を登録します</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} aria-label="店舗作成フォーム">
          <div className="space-y-4">
            <FormField
              label="店舗名"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              error={errors.name}
              required
              placeholder="例: 東京本店"
              name="name"
            />

            <FormField
              label="住所"
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              error={errors.address}
              required
              placeholder="例: 東京都渋谷区..."
              name="address"
            />

            <FormField
              label="電話番号"
              value={formData.phone || ""}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              error={errors.phone}
              placeholder="例: 03-1234-5678"
              name="phone"
            />

            <FormField
              label="メールアドレス"
              value={formData.email || ""}
              onChange={(value) => setFormData({ ...formData, email: value })}
              error={errors.email}
              type="email"
              placeholder="例: store@example.com"
              name="email"
            />

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                説明
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="店舗の説明を入力..."
                className="w-full min-h-20 px-3 py-2 border rounded-md"
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              {errors.description && (
                <p id="description-error" className="text-sm text-red-500 mt-1" role="alert">
                  {errors.description}
                </p>
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
                    <p className="text-sm text-red-500 mt-1" role="alert">{errors.publishedAt}</p>
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
                    <p className="text-sm text-red-500 mt-1" role="alert">{errors.unpublishedAt}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
