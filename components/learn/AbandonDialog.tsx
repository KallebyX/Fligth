"use client";

import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/Mascot";
import { BottomSheet } from "@/components/ui/BottomSheet";

export function AbandonDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onCancel}
      ariaLabel="Sair da lição"
      maxWidth="max-w-sm"
    >
      <div className="flex items-start gap-3">
        <Mascot state="sad" size={64} />
        <div className="flex-1">
          <h2 className="text-lg font-black text-ink dark:text-cloud">
            Sair da lição?
          </h2>
          <p className="mt-1 text-sm leading-snug text-ink/70 dark:text-cloud/70">
            Você vai perder o progresso e XP desta sessão. As vidas
            perdidas continuam descontadas.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button variant="primary" onClick={onCancel} size="md" className="w-full">
          Continuar lição
        </Button>
        <Button variant="outline" onClick={onConfirm} size="md" className="w-full">
          Sair mesmo assim
        </Button>
      </div>
    </BottomSheet>
  );
}
