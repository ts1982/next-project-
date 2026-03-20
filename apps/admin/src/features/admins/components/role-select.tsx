"use client";

import { useEffect, useState } from "react";

interface RoleOption {
  id: string;
  name: string;
}

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  error?: string;
}

export function RoleSelect({ value, onChange, id, disabled, error }: RoleSelectProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/roles");
        if (res.ok) {
          const data = await res.json();
          setRoles(
            (data.data?.roles ?? []).map((r: { id: string; name: string }) => ({
              id: r.id,
              name: r.name,
            })),
          );
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRoles();
  }, []);

  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="ロール選択"
        aria-invalid={!!error}
      >
        {isLoading ? (
          <option value="">読み込み中...</option>
        ) : fetchError ? (
          <option value="">ロールの取得に失敗しました</option>
        ) : (
          <>
            <option value="">ロールを選択してください</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </>
        )}
      </select>
      {error && (
        <p className="text-sm text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
