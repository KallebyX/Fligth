"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[global] render error:", error.message, error.digest);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "2rem",
          maxWidth: "32rem",
          margin: "10vh auto",
          textAlign: "center",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem" }}>
          Algo deu errado
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          O app encontrou um erro inesperado.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: "0.75rem",
              color: "#94a3b8",
              marginBottom: "1.5rem",
            }}
          >
            Código: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#3b82f6",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "none",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
