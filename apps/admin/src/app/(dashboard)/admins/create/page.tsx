import { AdminCreateForm } from "@/features/admins/components/admin-create-form";

export default function CreateAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">管理者新規作成</h1>
      <AdminCreateForm />
    </div>
  );
}
