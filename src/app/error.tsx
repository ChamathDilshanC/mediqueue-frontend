"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MediQueue page error", error);
  }, [error]);

  return (
    <main className="global-error-page" role="alert">
      <div className="global-error-card">
        <span className="global-error-icon" aria-hidden="true">
          <AlertTriangle />
        </span>
        <p className="global-error-kicker">Something went wrong</p>
        <h1>We could not load this page</h1>
        <p className="global-error-message">
          The page encountered an unexpected problem. Your saved information is
          safe. Try again, or return to the home page.
        </p>
        <div className="global-error-actions">
          <button className="button primary" onClick={() => reset()}>
            <RefreshCw size={16} /> Try again
          </button>
          <a className="button secondary" href="/">
            <Home size={16} /> Go home
          </a>
        </div>
      </div>
    </main>
  );
}
