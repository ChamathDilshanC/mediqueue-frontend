"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  CircleHelp,
  Globe2,
  HeartPulse,
  Sparkles,
  PanelLeft,
} from "lucide-react";
import { useLanguage } from "./providers";
import {
  AnimatedSidebarTrigger,
  useAnimatedSidebar,
} from "./motion/animated-sidebar";
import { ThemeToggle } from "./theme-provider";
import MorphSelect, {
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "./ui/select-morph";
export function Brand({ destination = "/" }: { destination?: string }) {
  return (
    <Link className="brand" href={destination} aria-label="MediQueue">
      <Image src="/brand/logo.png" alt="" width={38} height={38} priority />
      <span>
        MediQueue<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function LanguageSelect() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="language-select morph-language-select">
      <Globe2 size={16} aria-hidden />
      <MorphSelect
        value={language}
        onValueChange={(value) => setLanguage(value as "si" | "en")}
      >
        <MorphSelectTrigger>
          <MorphSelectValue placeholder={t.language} />
        </MorphSelectTrigger>
        <MorphSelectContent>
          <MorphSelectItem value="si">සිංහල</MorphSelectItem>
          <MorphSelectItem value="en">English</MorphSelectItem>
        </MorphSelectContent>
      </MorphSelect>
    </div>
  );
}
export function SiteHeader({ simple = false }: { simple?: boolean }) {
  const { t, language } = useLanguage();
  const { openMobile, isMobile, state } = useAnimatedSidebar();
  const pathname = usePathname();
  const workspace = pathname === "/dashboard" || pathname === "/account";
  const navigation = [
    {
      title: t.how,
      href: "/#how-it-works",
      icon: <HeartPulse size={17} />,
      gradientFrom: "#0065f8",
      gradientTo: "#0065f8",
    },
    {
      title: t.features,
      href: "/#features",
      icon: <Sparkles size={17} />,
      gradientFrom: "#4300ff",
      gradientTo: "#4300ff",
    },
    {
      title: t.faq,
      href: "/#faq",
      icon: <CircleHelp size={17} />,
      gradientFrom: "#0065f8",
      gradientTo: "#0065f8",
    },
  ];
  return (
    <header className={`site-header ${workspace ? "workspace-header" : ""}`}>
      <div className="header-inner">
        <div className="header-brand-group">
          {!pathname.startsWith("/patient") &&
            (!simple || workspace || isMobile) && (
              <AnimatedSidebarTrigger
                className={
                  workspace
                    ? "navigation-trigger"
                    : "navigation-trigger public-trigger"
                }
                aria-label={
                  isMobile
                    ? openMobile
                      ? t.close
                      : t.menu
                    : state === "expanded"
                      ? "Collapse navigation"
                      : "Expand navigation"
                }
                aria-controls="mobile-navigation"
              >
                <PanelLeft size={20} />
              </AnimatedSidebarTrigger>
            )}
          {!workspace && <Brand destination={workspace ? "/account" : "/"} />}
        </div>
        {!simple && (
          <nav className="site-header-nav" aria-label="Primary navigation">
            {navigation.map(({ title, href }) => (
              <Link key={href} href={href}>
                {title}
              </Link>
            ))}
          </nav>
        )}
        <div className="header-actions">
          <LanguageSelect />
          <ThemeToggle language={language} />
          {!simple && (
            <>
              <Link className="header-login" href="/login">
                {t.login}
              </Link>
              <Link className="button primary header-start" href="/register">
                {t.start}
                <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
