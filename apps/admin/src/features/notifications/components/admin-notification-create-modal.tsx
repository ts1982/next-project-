"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/common/form-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { createAdminNotificationSchema } from "../schemas/admin-notification.schema"
import type { CreateAdminNotificationInput } from "../schemas/admin-notification.schema"
import type { NotificationType, NotificationTargetType } from "../types/admin-notification.types"

interface TargetUser {
  id: string
  name: string
  email: string
}

interface AdminNotificationCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  timezone: string
}

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: "SYSTEM", label: "システム" },
  { value: "INFO", label: "お知らせ" },
  { value: "WARNING", label: "警告" },
  { value: "PROMOTION", label: "キャンペーン" },
]

export function AdminNotificationCreateModal({
  isOpen,
  onClose,
  onCreated,
  timezone,
}: AdminNotificationCreateModalProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [type, setType] = useState<NotificationType>("INFO")
  const [targetType, setTargetType] = useState<NotificationTargetType>("ALL")
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>()
  const [userSearch, setUserSearch] = useState("")
  const [searchResults, setSearchResults] = useState<TargetUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<TargetUser[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUserSearch = async (query: string) => {
    setUserSearch(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const res = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=10`)
    if (res.ok) {
      const data = await res.json()
      setSearchResults(data.data?.users || [])
    }
  }

  const toggleUser = (user: TargetUser) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const input: CreateAdminNotificationInput = {
      title,
      body,
      type,
      targetType,
      targetUserIds: targetType === "SPECIFIC" ? selectedUsers.map((u) => u.id) : undefined,
      scheduledAt: isScheduled && scheduledAt ? format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ss") : null,
      timezone: isScheduled ? timezone : undefined,
    }

    const parsed = createAdminNotificationSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrors({ form: data.error || "作成に失敗しました" })
        return
      }

      onCreated()
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setBody("")
    setType("INFO")
    setTargetType("ALL")
    setIsScheduled(false)
    setScheduledAt(undefined)
    setUserSearch("")
    setSearchResults([])
    setSelectedUsers([])
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>通知を作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p className="text-sm text-destructive">{errors.form}</p>
          )}

          <FormField label="タイトル" error={errors.title} required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="通知タイトルを入力"
            />
          </FormField>

          <FormField label="本文" error={errors.body} required>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="通知本文を入力"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </FormField>

          <FormField label="種別" error={errors.type} required>
            <div className="flex gap-2">
              {NOTIFICATION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                    type === t.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="配信対象" error={errors.targetType} required>
            <div className="flex gap-4">
              {(["ALL", "SPECIFIC"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={targetType === t}
                    onChange={() => setTargetType(t)}
                  />
                  <span>{t === "ALL" ? "全ユーザー" : "特定ユーザー"}</span>
                </label>
              ))}
            </div>
          </FormField>

          {targetType === "SPECIFIC" && (
            <FormField label="ユーザー選択" error={errors.targetUserIds}>
              <Input
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                placeholder="名前またはメールで検索"
                className="mb-2"
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => toggleUser(user)}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent ${
                        selectedUsers.some((u) => u.id === user.id)
                          ? "bg-accent"
                          : ""
                      }`}
                    >
                      {user.name} ({user.email})
                    </div>
                  ))}
                </div>
              )}
              {selectedUsers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedUsers.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs"
                    >
                      {user.name}
                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </FormField>
          )}

          <FormField label="配信タイミング">
            <div className="flex gap-4">
              {(["即時", "予約"] as const).map((t, i) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isScheduled === (i === 1)}
                    onChange={() => setIsScheduled(i === 1)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </FormField>

          {isScheduled && (
            <>
              <FormField label="配信日時" error={errors.scheduledAt} required>
                <DateTimePicker
                  value={scheduledAt}
                  onChange={setScheduledAt}
                  timezone={timezone}
                />
              </FormField>
              <p className="text-xs text-muted-foreground">
                タイムゾーン: {timezone}
              </p>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
