import { redirect } from "next/navigation";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

// Reset-password runs after the /callback exchanged the recovery code for a
// session. We verify the session server-side: if it's missing or expired,
// redirect to /forgot-password?expired=1 so the user can request a new link.
// Putting the check here (vs the previous client useEffect) aligns this
// route with every other server-rendered auth path and avoids the brief
// flash of the empty form while client JS hydrated.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/forgot-password?expired=1");

  return (
    <main className="container flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="rounded-full bg-sky/10 p-2 ring-4 ring-sky/15">
            <Mascot state="happy" size={128} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Nova senha
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Crie uma nova senha forte para sua conta.
          </p>
        </div>

        <div className="card-pop space-y-4 p-5">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
