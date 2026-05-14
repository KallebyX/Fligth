import { AppNav } from "@/components/nav/AppNav";
import { BiometricEnrollPrompt } from "@/components/auth/BiometricEnrollPrompt";

/**
 * Wraps an authenticated app section with the side-nav (md+) and the
 * bottom tab bar (mobile). Pages slot in via `children` and content
 * gets the safe bottom padding so the mobile nav never overlaps.
 *
 * Each section layout still owns its own <HUD> (because the HUD reads
 * per-section data like hearts and gems). AppShell only paints the
 * outer chrome.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <div className="md:pl-56">
        <div className="pb-24 md:pb-8">{children}</div>
      </div>
      <BiometricEnrollPrompt />
    </>
  );
}
