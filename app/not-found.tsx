import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-5 py-12 text-center">
      <Mascot state="confused" size={140} />
      <h1 className="text-3xl font-black">Saímos do mapa.</h1>
      <p className="max-w-md text-base text-ink/70">
        Essa rota não foi encontrada na carta WAC. Volte para terreno conhecido.
      </p>
      <Link href="/learn">
        <Button size="lg">Ir para as trilhas</Button>
      </Link>
    </main>
  );
}
