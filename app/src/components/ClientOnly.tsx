"use client";
import { useEffect, useState } from "react";

// Avoids SSR/CSR hydration mismatches when wallet-adapter mutates the DOM.
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
