"use client";

import type React from "react";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface UserEditModalProps {
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

export const UserEditModal = ({ user }: UserEditModalProps) => {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const formErrorId = useId();
  const nameErrorId = useId();
  const emailErrorId = useId();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name ?? "",
    email: user.email,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetState = () => {
    setFormData({ name: user.name ?? "", email: user.email });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.fields) {
          setErrors(data.fields);
        } else if (response.status === 409) {
          setErrors({ email: data.error || "メールアドレスが重複しています" });
        } else if (response.status === 404) {
          setErrors({ general: data.error || "ユーザーが見つかりません" });
        } else {
          setErrors({ general: data.error || "更新に失敗しました" });
        }
        return;
      }

      setOpen(false);
      startTransition(() => router.refresh());
    } catch {
      setErrors({ general: "予期しないエラーが発生しました" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          編集
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>ユーザーを編集</SheetTitle>
          <SheetDescription>名前とメールアドレスを更新できます。</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} aria-label="ユーザー編集フォーム">
          {errors.general && (
            <div
              id={formErrorId}
              role="alert"
              aria-live="assertive"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor={nameId} className="text-sm font-medium">
              名前
            </label>
            <Input
              id={nameId}
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? nameErrorId : undefined}
            />
            {errors.name && (
              <p id={nameErrorId} className="text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor={emailId} className="text-sm font-medium">
              メールアドレス
            </label>
            <Input
              id={emailId}
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? emailErrorId : undefined}
            />
            {errors.email && (
              <p id={emailErrorId} className="text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting || isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending ? "更新中..." : "更新する"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
