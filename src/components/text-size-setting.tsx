"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ALargeSmall, Check } from "lucide-react";
import { useLanguage } from "./providers";
import {
  TEXT_SIZES,
  applyTextSize,
  currentTextSize,
  type TextSize,
} from "@/lib/text-size";

/** Settings card: choose the interface text size; saved in this browser. */
export function TextSizeSetting() {
  const { language } = useLanguage();
  const si = language === "si";
  const [size, setSize] = useState<TextSize>("default");
  const options = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setSize(currentTextSize()), []);

  function choose(next: TextSize, focus = false) {
    applyTextSize(next);
    setSize(next);
    if (focus) options.current[TEXT_SIZES.findIndex((s) => s.key === next)]?.focus();
  }

  // Radio-group keyboard pattern: arrows move and select, Home/End jump.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TEXT_SIZES.findIndex((s) => s.key === size);
    const last = TEXT_SIZES.length - 1;
    const target =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? Math.min(last, index + 1)
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? Math.max(0, index - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (target < 0) return;
    event.preventDefault();
    choose(TEXT_SIZES[target].key, true);
  }

  const selected = TEXT_SIZES.find((s) => s.key === size)!;
  return (
    <section className="account-card text-size-setting" aria-labelledby="text-size-title">
      <ALargeSmall size={23} aria-hidden="true" />
      <h2 id="text-size-title">{si ? "අකුරු ප්‍රමාණය" : "Text size"}</h2>
      <p id="text-size-help">
        {si
          ? "කියවීමට පහසු වන පරිදි අකුරු කුඩා හෝ විශාල කරන්න. මෙම බ්‍රවුසරයේ සුරැකේ."
          : "Make text smaller or larger so it is comfortable to read. Saved in this browser."}
      </p>
      <div
        className="text-size-options"
        role="radiogroup"
        aria-labelledby="text-size-title"
        aria-describedby="text-size-help"
        onKeyDown={onKeyDown}
      >
        {TEXT_SIZES.map((option, index) => {
          const active = option.key === size;
          return (
            <button
              key={option.key}
              ref={(element) => {
                options.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              className="text-size-option"
              onClick={() => choose(option.key)}
            >
              <span className="text-size-sample" aria-hidden="true" style={{ fontSize: `${16 * option.zoom}px` }}>
                Aa
              </span>
              <span className="text-size-label">{si ? option.si : option.en}</span>
              <span className="text-size-percent">{Math.round(option.zoom * 100)}%</span>
              {active && <Check className="text-size-check" size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <p className="text-size-status" role="status" aria-live="polite">
        {si ? "වත්මන් ප්‍රමාණය" : "Current size"}: <strong>{si ? selected.si : selected.en}</strong>
      </p>
    </section>
  );
}
