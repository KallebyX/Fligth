import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, country_code, profile_color, profile_public")
    .eq("id", user.id)
    .single();

  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <ChevronLeft size={16} />
        Voltar
      </Link>

      <header>
        <h1 className="text-3xl font-black">Editar perfil</h1>
        <p className="text-sm text-ink/60">
          Personalize como o mundo vê o piloto.
        </p>
      </header>

      <EditProfileForm
        initial={{
          username: profile?.username ?? null,
          display_name: profile?.display_name ?? null,
          bio: profile?.bio ?? null,
          country_code: profile?.country_code ?? null,
          profile_color: profile?.profile_color ?? "sky",
          profile_public: profile?.profile_public ?? true,
        }}
      />
    </main>
  );
}
