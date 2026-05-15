"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isNative, getPlatform } from "@/lib/capacitor";
import {
  isBiometricEnrolled,
  setBiometricEnrolled,
} from "@/components/auth/BiometricGate";
import { Bell, Fingerprint, KeyRound, LogOut, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerPushToken, revokePushToken } from "@/app/actions/pushToken";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

type BiometricState = "unsupported" | "off" | "on";
type PushState = "unsupported" | "denied" | "off" | "on";

export function SecuritySection({ email }: { email: string | null }) {
  const router = useRouter();
  const [bio, setBio] = useState<BiometricState | null>(null);
  const [push, setPush] = useState<PushState | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      if (!isNative()) {
        if (!cancelled) {
          setBio("unsupported");
          setPush("unsupported");
        }
        return;
      }
      try {
        const mod = await import("@aparajita/capacitor-biometric-auth");
        const status = await mod.BiometricAuth.checkBiometry();
        if (cancelled) return;
        if (!status.isAvailable) setBio("unsupported");
        else setBio(isBiometricEnrolled() ? "on" : "off");
      } catch {
        if (!cancelled) setBio("unsupported");
      }

      try {
        const { PushNotifications: PN } = await import("@capacitor/push-notifications");
        const perm = await PN.checkPermissions();
        if (cancelled) return;
        if (perm.receive === "denied") setPush("denied");
        else if (perm.receive === "granted") setPush("on");
        else setPush("off");
      } catch {
        if (!cancelled) setPush("unsupported");
      }
    }
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  async function togglePush() {
    if (push === null || push === "unsupported" || push === "denied") return;
    setPushBusy(true);
    setError(null);
    try {
      const { PushNotifications: PN } = await import("@capacitor/push-notifications");
      if (push === "off") {
        const perm = await PN.requestPermissions();
        if (perm.receive !== "granted") {
          setPush(perm.receive === "denied" ? "denied" : "off");
          return;
        }
        // Register triggers a 'registration' event with the device token.
        // We listen here briefly to capture it, then persist.
        await PN.register();
        const handle = await PN.addListener("registration", async (token) => {
          await registerPushToken({
            token: token.value,
            platform: getPlatform() as "ios" | "android",
            deviceLabel: navigator.userAgent.slice(0, 120),
          });
          setPushToken(token.value);
        });
        // Auto-remove the listener after 5s — token should arrive within ms.
        setTimeout(() => handle.remove(), 5000);
        setPush("on");
      } else {
        if (pushToken) await revokePushToken(pushToken);
        await PN.removeAllListeners();
        setPush("off");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar");
    } finally {
      setPushBusy(false);
    }
  }

  async function toggleBiometric() {
    if (bio === null || bio === "unsupported") return;
    setBusy(true);
    setError(null);
    try {
      if (bio === "off") {
        const mod = await import("@aparajita/capacitor-biometric-auth");
        await mod.BiometricAuth.authenticate({
          reason: "Ativar desbloqueio rápido",
          cancelTitle: "Cancelar",
          allowDeviceCredential: true,
          iosFallbackTitle: "Usar senha",
          androidTitle: "Confirme sua identidade",
          androidConfirmationRequired: false,
        });
        setBiometricEnrolled(true);
        setBio("on");
      } else {
        setBiometricEnrolled(false);
        setBio("off");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setBiometricEnrolled(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Card>
      <CardTitle>Segurança e sessão</CardTitle>
      <CardDesc>
        {email
          ? `Conectado como ${email}.`
          : "Gerencie acesso e bloqueio do app."}
      </CardDesc>

      <div className="mt-4 space-y-2">
        {push !== "unsupported" && (
          <Row
            icon={<Bell size={18} />}
            label="Notificações push"
            description={
              push === "on"
                ? "Você vai receber lembretes de streak, conquistas e ranking semanal."
                : push === "denied"
                  ? "Permissão foi negada. Habilite nas Configurações do iOS."
                  : push === "off"
                    ? "Receba avisos pra não perder ofensiva."
                    : "Verificando…"
            }
          >
            <Button
              size="sm"
              variant={push === "on" ? "outline" : "primary"}
              onClick={togglePush}
              disabled={pushBusy || push === null || push === "denied"}
            >
              {pushBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : push === "on" ? (
                "Desativar"
              ) : (
                "Ativar"
              )}
            </Button>
          </Row>
        )}

        {bio !== "unsupported" && (
          <Row
            icon={<Fingerprint size={18} />}
            label="Desbloqueio biométrico"
            description={
              bio === "on"
                ? "Face ID ou Touch ID pedido toda vez que você abre o app."
                : bio === "off"
                  ? "Ative para entrar mais rápido sem digitar a senha."
                  : "Verificando…"
            }
          >
            <Button
              size="sm"
              variant={bio === "on" ? "outline" : "primary"}
              onClick={toggleBiometric}
              disabled={busy || bio === null}
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : bio === "on" ? (
                "Desativar"
              ) : (
                "Ativar"
              )}
            </Button>
          </Row>
        )}

        <Row
          icon={<KeyRound size={18} />}
          label="Trocar senha"
          description="Te enviamos um link por email para criar uma nova senha."
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/forgot-password")}
          >
            Mudar
          </Button>
        </Row>

        <Row
          icon={<LogOut size={18} />}
          label="Sair da conta"
          description="Encerra a sessão neste dispositivo. Você pode entrar de volta a qualquer momento."
        >
          <Button
            size="sm"
            variant="danger"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut ? <Loader2 size={14} className="animate-spin" /> : "Sair"}
          </Button>
        </Row>

        <Row
          icon={<Trash2 size={18} />}
          label="Excluir conta permanentemente"
          description="Apaga sua conta, perfil, progresso e compras. Não pode ser desfeito. Requisito da App Store + LGPD."
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDelete(true)}
            className="border-alert text-alert hover:bg-alert/10"
          >
            Excluir
          </Button>
        </Row>

        {error && (
          <p className="rounded-xl bg-alert/10 px-3 py-2 text-sm font-bold text-alert">
            {error}
          </p>
        )}
      </div>

      <DeleteAccountDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
      />
    </Card>
  );
}

function Row({
  icon,
  label,
  description,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-cloud/60 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink/70 ring-1 ring-cloud-deep/40">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-extrabold text-ink">{label}</p>
        <p className="mt-0.5 text-xs leading-snug text-ink/65">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
