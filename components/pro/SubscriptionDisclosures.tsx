import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Apple App Store Review Guideline 3.1.2 + Schedule 2 of the Apple
 * Developer Program License Agreement require this exact information
 * to be displayed on the purchase screen for auto-renewing subscriptions:
 *
 *   • Title of the subscription
 *   • Length of the subscription period
 *   • Price per unit and the unit
 *   • Statement that subscription auto-renews
 *   • Mention that user is charged for renewal within 24h of period end
 *   • How to cancel
 *   • Links to Terms of Use (EULA) and Privacy Policy
 *
 * This component renders that block. It's a server component so it
 * can be statically rendered as part of the /pro page.
 */
export function SubscriptionDisclosures() {
  const t = useTranslations("pro.disclosures");

  return (
    <section
      aria-label={t("ariaLabel")}
      className="space-y-3 rounded-2xl border border-cloud-deep bg-white px-4 py-4 text-xs leading-relaxed text-ink/70 dark:border-ink-light/60 dark:bg-ink-mid dark:text-cloud/70"
    >
      <p>
        <strong className="text-ink dark:text-cloud">{t("autoRenew.title")}</strong>{" "}
        {t("autoRenew.body")}
      </p>
      <p>{t("billing")}</p>
      <p>{t("cancel")}</p>
      <p>{t("appleDisclaimer")}</p>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        <li>
          <Link
            href="/terms"
            className="font-bold text-sky underline-offset-4 hover:underline dark:text-sky-soft"
          >
            {t("links.terms")}
          </Link>
        </li>
        <li aria-hidden className="text-ink/30 dark:text-cloud/30">·</li>
        <li>
          <Link
            href="/privacy"
            className="font-bold text-sky underline-offset-4 hover:underline dark:text-sky-soft"
          >
            {t("links.privacy")}
          </Link>
        </li>
        <li aria-hidden className="text-ink/30 dark:text-cloud/30">·</li>
        <li>
          <a
            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-sky underline-offset-4 hover:underline dark:text-sky-soft"
          >
            {t("links.eula")}
          </a>
        </li>
      </ul>
    </section>
  );
}
