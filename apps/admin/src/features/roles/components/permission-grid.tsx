"use client"

import {
  RESOURCES,
  ACTIONS,
  RESOURCE_LABELS,
  ACTION_LABELS,
  SCOPE_LABELS,
  type PermissionScope,
} from "@/lib/auth/permissions"
import type { PermissionDefinition } from "../types/role.types"

/** 各セルの選択状態 */
export interface PermissionSelection {
  permissionId: string
  scope: "ALL" | "OWN"
}

interface PermissionGridProps {
  /** DB上のパーミッション定義一覧 */
  permissions: PermissionDefinition[]
  /** 現在の選択状態 */
  value: PermissionSelection[]
  /** 選択が変更されたとき */
  onChange: (selections: PermissionSelection[]) => void
  /** 読み取り専用 */
  readOnly?: boolean
}

/**
 * パーミッショングリッドコンポーネント
 *
 * Resource × Action のマトリクスでパーミッションのスコープ（ALL / OWN / 無効）を切替
 */
export function PermissionGrid({
  permissions,
  value,
  onChange,
  readOnly = false,
}: PermissionGridProps) {
  // permissionId 検索用マップ: "resource:action" → permissionId
  const permissionMap = new Map<string, string>()
  for (const p of permissions) {
    permissionMap.set(`${p.resource}:${p.action}`, p.id)
  }

  // 現在値の検索用マップ: permissionId → scope
  const selectionMap = new Map<string, "ALL" | "OWN">()
  for (const sel of value) {
    selectionMap.set(sel.permissionId, sel.scope)
  }

  /** セルのスコープを取得 */
  function getScope(resource: string, action: string): "ALL" | "OWN" | null {
    const pid = permissionMap.get(`${resource}:${action}`)
    if (!pid) return null
    return selectionMap.get(pid) ?? null
  }

  /** セルのスコープを次の値に切り替え: null → ALL → OWN → null */
  function cycleScope(resource: string, action: string) {
    if (readOnly) return
    const pid = permissionMap.get(`${resource}:${action}`)
    if (!pid) return

    const current = selectionMap.get(pid) ?? null
    let next: "ALL" | "OWN" | null
    if (current === null) next = "ALL"
    else if (current === "ALL") next = "OWN"
    else next = null

    const newValue = value.filter((s) => s.permissionId !== pid)
    if (next) {
      newValue.push({ permissionId: pid, scope: next })
    }
    onChange(newValue)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 border-b font-medium text-muted-foreground">
              リソース
            </th>
            {ACTIONS.map((action) => (
              <th
                key={action}
                className="p-2 border-b font-medium text-muted-foreground text-center"
              >
                {ACTION_LABELS[action]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RESOURCES.map((resource) => (
            <tr key={resource} className="border-b last:border-b-0">
              <td className="p-2 font-medium">{RESOURCE_LABELS[resource]}</td>
              {ACTIONS.map((action) => {
                const scope = getScope(resource, action)
                const pid = permissionMap.get(`${resource}:${action}`)

                return (
                  <td key={action} className="p-2 text-center">
                    {pid ? (
                      <button
                        type="button"
                        onClick={() => cycleScope(resource, action)}
                        disabled={readOnly}
                        className={`
                          inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium
                          min-w-[72px] transition-colors
                          ${readOnly ? "cursor-default" : "cursor-pointer"}
                          ${
                            scope === "ALL"
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                              : scope === "OWN"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500"
                          }
                        `}
                        aria-label={`${RESOURCE_LABELS[resource]} - ${ACTION_LABELS[action]}: ${
                          scope ? SCOPE_LABELS[scope.toLowerCase() as PermissionScope] : "無効"
                        }`}
                      >
                        {scope === "ALL"
                          ? "すべて"
                          : scope === "OWN"
                            ? "自分のみ"
                            : "—"}
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <p className="text-xs text-muted-foreground mt-2">
          クリックでスコープを切替: — → すべて → 自分のみ → —
        </p>
      )}
    </div>
  )
}
