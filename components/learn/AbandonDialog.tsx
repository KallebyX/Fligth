"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("learn");
  return (
    <BottomSheet
      open={open}
      onClose={onCancel}
      ariaLabel={t("exitLesson")}
      maxWidth="max-w-sm"
    >
      <div className="flex items-start gap-3">
        <Mascot state="sad" size={64} />
        <div className="flex-1">
          <h2 className="text-lg font-black text-ink dark:text-cloud">
            {t("abandonTitle")}
          </h2>
          <p className="mt-1 text-sm leading-snug text-ink/70 dark:text-cloud/70">
            {t("abandonBody")}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button variant="primary" onClick={onCancel} size="md" className="w-full">
          {t("abandonStay")}
        </Button>
        <Button variant="outline" onClick={onConfirm} size="md" className="w-full">
          {t("abandonLeave")}
        </Button>
      </div>
    </BottomSheet>
  );
}

