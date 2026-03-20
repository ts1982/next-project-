"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckIcon, SearchIcon, UsersIcon, UserIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/common/form-field";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { createAdminNotificationSchema } from "../schemas/admin-notification.schema";
import type { CreateAdminNotificationInput } from "../schemas/admin-notification.schema";
import type { NotificationType, NotificationTargetType } from "../types/admin-notification.types";

interface TargetUser {
  id: string;
  name: string;
  email: string;
}

interface AdminNotificationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  timezone: string;
}

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: "SYSTEM", label: "システム" },
  { value: "INFO", label: "お知らせ" },
  { value: "WARNING", label: "警告" },
  { value: "PROMOTION", label: "キャンペーン" },
];

export function AdminNotificationCreateModal({
  isOpen,
  onClose,
  onCreated,
  timezone,
}: AdminNotificationCreateModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("INFO");
  const [targetType, setTargetType] = useState<NotificationTargetType>("ALL");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TargetUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<TargetUser[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserSearch = async (query: string) => {
    setUserSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=10`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.data?.users || []);
    }
  };

  const toggleUser = (user: TargetUser) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const input: CreateAdminNotificationInput = {
      title,
      body,
      type,
      targetType,
      targetUserIds: targetType === "SPECIFIC" ? selectedUsers.map((u) => u.id) : undefined,
      scheduledAt: isScheduled && scheduledAt ? format(scheduledAt, "yyyy-MM-dd'T'HH:mm:ss") : null,
      timezone: isScheduled ? timezone : undefined,
    };

    const parsed = createAdminNotificationSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ form: data.error || "作成に失敗しました" });
        return;
      }

      onCreated();
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setBody("");
    setType("INFO");
    setTargetType("ALL");
    setIsScheduled(false);
    setScheduledAt(undefined);
    setUserSearch("");
    setSearchResults([]);
    setSelectedUsers([]);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>通知を作成</DialogTitle>
          <DialogDescription>新しい通知を作成して、ユーザーに配信します。</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="space-y-5"
        >
          {errors.form && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </div>
          )}

          <FormField label="タイトル" error={errors.title} required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="通知タイトルを入力"
            />
          </FormField>

          <FormField label="本文" error={errors.body} required>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="通知本文を入力"
              rows={4}
            />
          </FormField>

          <FormField label="種別" error={errors.type} required>
            <div className="flex gap-1.5">
              {NOTIFICATION_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={type === t.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setType(t.value)}
                  className="flex-1"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </FormField>

          <FormField label="配信対象" error={errors.targetType} required>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "ALL", label: "全ユーザー", icon: UsersIcon },
                  { value: "SPECIFIC", label: "特定ユーザー", icon: UserIcon },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTargetType(t.value)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    targetType === t.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </FormField>

          {targetType === "SPECIFIC" && (
            <FormField label="ユーザー選択" error={errors.targetUserIds}>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="名前またはメールで検索"
                  className="pl-9"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-36 overflow-y-auto divide-y">
                  {searchResults.map((user) => {
                    const isSelected = selectedUsers.some((u) => u.id === user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUser(user)}
                        className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/5 text-primary" : "hover:bg-accent"
                        }`}
                      >
                        <span>
                          {user.name} <span className="text-muted-foreground">({user.email})</span>
                        </span>
                        {isSelected && <CheckIcon className="h-4 w-4" />}
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedUsers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                      {user.name}
                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormField>
          )}

          <FormField label="配信タイミング">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { label: "即時配信", scheduled: false },
                  { label: "予約配信", scheduled: true },
                ] as const
              ).map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setIsScheduled(t.scheduled)}
                  className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isScheduled === t.scheduled
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </FormField>

          {isScheduled && (
            <FormField label="配信日時" error={errors.scheduledAt} required>
              <DateTimePicker value={scheduledAt} onChange={setScheduledAt} timezone={timezone} />
            </FormField>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
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
  );
}
