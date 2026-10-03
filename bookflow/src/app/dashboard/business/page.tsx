import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function BusinessPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          My Businesses
        </h1>

        <p className="mt-4 text-red-600">
          You must be logged in.
        </p>
      </main>
    );
  }

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, name, description, phone, email, city, country")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          My Businesses
        </h1>

        <p className="mt-4 text-red-600">
          Failed to load businesses.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              My Businesses
            </h1>

            <p className="mt-2 text-pink-600">
              Manage your businesses from here.
            </p>
          </div>

          <Link
            href="/dashboard/business/new"
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Create Business
          </Link>
        </div>

        {businesses.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-black-100 p-8">
            <p className="text-black">
              You don&apos;t have any businesses yet.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="rounded-lg border bg-pink-300 p-6 text-black shadow-sm"
              >
                <h2 className="text-xl font-semibold text-black">
                  {business.name}
                </h2>

                {business.description && (
                  <p className="mt-2 text-black">
                    {business.description}
                  </p>
                )}

                {business.phone && (
                  <p className="mt-4 text-sm text-black">
                    <strong>Phone:</strong>{" "}
                    {business.phone}
                  </p>
                )}

                {business.email && (
                  <p className="mt-1 text-sm text-black">
                    <strong>Email:</strong>{" "}
                    {business.email}
                  </p>
                )}

                {(business.city || business.country) && (
                  <p className="mt-2 text-sm text-black">
                    {business.city}
                    {business.city && business.country
                      ? ", "
                      : ""}
                    {business.country}
                  </p>
                )}

                <a
                  href={`/dashboard/business/${business.id}`}
                  className="mt-5 block w-full rounded-md bg-pink-500 border border-pink-300 px-4 py-2 text-center text-white hover:bg-pink-600"
                >
                  Manage Business
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}