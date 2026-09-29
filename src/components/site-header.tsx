"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Globe2, Menu, X } from "lucide-react";
import { useLanguage } from "./providers";
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
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        {!simple && (
          <nav className="desktop-nav" aria-label={t.menu}>
            <a href="/#how-it-works">{t.how}</a>
            <a href="/#features">{t.features}</a>
            <a href="/#faq">{t.faq}</a>
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
                className="icon-button mobile-menu"
                aria-label={open ? t.close : t.menu}
                aria-expanded={open}
                aria-controls="mobile-navigation"
                onClick={() => setOpen(!open)}
              >
                {open ? <X /> : <Menu />}
              </button>
            </>
          )}
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label={t.menu}
          onClick={() => setOpen(false)}
        >
          <a href="/#how-it-works">{t.how}</a>
          <a href="/#features">{t.features}</a>
          <a href="/#faq">{t.faq}</a>
          <Link href="/login">{t.login}</Link>
          <Link href="/register">{t.create}</Link>
        </nav>
      )}
    </header>
  );
}
