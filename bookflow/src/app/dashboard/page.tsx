"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [businessCount, setBusinessCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBusinesses = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: businessesError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id);

      if (businessesError) {
        setError(businessesError.message);
      } else {
        setBusinessCount(data?.length || 0);
      }

      setLoading(false);
    };

    fetchBusinesses();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">BookFlow Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome to your dashboard.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {loading ? (
          <p className="mt-10 text-gray-600">Loading dashboard...</p>
        ) : error ? (
          <p className="mt-10 text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <section className="mt-10 rounded-lg border bg-black-100 p-8">
            <p className="text-sm text-gray-600">Your businesses</p>
            <p className="mt-2 text-4xl font-bold">{businessCount}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/dashboard/business")}
                className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
              >
                Manage Businesses
              </button>

              <button
                onClick={() => router.push("/dashboard/business/new")}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
              >
                Create Business
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}