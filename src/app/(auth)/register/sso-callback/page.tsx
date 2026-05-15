"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SSOCallbackContent() {
  const searchParams = useSearchParams();

  if (typeof window !== "undefined") {
    const params = searchParams.toString();
    window.location.href = `/register?${params}`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirigiendo...</div>
    </div>
  );
}

export default function SSOCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirigiendo...</div>
      </div>
    }>
      <SSOCallbackContent />
    </Suspense>
  );
}