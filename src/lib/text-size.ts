/** Per-browser text size preference, applied as page zoom on <html> before first paint. */
export const TEXT_SIZE_KEY = "mq_text_size";

export const TEXT_SIZES = [
  { key: "small", zoom: 0.9, en: "Small", si: "කුඩා" },
  { key: "default", zoom: 1, en: "Default", si: "සාමාන්‍ය" },
  { key: "large", zoom: 1.12, en: "Large", si: "විශාල" },
  { key: "xlarge", zoom: 1.25, en: "Extra large", si: "ඉතා විශාල" },
] as const;

export type TextSize = (typeof TEXT_SIZES)[number]["key"];

const keys = TEXT_SIZES.map((size) => size.key) as readonly string[];

export function isTextSize(value: unknown): value is TextSize {
  return typeof value === "string" && keys.includes(value);
}

export function currentTextSize(): TextSize {
  const value = typeof document !== "undefined" ? document.documentElement.dataset.textSize : undefined;
  return isTextSize(value) ? value : "default";
}

export function applyTextSize(size: TextSize) {
  const root = document.documentElement;
  if (size === "default") delete root.dataset.textSize;
  else root.dataset.textSize = size;
  try {
    if (size === "default") localStorage.removeItem(TEXT_SIZE_KEY);
    else localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    /* Storage can be unavailable (private mode); the choice still applies to this page. */
  }
}

/** Inline, pre-paint script: restores the saved size without a flash of the default. */
export const textSizeBootScript = `(function(){try{var s=localStorage.getItem('${TEXT_SIZE_KEY}');if(${JSON.stringify(
  keys.filter((key) => key !== "default"),
)}.indexOf(s)>-1)document.documentElement.dataset.textSize=s}catch(e){}})()`;
