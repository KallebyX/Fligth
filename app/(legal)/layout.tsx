import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cloud dark:bg-ink-deep">
      <header className="border-b border-cloud-deep/40 bg-white/85 backdrop-blur dark:border-ink-light/60 dark:bg-ink-mid/80">
        <div className="container flex h-14 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-sky"
          >
            <span aria-hidden>✈</span>
            <span>CMTE Lorí</span>
          </Link>
          <nav className="flex gap-4 text-sm font-bold text-ink/70 dark:text-cloud/70">
            <Link href="/privacy" className="hover:text-sky">
              Privacidade
            </Link>
            <Link href="/terms" className="hover:text-sky">
              Termos
            </Link>
            <Link href="/help" className="hover:text-sky">
              FAQ
            </Link>
            <Link href="/support" className="hover:text-sky">
              Suporte
            </Link>
          </nav>
        </div>
      </header>
      <main className="container max-w-3xl py-10 pb-24 dark:text-cloud">{children}</main>
    </div>
  );
}
