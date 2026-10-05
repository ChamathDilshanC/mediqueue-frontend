export const DATA_UPDATED_EVENT = "mediqueue:data-updated";

export function notifyDataUpdated() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
}
