"use client";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="panel p-6 max-w-md text-center">
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-rose mb-3">
          Something went wrong
        </div>
        <p className="text-[14px] text-text-mute leading-relaxed mb-5">
          {error.message || "An unexpected error occurred."}
        </p>
        <button onClick={reset} className="btn-primary justify-center">
          Try again
        </button>
      </div>
    </div>
  );
}
