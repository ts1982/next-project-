"use client"

import { useState } from "react"
import { Shield, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoleTable } from "@/features/roles/components/role-table"
import { RoleCreateModal } from "@/features/roles/components/role-create-modal"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { RoleWithPermissions, PermissionDefinition } from "@/features/roles"

interface RolesClientPageProps {
  initialRoles: RoleWithPermissions[]
  permissions: PermissionDefinition[]
}

export function RolesClientPage({
  initialRoles,
  permissions,
}: RolesClientPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { can } = usePermissions()

  const canCreate = can("roles", "create")

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">ロール管理</h1>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              新規作成
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          ロールとパーミッションを管理できます
        </p>
      </div>

      <RoleTable roles={initialRoles} permissions={permissions} />

      {canCreate && (
        <RoleCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          permissions={permissions}
        />
      )}
    </div>
  )
}
