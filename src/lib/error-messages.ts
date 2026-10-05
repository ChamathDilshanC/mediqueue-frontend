const statusMessages: Record<number, string> = {
  400: "The request could not be completed. Check the highlighted fields and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested record could not be found. It may have been removed.",
  409: "This action conflicts with the current record state. Refresh the page and try again.",
  422: "Some information is invalid. Check the highlighted fields.",
  429: "Too many requests were sent. Wait a moment and try again.",
  500: "The service encountered an unexpected problem. Please try again.",
  502: "The service could not complete the request. Please try again.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

export function explainError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function messageForStatus(status: number, fallback?: string): string {
  return statusMessages[status] ?? fallback ?? "The request could not be completed. Please try again.";
}
