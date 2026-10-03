import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ManageBusinessPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !business) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          Business Not Found
        </h1>

        <p className="mt-4 text-gray-600">
          The business could not be found.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black-50 p-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-black-100 p-8 shadow">
        <h1 className="text-3xl font-bold">
          {business.name}
        </h1>

        {business.description && (
          <p className="mt-4 text-pink-600">
            {business.description}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <p>
            <strong>Phone:</strong>{" "}
            {business.phone || "Not provided"}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {business.email || "Not provided"}
          </p>

          <p>
            <strong>Website:</strong>{" "}
            {business.website || "Not provided"}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {business.address || "Not provided"}
          </p>

          <p>
            <strong>City:</strong>{" "}
            {business.city || "Not provided"}
          </p>

          <p>
            <strong>Country:</strong>{" "}
            {business.country || "Not provided"}
          </p>

          <p>
            <strong>Timezone:</strong>{" "}
            {business.timezone || "Not provided"}
          </p>
        </div>
      </div>
    </main>
  );
}