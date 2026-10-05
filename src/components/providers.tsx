"use client";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";
import { MotionConfig } from "framer-motion";
import { GooeyToaster } from "goey-toast";
import { en, si, type Language, type Messages } from "@/lib/translations";
import { ThemeProvider } from "./theme-provider";
import { AnimatedSidebarProvider } from "./motion/animated-sidebar";
import { AppSidebar } from "./app-sidebar";
import { SWRConfig, useSWRConfig } from "swr";
import { DATA_UPDATED_EVENT } from "@/lib/data-sync";
const LanguageContext = createContext<{
  language: Language;
  t: Messages;
  setLanguage: (language: Language) => void;
} | null>(null);
export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    // Supabase's email links return an implicit session in a URL fragment.
    // Fragments never reach the server, and the reset screen clears it immediately.
    if (
      fragment.get("type") === "recovery" &&
      window.location.pathname !== "/reset-password"
    ) {
      window.location.replace(`/reset-password${window.location.hash}`);
    } else if (
      fragment.get("type") === "signup" &&
      fragment.has("access_token")
    ) {
      window.history.replaceState(null, "", window.location.pathname);
      window.location.replace("/login");
    }
  }, []);
  function setLanguage(value: Language) {
    updateLanguage(value);
    document.cookie = `mq_language=${value}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return (
    <DataSyncProvider>
      <LanguageContext.Provider
        value={{ language, t: language === "si" ? si : en, setLanguage }}
      >
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <AnimatedSidebarProvider className="app-shell">
              <Suspense fallback={null}>
                <AppSidebar />
              </Suspense>
              <div className="app-main">{children}</div>
            </AnimatedSidebarProvider>
          </ThemeProvider>
          <GooeyToaster
            position="bottom-right"
            preset="subtle"
            showTimestamp={false}
            closeButton
          />
        </MotionConfig>
      </LanguageContext.Provider>
    </DataSyncProvider>
  );
}

function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const onDataUpdated = () => {
      void mutate(() => true, undefined, { revalidate: true });
    };
    window.addEventListener(DATA_UPDATED_EVENT, onDataUpdated);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, onDataUpdated);
  }, [mutate]);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const request = new Request(args[0], args[1]);
      const response = await originalFetch(...args);
      if (
        response.ok &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
        new URL(request.url, window.location.origin).pathname.startsWith(
          "/api/backend/",
        )
      )
        window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <SWRConfig value={{ revalidateOnFocus: false, refreshInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("Language provider missing");
  return value;
}
