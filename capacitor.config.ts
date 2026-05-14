import type { CapacitorConfig } from "@capacitor/cli";

// The Capacitor shell wraps the deployed Vercel app inside a native WebView.
// Server: production URL (so Server Actions, Supabase auth and middleware work).
// During local development, you can override `server.url` to point at your laptop's IP
// (e.g. http://192.168.x.x:3000) so the device hot-reloads against `npm run dev`.

const config: CapacitorConfig = {
  appId: "br.com.capitaolori.app",
  appName: "Capitão Lorí",
  webDir: "public", // unused at runtime — server.url takes precedence
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? "https://fligth.vercel.app",
    cleartext: false,
    allowNavigation: [
      "*.supabase.co",
      "*.supabase.in",
      "*.vercel.app",
      "fligth.vercel.app",
    ],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#F1F5F9",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: "#F1F5F9",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0EA5E9",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      androidSplashResourceName: "splash",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0EA5E9",
      overlaysWebView: false,
    },
    Keyboard: {
      // Resize the body instead of the native view so safe-area-inset based
      // layouts don't shift unexpectedly when the keyboard opens.
      resize: "body",
      style: "default",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
