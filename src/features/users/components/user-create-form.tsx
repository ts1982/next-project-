"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { createUserSchema } from "@/features/users/schemas/user.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZodError } from "zod";

export function UserCreateForm() {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const nameErrorId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const successId = useId();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // フィールド変更時にそのフィールドのエラーをクリア
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      // クライアントサイドバリデーション
      createUserSchema.parse(formData);

      // API呼び出し
      const response = await fetch("/api/users", {
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
      setFormData({ name: "", email: "", password: "" });

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

        {/* 名前フィールド */}
        <div>
          <label htmlFor={nameId} className="block text-sm font-medium mb-2">
            名前 <span className="text-red-500" aria-label="必須">*</span>
          </label>
          <Input
            id={nameId}
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? nameErrorId : undefined}
          />
          {errors.name && (
            <p id={nameErrorId} className="mt-1 text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* メールアドレスフィールド */}
        <div>
          <label htmlFor={emailId} className="block text-sm font-medium mb-2">
            メールアドレス <span className="text-red-500" aria-label="必須">*</span>
          </label>
          <Input
            id={emailId}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "border-red-500" : ""}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? emailErrorId : undefined}
          />
          {errors.email && (
            <p id={emailErrorId} className="mt-1 text-sm text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* パスワードフィールド */}
        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium mb-2">
            パスワード <span className="text-red-500" aria-label="必須">*</span>
          </label>
          <Input
            id={passwordId}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? "border-red-500" : ""}
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? passwordErrorId : undefined}
          />
          {errors.password && (
            <p id={passwordErrorId} className="mt-1 text-sm text-red-600" role="alert">
              {errors.password}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            8文字以上、英字と数字を含む必要があります
          </p>
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
            onClick={() => router.push("/users")}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
