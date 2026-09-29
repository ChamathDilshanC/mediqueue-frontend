"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CircleHelp,
  Globe2,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "./providers";
import DashboardSidebar from "./ui/dashboard-sidebar";
import MorphSelect, {
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "./ui/select-morph";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="MediQueue">
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
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const navigation = [
    {
      title: t.how,
      href: "/#how-it-works",
      icon: <HeartPulse size={17} />,
      gradientFrom: "#a955ff",
      gradientTo: "#ea51ff",
    },
    {
      title: t.features,
      href: "/#features",
      icon: <Sparkles size={17} />,
      gradientFrom: "#56CCF2",
      gradientTo: "#2F80ED",
    },
    {
      title: t.faq,
      href: "/#faq",
      icon: <CircleHelp size={17} />,
      gradientFrom: "#FF9966",
      gradientTo: "#FF5E62",
    },
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
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
          {!simple && (
            <>
              <Link className="header-login" href="/login">
                {t.login}
              </Link>
              <Link className="button primary header-start" href="/register">
                {t.start}
                <ArrowUpRight size={16} />
              </Link>
              <button
                className="mobile-menu"
                aria-label={open ? t.close : t.menu}
                aria-expanded={open}
                aria-controls="mobile-navigation"
                onClick={() => setOpen(!open)}
              >
                {open ? t.close : t.menu}
              </button>
            </>
          )}
        </div>
      </div>
      {!simple && (
        <DashboardSidebar
          open={open}
          onClose={() => setOpen(false)}
          items={navigation.map(({ title, href, icon }) => ({
            title,
            href,
            icon,
          }))}
          loginHref="/login"
          loginLabel={t.login}
          actionHref="/register"
          actionLabel={t.create}
        />
      )}
    </header>
  );
}
