"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        style={{ colorScheme: "light" }}
      >
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-gray-900">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">メールを送信しました</h1>
            <p className="mt-2 text-sm text-gray-600">
              メールアドレスが登録されている場合、パスワードリセット用のリンクを送信しました。
              メールをご確認ください。
            </p>
          </div>

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              ログインに戻る
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      style={{ colorScheme: "light" }}
    >
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-gray-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold">パスワードリセット</h1>
          <p className="mt-2 text-sm text-gray-600">
            登録済みのメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "送信中..." : "リセットリンクを送信"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            ログインに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
