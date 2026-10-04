"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Staff = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_active: boolean;
};

export default function StaffPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", businessId)
        .eq("owner_id", user.id)
        .single();

      if (businessError || !business) {
        setError("Business not found or you do not have access to it.");
        setLoading(false);
        setTimeout(() => router.replace("/dashboard/business"), 1200);
        return;
      }

      const { data, error: staffError } = await supabase
        .from("staff")
        .select("id, name, email, phone, role, is_active")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (staffError) {
        setError(staffError.message);
        setLoading(false);
        return;
      }

      setStaff(data || []);
      setLoading(false);
    };

    fetchStaff();
  }, [businessId, router, supabase]);

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Staff</h1>
            <p className="mt-2 text-gray-600">
              Manage the people who provide your business services.
            </p>
          </div>

          <button
            onClick={() => router.push(`/dashboard/business/${businessId}/staff/new`)}
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Add Staff
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-600" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-gray-600">Loading staff...</p>
        ) : staff.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No staff members yet</h2>
            <p className="mt-2 text-gray-600">
              Add your first staff member to get started.
            </p>
            <button
              onClick={() => router.push(`/dashboard/business/${businessId}/staff/new`)}
              className="mt-5 rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
            >
              Add Staff
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold">{member.name}</h2>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      member.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Email:</strong> {member.email || "Not provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {member.phone || "Not provided"}
                  </p>
                  <p>
                    <strong>Role:</strong> {member.role || "Not provided"}
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/business/${businessId}/staff/${member.id}`
                    )
                  }
                  className="mt-5 w-full rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
                >
                  Manage Staff
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
