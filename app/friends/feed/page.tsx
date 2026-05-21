import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/friends/ActivityFeed";
import { getDiscoverFeed, getFollowingFeed } from "@/app/actions/feed";
import { createClient } from "@/lib/supabase/server";
import { Users, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tab = "amigos" | "descobrir";

export default async function FeedPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: raw } = await props.searchParams;
  const tab: Tab = raw === "descobrir" ? "descobrir" : "amigos";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const res =
    tab === "amigos" ? await getFollowingFeed(null) : await getDiscoverFeed(null);
  const items = res.ok ? res.items : [];
  const nextCursor = res.ok ? res.nextCursor : null;

  return (
    <main className="container max-w-xl space-y-5 py-6">
      <header>
        <h1 className="text-3xl font-black dark:text-cloud">Feed</h1>
        <p className="text-sm text-ink/60 dark:text-cloud/60">
          Acompanhe as conquistas dos seus amigos e descubra novos pilotos.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <TabLink
          active={tab === "amigos"}
          href="/friends/feed?tab=amigos"
          icon={<Users size={14} />}
          label="Amigos"
        />
        <TabLink
          active={tab === "descobrir"}
          href="/friends/feed?tab=descobrir"
          icon={<Compass size={14} />}
          label="Descobrir"
        />
      </div>

      <ActivityFeed
        source={tab === "amigos" ? "following" : "discover"}
        initialItems={items}
        initialNextCursor={nextCursor}
        emptyState={
          tab === "amigos" ? (
            <Card>
              <CardTitle>Sem atividades por aqui ainda</CardTitle>
              <CardDesc className="mt-2">
                Comece seguindo outros pilotos para ver o que eles andam fazendo.
              </CardDesc>
              <div className="mt-3 flex gap-2">
                <Link href="/friends?tab=suggestions">
                  <Button variant="outline" size="md">
                    Ver sugestões
                  </Button>
                </Link>
                <Link href="/friends">
                  <Button variant="ghost" size="md">
                    Buscar amigos
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card>
              <CardTitle>O feed está calmo</CardTitle>
              <CardDesc className="mt-2">
                Volte em breve — os destaques da comunidade aparecem aqui.
              </CardDesc>
            </Card>
          )
        }
      />
    </main>
  );
}

function TabLink({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-colors",
        active
          ? "border-sky bg-sky text-white"
          : "border-cloud-deep bg-white text-ink/70 hover:bg-cloud",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
