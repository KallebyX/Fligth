import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav/AppShell";

// HUD lives in the trail page (app/learn/page.tsx), NOT this layout, because
// the lesson runtime (app/learn/[subject]/[lesson]) draws its own compact
// chrome (hearts + X-close + progress) and must not stack a second HUD on
// top of it.
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
