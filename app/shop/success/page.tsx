import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { fulfillPurchase } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!sessionId) {
    return (
      <main className="container py-12 text-center">
        <p className="text-ink/70">Sessão não encontrada.</p>
      </main>
    );
  }

  // Safety net: if the webhook hasn't landed yet (network race), fulfill on
  // first success-page visit. The fulfillment is idempotent on provider_ref.
  const service = createServiceClient();
  const { data: purchase } = await service
    .from("purchases")
    .select("id, status, product_id, user_id")
    .eq("provider_ref", sessionId)
    .single();

  let messageProduct: string | null = null;

  if (purchase && purchase.user_id === user.id) {
    if (purchase.status !== "paid") {
      try {
        await fulfillPurchase(service, { providerRef: sessionId });
      } catch {
        // Stripe webhook will retry. Leave status as is.
      }
    }
    const { data: product } = await service
      .from("products")
      .select("name")
      .eq("id", purchase.product_id)
      .single();
    messageProduct = product?.name ?? null;
  }

  return (
    <main className="container flex min-h-[80vh] max-w-2xl flex-col items-center justify-center gap-6 py-12 text-center">
      <Mascot state="celebrate" size={140} />
      <h1 className="text-3xl font-black md:text-4xl">Compra confirmada!</h1>
      {messageProduct && (
        <p className="text-base text-ink/70">
          <strong>{messageProduct}</strong> já está disponível na sua conta.
        </p>
      )}
      <div className="flex gap-3">
        <Link href="/learn">
          <Button size="lg">Voltar às trilhas</Button>
        </Link>
        <Link href="/shop">
          <Button size="lg" variant="outline">
            Loja
          </Button>
        </Link>
      </div>
      <p className="max-w-md text-xs text-ink/50">
        Comprovante e nota fiscal serão enviados ao seu e-mail. Para reembolsos, escreva para
        suporte@capitaolori.app em até 7 dias.
      </p>
    </main>
  );
}
