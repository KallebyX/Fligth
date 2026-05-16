"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGalleryPost } from "@/app/actions/gallery";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAIN_SIDE = 1600;
const THUMB_SIDE = 400;

async function resize(file: File, maxSide: number, quality = 0.85): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_2d_unsupported");
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("encode_failed"))),
        "image/jpeg",
        quality,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function UploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [aircraft, setAircraft] = useState("");
  const [location, setLocation] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setDone(false);
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError("Foto maior que 8MB. Reduza antes de enviar.");
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Só fotos (jpg, png, heic).");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) {
      setError("Escolha uma foto primeiro.");
      return;
    }
    setError(null);
    setProgress("Otimizando imagem…");

    const supabase = createClient();
    const postUuid = crypto.randomUUID();
    const mainPath = `${userId}/${postUuid}.jpg`;
    const thumbPath = `${userId}/${postUuid}_thumb.jpg`;

    try {
      const [main, thumb] = await Promise.all([
        resize(file, MAIN_SIDE, 0.85),
        resize(file, THUMB_SIDE, 0.8),
      ]);

      setProgress("Enviando para o servidor…");
      const [mainUp, thumbUp] = await Promise.all([
        supabase.storage.from("gallery").upload(mainPath, main, {
          contentType: "image/jpeg",
          upsert: false,
        }),
        supabase.storage.from("gallery").upload(thumbPath, thumb, {
          contentType: "image/jpeg",
          upsert: false,
        }),
      ]);

      if (mainUp.error) throw mainUp.error;
      if (thumbUp.error) throw thumbUp.error;

      setProgress("Salvando post…");
      startTransition(async () => {
        const res = await createGalleryPost({
          imagePath: mainPath,
          thumbnailPath: thumbPath,
          caption: caption || null,
          aircraftModel: aircraft || null,
          location: location || null,
        });
        setProgress(null);
        if (!res.ok) {
          setError(
            res.error === "rate_limited"
              ? "Limite diário (3) atingido. Tente amanhã."
              : res.error === "caption_too_long"
                ? "Legenda muito longa (máx 280)."
                : "Erro ao salvar: " + res.error,
          );
          return;
        }
        setDone(true);
        setTimeout(() => router.push("/galeria/meus"), 1500);
      });
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : "Falha no upload");
    }
  }

  if (done) {
    return (
      <Card className="text-center">
        <CheckCircle2 size={48} className="mx-auto text-grass" />
        <h2 className="mt-3 text-lg font-black">Foto enviada!</h2>
        <p className="mt-1 text-sm text-ink/60">
          Vamos revisar e em até 24h aparece no feed (ou te avisamos se algo
          impediu).
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div
        onClick={() => fileInput.current?.click()}
        className="relative cursor-pointer rounded-2xl border-2 border-dashed border-cloud-deep bg-cloud/40 p-6 text-center hover:border-sky"
      >
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt="Pré-visualização"
            className="mx-auto max-h-64 rounded-xl object-contain"
          />
        ) : (
          <div className="space-y-2 py-6 text-ink/60">
            <ImagePlus size={36} className="mx-auto" />
            <p className="text-sm font-bold">Toque para escolher uma foto</p>
            <p className="text-xs">JPG, PNG ou HEIC · até 8MB</p>
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={pickFile}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
            Legenda (opcional, máx 280)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 280))}
            placeholder="Pôr-do-sol em Congonhas…"
            rows={3}
            className="mt-1 w-full rounded-2xl border-2 border-cloud-deep bg-white p-3 text-sm focus:border-sky focus:outline-none"
          />
          <p className="mt-1 text-right text-[11px] text-ink/40">
            {caption.length}/280
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Modelo
            </label>
            <Input
              value={aircraft}
              onChange={(e) => setAircraft(e.target.value)}
              placeholder="Cessna 152"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Local
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Aeroporto de Congonhas"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {progress && (
        <div className="flex items-center gap-2 rounded-xl bg-sky/10 px-3 py-2 text-sm font-bold text-sky-deep">
          <Loader2 size={14} className="animate-spin" />
          {progress}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Button
        onClick={upload}
        disabled={!file || pending || !!progress}
        size="lg"
        className="w-full"
      >
        {pending || progress ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <ImagePlus size={18} />
        )}
        {pending || progress ? "Enviando…" : "Enviar para moderação"}
      </Button>
    </Card>
  );
}
