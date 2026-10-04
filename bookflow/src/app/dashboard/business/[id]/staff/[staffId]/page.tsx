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

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
};

export default function StaffDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const staffId = params.staffId as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        .eq("id", staffId)
        .eq("business_id", business.id)
        .single();

      if (staffError || !data) {
        setError("Staff member not found or you do not have access to it.");
        setLoading(false);
        setTimeout(
          () => router.replace(`/dashboard/business/${businessId}/staff`),
          1200
        );
        return;
      }

      const [servicesResult, assignmentsResult] = await Promise.all([
        supabase
          .from("services")
          .select("id, name, description, duration_minutes, price")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("staff_services")
          .select("service_id")
          .eq("staff_id", data.id),
      ]);

      if (servicesResult.error) {
        setError(servicesResult.error.message);
        setLoading(false);
        return;
      }

      if (assignmentsResult.error) {
        setError(assignmentsResult.error.message);
        setLoading(false);
        return;
      }

      setStaff(data);
      setServices(servicesResult.data || []);
      setSelectedServiceIds(
        new Set(
          (assignmentsResult.data || []).map(
            (assignment) => assignment.service_id
          )
        )
      );
      setLoading(false);
    };

    fetchStaff();
  }, [businessId, router, staffId, supabase]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    setDeleting(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please log in again.");
      setDeleting(false);
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
      setDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("staff")
      .delete()
      .eq("id", staffId)
      .eq("business_id", business.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    setSuccess("Staff member deleted successfully.");
    router.push(`/dashboard/business/${businessId}/staff`);
    router.refresh();
  };

  const handleServiceSelection = (serviceId: string, selected: boolean) => {
    setSelectedServiceIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (selected) {
        nextIds.add(serviceId);
      } else {
        nextIds.delete(serviceId);
      }

      return nextIds;
    });
  };

  const handleSaveServices = async () => {
    setSavingServices(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please log in again.");
      setSavingServices(false);
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
      setSavingServices(false);
      return;
    }

    const { data: ownedStaff, error: staffError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", staffId)
      .eq("business_id", business.id)
      .single();

    if (staffError || !ownedStaff) {
      setError("Staff member not found or you do not have access to it.");
      setSavingServices(false);
      return;
    }

    const { data: businessServices, error: servicesError } = await supabase
      .from("services")
      .select("id")
      .eq("business_id", business.id);

    if (servicesError) {
      setError(servicesError.message);
      setSavingServices(false);
      return;
    }

    const validServiceIds = new Set(
      (businessServices || []).map((service) => service.id)
    );
    const validSelectedIds = new Set(
      [...selectedServiceIds].filter((serviceId) =>
        validServiceIds.has(serviceId)
      )
    );

    if (validSelectedIds.size !== selectedServiceIds.size) {
      setError("One or more selected services no longer belong to this business.");
      setSavingServices(false);
      return;
    }

    const { data: currentAssignments, error: assignmentsError } =
      await supabase
        .from("staff_services")
        .select("service_id")
        .eq("staff_id", ownedStaff.id);

    if (assignmentsError) {
      setError(assignmentsError.message);
      setSavingServices(false);
      return;
    }

    const currentServiceIds = new Set(
      (currentAssignments || []).map((assignment) => assignment.service_id)
    );
    const serviceIdsToInsert = [...validSelectedIds].filter(
      (serviceId) => !currentServiceIds.has(serviceId)
    );
    const serviceIdsToDelete = [...currentServiceIds].filter(
      (serviceId) => !validSelectedIds.has(serviceId)
    );

    if (serviceIdsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("staff_services")
        .insert(
          serviceIdsToInsert.map((serviceId) => ({
            staff_id: ownedStaff.id,
            service_id: serviceId,
          }))
        );

      if (insertError) {
        setError(insertError.message);
        setSavingServices(false);
        return;
      }
    }

    if (serviceIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("staff_services")
        .delete()
        .eq("staff_id", ownedStaff.id)
        .in("service_id", serviceIdsToDelete);

      if (deleteError) {
        setError(deleteError.message);
        setSavingServices(false);
        return;
      }
    }

    setSelectedServiceIds(validSelectedIds);
    setSuccess("Service assignments saved successfully.");
    setSavingServices(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>Loading staff member...</p>
      </main>
    );
  }

  if (error && !staff) {
    return (
      <main className="min-h-screen bg-black-50 p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
          <p className="text-red-600" role="alert">
            {error}
          </p>
          <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
        </div>
      </main>
    );
  }

  if (!staff) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-gray-800 p-8 shadow">
        {error && (
          <p className="mb-4 text-red-600" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 text-green-600" role="status">
            {success}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">{staff.name}</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              staff.is_active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {staff.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="mt-6 space-y-3">
          <p>
            <strong>Email:</strong> {staff.email || "Not provided"}
          </p>
          <p>
            <strong>Phone:</strong> {staff.phone || "Not provided"}
          </p>
          <p>
            <strong>Role:</strong> {staff.role || "Not provided"}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() =>
              router.push(
                `/dashboard/business/${businessId}/staff/${staffId}/edit`
              )
            }
            className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700"
          >
            Edit Staff
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Staff"}
          </button>

        </div>

        <section className="mt-8 border-t border-gray-600 pt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Manage Services</h2>
              <p className="mt-2 text-gray-200">
                Select the services this staff member can provide.
              </p>
            </div>

            <button
              onClick={handleSaveServices}
              disabled={savingServices || loading}
              className="rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {savingServices ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {services.length === 0 ? (
            <div className="mt-6 rounded-lg border border-gray-600 bg-gray-900 p-6">
              <p className="text-gray-200">
                This business does not have any services yet.
              </p>
              <button
                onClick={() =>
                  router.push(`/dashboard/business/${businessId}/services`)
                }
                className="mt-4 rounded-md border border-gray-400 px-4 py-2 text-white hover:bg-gray-700"
              >
                Manage Business Services
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {services.map((service) => {
                const isSelected = selectedServiceIds.has(service.id);

                return (
                  <label
                    key={service.id}
                    className={`cursor-pointer rounded-lg border p-4 transition ${
                      isSelected
                        ? "border-pink-500 bg-pink-950"
                        : "border-gray-600 bg-gray-900 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) =>
                          handleServiceSelection(
                            service.id,
                            event.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4"
                      />

                      <div className="min-w-0">
                        <h3 className="font-semibold text-white">
                          {service.name}
                        </h3>

                        {service.description && (
                          <p className="mt-1 text-sm text-gray-200">
                            {service.description}
                          </p>
                        )}

                        <div className="mt-3 space-y-1 text-sm text-gray-200">
                          <p>
                            <strong>Duration:</strong>{" "}
                            {service.duration_minutes} minutes
                          </p>
                          <p>
                            <strong>Price:</strong> Rs. {service.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <button
          onClick={() => router.push(`/dashboard/business/${businessId}/staff`)}
          className="mt-6 text-sm text-gray-200 underline hover:text-pink-400"
        >
          Back to Staff
        </button>
      </div>
    </main>
  );
}
