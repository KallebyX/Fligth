"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2, Plane, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moderateGalleryPost } from "@/app/actions/gallery";

const REJECT_REASONS = [
  "Conteúdo impróprio (NSFW, violência)",
  "Não é foto de aviação",
  "Possível plágio / foto roubada",
  "Qualidade muito baixa",
  "Spam ou propaganda",
];

export function ModerationRow({
  postId,
  imageUrl,
  thumbnailUrl,
  caption,
  aircraftModel,
  location,
  posterUsername,
  posterDisplayName,
  createdAt,
}: {
  postId: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  aircraftModel: string | null;
  location: string | null;
  posterUsername: string | null;
  posterDisplayName: string | null;
  createdAt: string;
}) {
  const [decision, setDecision] = useState<"none" | "approved" | "rejected">("none");
  const [showRejectMenu, setShowRejectMenu] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await moderateGalleryPost({ postId, decision: "approve" });
      if (res.ok) setDecision("approved");
      else setError(res.error);
    });
  }

  function reject(reason: string) {
    setShowRejectMenu(false);
    setError(null);
    startTransition(async () => {
      const res = await moderateGalleryPost({
        postId,
        decision: "reject",
        rejectionReason: reason,
      });
      if (res.ok) setDecision("rejected");
      else setError(res.error);
    });
  }

  if (decision !== "none") {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${
          decision === "approved"
            ? "border-grass/30 bg-grass/10"
            : "border-alert/30 bg-alert/10"
        }`}
      >
        {decision === "approved" ? (
          <Check size={18} className="text-grass-deep" />
        ) : (
          <X size={18} className="text-alert" />
        )}
        <p className="text-sm font-extrabold">
          {decision === "approved" ? "Aprovado." : "Rejeitado."}
        </p>
      </div>
    );
  }

  return (
    <div className="card-soft overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={caption ?? "Foto pendente"}
          className="h-24 w-24 shrink-0 rounded-xl bg-cloud object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-ink/60">
            {posterDisplayName ?? posterUsername ?? "Piloto"} ·{" "}
            <time className="tabular-nums">
              {new Date(createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </p>
          {caption && (
            <p className="mt-1 line-clamp-2 text-sm text-ink/80">{caption}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {aircraftModel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5 text-[11px] font-bold text-ink/70">
                <Plane size={10} />
                {aircraftModel}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5 text-[11px] font-bold text-ink/70">
                <MapPin size={10} />
                {location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-cloud-deep/30 bg-cloud/40 p-3">
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-extrabold text-sky-deep hover:underline"
        >
          Ver em tamanho real ↗
        </a>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRejectMenu((v) => !v)}
            disabled={pending}
            className="border-alert text-alert hover:bg-alert/10"
          >
            <X size={14} />
            Rejeitar
          </Button>
          <Button size="sm" onClick={approve} disabled={pending}>
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Aprovar
          </Button>
        </div>
      </div>

      {showRejectMenu && (
        <div className="border-t border-cloud-deep/30 bg-white p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/55">
            Motivo da rejeição
          </p>
          <ul className="space-y-1">
            {REJECT_REASONS.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => reject(r)}
                  disabled={pending}
                  className="w-full rounded-xl bg-cloud/60 px-3 py-2 text-left text-sm font-bold text-ink hover:bg-alert/10 hover:text-alert"
                >
                  {r}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="border-t border-alert/30 bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          Erro: {error}
        </p>
      )}
    </div>
  );
}
