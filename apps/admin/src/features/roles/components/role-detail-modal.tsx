"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PermissionGrid, type PermissionSelection } from "./permission-grid";
import type { RoleWithPermissions, PermissionDefinition } from "../types/role.types";

interface RoleDetailModalProps {
  role: RoleWithPermissions | null;
  permissions: PermissionDefinition[];
  isOpen: boolean;
  onClose: () => void;
}

export function RoleDetailModal({ role, permissions, isOpen, onClose }: RoleDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("detail");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<PermissionSelection[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const initializeEditForm = useCallback(() => {
    if (!role) return;
    setEditName(role.name);
    setEditDescription(role.description || "");
    setEditPermissions(
      role.permissions.map((p) => ({
        permissionId: p.id,
        scope: p.scope.toUpperCase() as "ALL" | "OWN",
      })),
    );
    setErrors({});
  }, [role]);

  useEffect(() => {
    initializeEditForm();
  }, [initializeEditForm]);

  if (!role) return null;

  // permissionId → DB上の Permission を検索するマップ
  const permissionMap = new Map<string, PermissionDefinition>();
  for (const p of permissions) {
    permissionMap.set(p.id, p);
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        name: editName,
        description: editDescription || null,
        permissions: editPermissions,
      };

      const response = await fetch(`/api/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.fields) {
          setErrors(data.fields);
        } else {
          setErrors({ general: data.error || "更新に失敗しました" });
        }
        return;
      }

      router.refresh();
      onClose();
      setActiveTab("detail");
    } catch {
      setErrors({ general: "更新に失敗しました" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrors({ general: data.error || "削除に失敗しました" });
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setErrors({ general: "削除に失敗しました" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setActiveTab("detail");
            onClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{role.name}</DialogTitle>
            <DialogDescription>ロールの詳細情報</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detail">詳細</TabsTrigger>
              <TabsTrigger
                value="edit"
                disabled={role.isSystem}
                onClick={() => {
                  if (activeTab !== "edit") initializeEditForm();
                }}
              >
                編集
              </TabsTrigger>
            </TabsList>

            {/* ── 詳細タブ ── */}
            <TabsContent value="detail" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ロール名</label>
                  <p className="text-base font-medium">{role.name}</p>
                </div>

                {role.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">説明</label>
                    <p className="text-base">{role.description}</p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <label className="text-sm font-medium text-muted-foreground">
                    パーミッション（{role.permissions.length}）
                  </label>
                  <div className="mt-2">
                    <PermissionGrid
                      permissions={permissions}
                      value={role.permissions.map((p) => ({
                        permissionId: p.id,
                        scope: p.scope.toUpperCase() as "ALL" | "OWN",
                      }))}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {!role.isSystem && (
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    削除
                  </Button>
                )}
                {!role.isSystem && (
                  <Button
                    onClick={() => {
                      initializeEditForm();
                      setActiveTab("edit");
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    編集
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* ── 編集タブ ── */}
            <TabsContent value="edit" className="mt-4">
              <form onSubmit={handleEdit} className="space-y-4">
                {errors.general && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800"
                  >
                    {errors.general}
                  </div>
                )}

                <div>
                  <label htmlFor="edit-role-name" className="text-sm font-medium">
                    ロール名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-role-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="edit-role-description" className="text-sm font-medium">
                    説明
                  </label>
                  <textarea
                    id="edit-role-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full min-h-16 px-3 py-2 border rounded-md text-sm"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">パーミッション設定</h3>
                  <PermissionGrid
                    permissions={permissions}
                    value={editPermissions}
                    onChange={setEditPermissions}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("detail")}
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "更新中..." : "更新"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="削除の確認"
        description={`ロール「${role.name}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmLabel="削除"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </>
  );
}
