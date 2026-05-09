import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamRunner } from "@/components/exam/ExamRunner";

export const dynamic = "force-dynamic";

export default async function ExamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ExamRunner />;
}
