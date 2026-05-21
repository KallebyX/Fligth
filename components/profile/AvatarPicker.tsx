"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/app/actions/avatar";

const MAX_DIMENSION = 512; // Resize before upload to bound CDN bandwidth.

export function AvatarPicker({
  userId,
  initialAvatarUrl,
  outfit,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  outfit: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const resized = await resizeImage(file, MAX_DIMENSION);
      const supabase = createClient();
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, resized, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = publicData.publicUrl;

      const result = await updateAvatar(publicUrl);
      if (!result.ok) throw new Error(result.error);

      setUrl(publicUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    try {
      const result = await updateAvatar(null);
      if (!result.ok) throw new Error(result.error);
      setUrl(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-pop p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <UserAvatar avatarUrl={url} outfit={outfit} size={72} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold">Foto de perfil</h3>
          <p className="mt-0.5 text-xs text-ink/65">
            {url
              ? "Sua foto aparece no ranking, perfil público e feed."
              : "Sem foto, mostramos seu Comandante Lorí."}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Camera size={14} />
          )}
          {url ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {url && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRemove}
            disabled={busy}
            className="border-alert/40 text-alert hover:bg-alert/10"
          >
            <Trash2 size={14} />
            Remover
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Client-side image resize keeps the avatars bucket small. We render the
// uploaded image onto a square canvas, center-crop, then re-encode as JPEG
// with quality 0.85 — typically ~30-50KB.
async function resizeImage(file: File, max: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const dx = (bitmap.width - side) / 2;
  const dy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = max;
  canvas.height = max;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unsupported");
  ctx.drawImage(bitmap, dx, dy, side, side, 0, 0, max, max);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("encode_failed"));
      },
      "image/jpeg",
      0.85,
    );
  });
}
