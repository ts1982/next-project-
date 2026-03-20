"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
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
import { PermissionGrid, type PermissionSelection } from "./permission-grid";
import { createRoleSchema } from "../schemas/role.schema";
import type { PermissionDefinition } from "../types/role.types";
import { ZodError } from "zod";

type FormErrors = {
  name?: string;
  description?: string;
  permissions?: string;
  general?: string;
};

interface RoleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: PermissionDefinition[];
}

export function RoleCreateModal({ isOpen, onClose, permissions }: RoleCreateModalProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionSelection[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedPermissions([]);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        description: description || undefined,
        permissions: selectedPermissions,
      };

      // クライアントサイドバリデーション
      createRoleSchema.parse(payload);

      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { error?: string; fields?: FormErrors } = {};
      try {
        data = await response.json();
      } catch {
        if (!response.ok) {
          setErrors({ general: "サーバーエラーが発生しました" });
          return;
        }
      }

      if (!response.ok) {
        if (response.status === 400 && data.fields) {
          setErrors(data.fields);
        } else if (response.status === 409) {
          setErrors({ name: data.error });
        } else {
          setErrors({ general: data.error || "エラーが発生しました" });
        }
        return;
      }

      router.refresh();
      onClose();
      resetForm();
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
        if (!open) {
          onClose();
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            新規ロール作成
          </DialogTitle>
          <DialogDescription>新しいロールを作成し、パーミッションを割り当てます</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} aria-label="ロール作成フォーム">
          <div className="space-y-4">
            {errors.general && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800"
              >
                {errors.general}
              </div>
            )}

            <FormField
              label="ロール名"
              value={name}
              onChange={setName}
              error={errors.name}
              required
              placeholder="例: EDITOR"
              name="name"
            />

            <div>
              <label htmlFor="role-description" className="block text-sm font-medium mb-2">
                説明
              </label>
              <textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ロールの説明を入力..."
                className="w-full min-h-16 px-3 py-2 border rounded-md text-sm"
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1" role="alert">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">パーミッション設定</h3>
              <PermissionGrid
                permissions={permissions}
                value={selectedPermissions}
                onChange={setSelectedPermissions}
              />
              {errors.permissions && (
                <p className="text-sm text-red-500 mt-1" role="alert">
                  {errors.permissions}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
              disabled={isSubmitting}
            >
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
