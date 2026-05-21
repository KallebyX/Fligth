import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, UserPlus, Sparkles, Newspaper } from "lucide-react";
import { UserSearch } from "@/components/friends/UserSearch";
import { UserCard } from "@/components/friends/UserCard";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { createClient } from "@/lib/supabase/server";
import { suggestedUsers, type DiscoverUser } from "@/app/actions/discover";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tab = "following" | "followers" | "suggestions";

export default async function FriendsPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await props.searchParams;
  const tab: Tab =
    rawTab === "followers" ? "followers" : rawTab === "suggestions" ? "suggestions" : "following";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let users: DiscoverUser[] = [];

  if (tab === "following") {
    const { data: rows } = await supabase
      .from("follows")
      .select(
        "followed_id, profiles!follows_followed_id_fkey(id, username, display_name, current_league, mascot_outfit, profile_color)",
      )
      .eq("follower_id", user.id)
      .order("created_at", { ascending: false });
    const profiles = (rows ?? [])
      .map((r) => (r as unknown as { profiles: DiscoverUser | null }).profiles)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    users = await annotate(user.id, profiles);
  } else if (tab === "followers") {
    const { data: rows } = await supabase
      .from("follows")
      .select(
        "follower_id, profiles!follows_follower_id_fkey(id, username, display_name, current_league, mascot_outfit, profile_color)",
      )
      .eq("followed_id", user.id)
      .order("created_at", { ascending: false });
    const profiles = (rows ?? [])
      .map((r) => (r as unknown as { profiles: DiscoverUser | null }).profiles)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    users = await annotate(user.id, profiles);
  } else {
    const res = await suggestedUsers();
    users = res.ok ? res.users : [];
  }

  return (
    <PullToRefresh>
    <main className="container max-w-2xl space-y-5 py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Amigos</h1>
          <p className="text-sm text-ink/60">
            Encontre outros pilotos, siga e compita pelos primeiros lugares da liga.
          </p>
        </div>
        <Link href="/friends/feed">
          <Button variant="outline" size="sm">
            <Newspaper size={14} />
            Feed
          </Button>
        </Link>
      </header>

      <Card>
        <CardTitle>Buscar pilotos</CardTitle>
        <CardDesc>Procure por @ ou nome.</CardDesc>
        <div className="mt-3">
          <UserSearch />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <TabLink active={tab === "following"} href="/friends?tab=following" icon={<Users size={14} />} label="Seguindo" />
        <TabLink active={tab === "followers"} href="/friends?tab=followers" icon={<UserPlus size={14} />} label="Seguidores" />
        <TabLink active={tab === "suggestions"} href="/friends?tab=suggestions" icon={<Sparkles size={14} />} label="Sugestões" />
      </div>

      {users.length === 0 ? (
        <Card className="text-center">
          <div className="mx-auto mb-2 flex h-28 w-28 items-center justify-center">
            <Mascot
              state={tab === "followers" ? "sad" : "happy"}
              size={104}
            />
          </div>
          <CardTitle>
            {tab === "following" && "Sem ninguém na sua tripulação ainda"}
            {tab === "followers" && "Ainda sem seguidores"}
            {tab === "suggestions" && "Sem sugestões agora"}
          </CardTitle>
          <CardDesc className="mt-2">
            {tab === "following" && "Use a busca acima ou veja as sugestões — siga 3 pilotos pra liberar o feed."}
            {tab === "followers" && "Compartilhe seu perfil pra começar a juntar a tripulação."}
            {tab === "suggestions" && "Complete algumas lições pra entrar numa liga ativa."}
          </CardDesc>
          {tab !== "suggestions" && (
            <div className="mt-4 flex justify-center">
              <Link href="/friends?tab=suggestions">
                <Button variant="outline" size="md">
                  <Sparkles size={16} />
                  Ver sugestões
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-2">
          {users.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </main>
    </PullToRefresh>
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

type ProfileLite = {
  id: string;
  username: string | null;
  display_name: string | null;
  current_league: string;
  mascot_outfit: string;
  profile_color: string;
};

async function annotate(myId: string, profiles: ProfileLite[]): Promise<DiscoverUser[]> {
  if (profiles.length === 0) return [];
  const supabase = await createClient();
  const ids = profiles.map((p) => p.id);
  const [{ data: following }, { data: followers }] = await Promise.all([
    supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", myId)
      .in("followed_id", ids),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("followed_id", myId)
      .in("follower_id", ids),
  ]);
  const fSet = new Set((following ?? []).map((r) => r.followed_id));
  const bSet = new Set((followers ?? []).map((r) => r.follower_id));
  return profiles.map((p) => ({
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    current_league: p.current_league,
    mascot_outfit: p.mascot_outfit,
    profile_color: p.profile_color,
    is_following: fSet.has(p.id),
    follows_you: bSet.has(p.id),
  }));
}
