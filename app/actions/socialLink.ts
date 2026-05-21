"use server";

import { createClient } from "@/lib/supabase/server";

export type LinkedProvider = "google" | "apple" | "facebook" | "twitter";

export type LinkedProvidersResult = {
  email: string | null;
  providers: LinkedProvider[];
};

// Reads which OAuth identities are linked to the current user. Renders in
// /profile/edit so users can see what's connected + add/remove providers.
export async function getLinkedProviders(): Promise<LinkedProvidersResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { email: null, providers: [] };

  // user.identities is populated by Supabase when getUser() returns —
  // safer than querying the view because identities are auth schema.
  const providers =
    (user.identities ?? [])
      .map((i) => i.provider as LinkedProvider)
      .filter((p) => p !== ("email" as LinkedProvider))
      .filter((p, idx, arr) => arr.indexOf(p) === idx) as LinkedProvider[];

  return { email: user.email ?? null, providers };
}
