"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { updateStoreSchema, type UpdateStoreSchema } from "../schemas/store.schema"
import type { Store } from "../types/store.types"

interface StoreDetailModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
}

export function StoreDetailModal({ store, isOpen, onClose }: StoreDetailModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("detail")
  const [formData, setFormData] = useState<UpdateStoreSchema>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setErrors({})
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = updateStoreSchema.safeParse(formData)
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
      <DialogContent className="sm:max-w-[600px]">
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
                <p className="text-xs text-muted-foreground">
                  作成日: {new Date(store.createdAt).toLocaleString("ja-JP")}
                </p>
                <p className="text-xs text-muted-foreground">
                  更新日: {new Date(store.updatedAt).toLocaleString("ja-JP")}
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
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
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
