"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Check } from "lucide-react";
import { impact, notify } from "@/lib/haptics";

const SHARE_BODY = (url: string) =>
  `Cadastre-se no Capitão Lorí pelo meu link e ganhe vidas extras pra estudar pro PPA: ${url}`;

export function InviteShare({ code, url }: { code: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    void impact("light");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      void notify("success");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text for the user to copy manually.
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  async function share() {
    void impact("medium");
    const data = {
      title: "Capitão Lorí",
      text: SHARE_BODY(url),
      url,
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        return;
      } catch {
        // User cancelled — fall through to copy.
      }
    }
    await copy();
  }

  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-widest text-ink/55 dark:text-cloud/55">
        Seu código
      </p>
      <p className="mt-1 font-mono text-3xl font-black tracking-widest text-sky">
        {code}
      </p>
      <p className="mt-3 truncate rounded-2xl bg-cloud px-3 py-2 text-xs text-ink/80 dark:bg-ink-deep/60 dark:text-cloud/80">
        {url}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button size="md" variant="outline" onClick={copy} className="w-full">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copiado!" : "Copiar link"}
        </Button>
        <Button size="md" variant="primary" onClick={share} className="w-full">
          <Share2 size={16} />
          Compartilhar
        </Button>
      </div>
    </Card>
  );
}
