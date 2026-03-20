import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { signOut } from "../../../auth";
import { LogOut, Bell } from "lucide-react";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ colorScheme: "light" }}>
      <header
        className="sticky top-0 z-50 bg-white border-b shadow-sm"
        style={{ colorScheme: "light" }}
      >
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">通知センター</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
