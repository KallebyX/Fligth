import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Bare layout — the exam takes the full screen; no HUD distractions during the test.
export default async function ExamLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
