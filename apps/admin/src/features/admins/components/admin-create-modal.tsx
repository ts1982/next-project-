"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/common/form-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createAdminSchema } from "../schemas/admin.schema";
import { RoleSelect } from "./role-select";
import { ZodError } from "zod";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  general?: string;
};

interface AdminCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminCreateModal({ isOpen, onClose }: AdminCreateModalProps) {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const formErrorId = useId();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // クライアントサイドバリデーション
      createAdminSchema.parse(formData);

      // API呼び出し
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data: { error?: string; fields?: FormErrors } = {};
      try {
        data = await response.json();
      } catch {
        // JSON parse エラーの場合
        if (!response.ok) {
          setErrors({ general: "サーバーエラーが発生しました" });
          return;
        }
      }

      if (!response.ok) {
        // サーバーサイドエラー
        if (response.status === 400 && data.fields) {
          setErrors(data.fields);
        } else if (response.status === 409) {
          setErrors({ email: data.error });
        } else {
          setErrors({ general: data.error || "エラーが発生しました" });
        }
        return;
      }

      // 成功
      router.refresh();
      onClose();
      setFormData({ name: "", email: "", password: "", roleId: "" });
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const field = err.path[0]?.toString() as keyof FormErrors;
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: "予期しないエラーが発生しました" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            新規ユーザー登録
          </DialogTitle>
          <DialogDescription>新しいユーザーを登録します</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} aria-label="ユーザー作成フォーム">
          <div className="space-y-4">
            {/* 一般エラー - aria-live で通知 */}
            {errors.general && (
              <div
                id={formErrorId}
                role="alert"
                aria-live="assertive"
                className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800"
              >
                {errors.general}
              </div>
            )}

            <FormField
              label="名前"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              error={errors.name}
              required
              name="name"
              id={nameId}
              placeholder="例: 山田太郎"
            />

            <FormField
              label="メールアドレス"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              error={errors.email}
              required
              type="email"
              name="email"
              id={emailId}
              placeholder="例: user@example.com"
            />

            <div>
              <FormField
                label="パスワード"
                value={formData.password}
                onChange={(value) => setFormData({ ...formData, password: value })}
                error={errors.password}
                required
                type="password"
                name="password"
                id={passwordId}
                placeholder="8文字以上"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                8文字以上、英字と数字を含む必要があります
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ロール</label>
              <RoleSelect
                value={formData.roleId}
                onChange={(roleId) => setFormData({ ...formData, roleId })}
                error={errors.roleId}
              />
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
  );
}
