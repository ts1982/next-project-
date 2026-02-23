"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { createAdminSchema } from "@/features/admins/schemas/admin.schema";
import { RoleSelect } from "@/features/admins/components/role-select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/common/form-field";
import { ZodError } from "zod";

export function AdminCreateForm() {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const formErrorId = useId();
  const successId = useId();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
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

      const data = await response.json();

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
      setSuccessMessage("ユーザーを作成しました");
      setFormData({ name: "", email: "", password: "", roleId: "" });

      // 5秒後にメッセージを消去
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
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
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6" aria-label="ユーザー作成フォーム">
        {/* 成功メッセージ - aria-live で通知 */}
        {successMessage && (
          <div
            id={successId}
            role="status"
            aria-live="polite"
            className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800"
          >
            {successMessage}
          </div>
        )}

        {/* 一般エラー - aria-live で通知 */}
        {errors.general && (
          <div
            id={formErrorId}
            role="alert"
            aria-live="assertive"
            className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800"
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
          />
          <p className="mt-1 text-xs text-gray-500">
            8文字以上、英字と数字を含む必要があります
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">ロール</label>
          <RoleSelect
            value={formData.roleId}
            onChange={(roleId) => setFormData({ ...formData, roleId })}
            error={errors.roleId}
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "作成中..." : "作成"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admins")}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
