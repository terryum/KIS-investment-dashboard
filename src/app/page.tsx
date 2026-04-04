"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { usePrefetchDashboard } from "@/hooks/use-prefetch";
import { PinLogin } from "@/components/auth/pin-login";
import { useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prefetch = usePrefetchDashboard();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Returning user with valid cookie → prefetch + redirect immediately
    if (document.cookie.includes("pin-token")) {
      useAuthStore.getState().setPinVerified(true);
      if (!hasPrefetched.current) {
        hasPrefetched.current = true;
        prefetch();
      }
    }
  }, [prefetch]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <PinLogin
      onSuccess={() => {
        // PIN verified → start prefetching all data before navigation
        if (!hasPrefetched.current) {
          hasPrefetched.current = true;
          prefetch();
        }
        router.replace("/dashboard");
      }}
    />
  );
}
