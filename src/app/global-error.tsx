"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MediQueue global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="global-error-page" role="alert">
          <div className="global-error-card">
            <p className="global-error-kicker">MediQueue</p>
            <h1>We could not open the application</h1>
            <p className="global-error-message">
              An unexpected application error occurred. Please reload and try
              again.
            </p>
            <button className="button primary" onClick={() => reset()}>
              Reload application
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
