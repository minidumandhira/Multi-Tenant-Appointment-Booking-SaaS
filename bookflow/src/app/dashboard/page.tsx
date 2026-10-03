"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  country: string | null;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, description, city, country")
        .eq("owner_id", user.id);

      if (error) {
        console.error(error);
      } else {
        setBusinesses(data || []);
      }

      setLoading(false);
    };

    fetchBusinesses();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-black-50 p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            BookFlow Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome to your dashboard.
          </p>
        </div>

        <div className="flex gap-3">
          {/* Create Business */}
          <button
            onClick={() =>
              router.push("/dashboard/business/new")
            }
            className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-gray-800"
          >
            Create Business
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Business Section */}
      <section className="mt-10">

        <h2 className="text-2xl font-semibold">
          My Businesses
        </h2>

        {loading ? (
          <p className="mt-4 text-gray-600">
            Loading...
          </p>
        ) : businesses.length === 0 ? (
          
          <div className="mt-6 rounded-lg border bg-black-100 p-8">
            <p className="text-gray-600">
              You don't have any businesses yet.
            </p>
          </div>

        ) : (

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {businesses.map((business) => (

              <div
                key={business.id}
                className="rounded-lg border bg-black-100 p-6 shadow-sm"
              >

                <h3 className="text-xl font-semibold">
                  {business.name}
                </h3>

                {business.description && (
                  <p className="mt-2 text-gray-600">
                    {business.description}
                  </p>
                )}

                {(business.city || business.country) && (
                  <p className="mt-3 text-sm text-gray-500">
                    {business.city}
                    {business.city && business.country
                      ? ", "
                      : ""}
                    {business.country}
                  </p>
                )}

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/business/${business.id}`
                    )
                  }
                  className="mt-5 w-full rounded-md border border-gray-300 px-4 py-2 hover:bg-pink-400"
                >
                  Manage Business
                </button>

              </div>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}