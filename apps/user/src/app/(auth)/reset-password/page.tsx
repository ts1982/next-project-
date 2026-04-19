"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">無効なリンク</h1>
          <p className="mt-2 text-sm text-gray-600">
            パスワードリセットリンクが無効です。もう一度リセットをリクエストしてください。
          </p>
        </div>
        <p className="text-center text-sm text-gray-600">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            パスワードリセットをリクエスト
          </Link>
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-gray-900">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">パスワードを変更しました</h1>
          <p className="mt-2 text-sm text-gray-600">
            新しいパスワードでログインしてください。
          </p>
        </div>
        <p className="text-center">
          <Link
            href="/login"
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ログインへ
          </Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "パスワードが一致しません" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "INVALID_TOKEN" || data.code === "TOKEN_EXPIRED") {
          setErrors({ form: data.error });
        } else if (data.fields) {
          setErrors(data.fields);
        } else {
          setErrors({ form: data.error || "エラーが発生しました" });
        }
        return;
      }

      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-gray-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold">新しいパスワード</h1>
        <p className="mt-2 text-sm text-gray-600">新しいパスワードを入力してください</p>
      </div>

      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">新しいパスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">8文字以上、英字と数字を含む</p>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">パスワード確認</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "変更中..." : "パスワードを変更"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          ログインに戻る
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      style={{ colorScheme: "light" }}
    >
      <Suspense
        fallback={
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center text-gray-500">
            読み込み中...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
