"use client";
import { Dual } from "loading-dev";
import { useLanguage } from "./providers";
export function Loader() {
  const { t } = useLanguage();
  return (
    <div className="loader" role="status">
      <Dual size={48} />
      <span>{t.submitting}</span>
    </div>
  );
}
