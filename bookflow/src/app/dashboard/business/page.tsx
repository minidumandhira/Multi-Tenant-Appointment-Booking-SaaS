"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            BookFlow Dashboard
          </h1>

          <p className="mt-4">
            Welcome to your dashboard.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/business/new")}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-gray-800"
          >
            Create Business
          </button>

          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}