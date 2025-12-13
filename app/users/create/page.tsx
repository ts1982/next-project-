import { UserCreateForm } from "@/features/users";

export default function CreateUserPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">ユーザー新規作成</h1>
      <UserCreateForm />
    </div>
  );
}
