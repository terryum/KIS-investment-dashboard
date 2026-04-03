"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { PinLogin } from "@/components/auth/pin-login";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("pin-token");
    if (token) {
      useAuthStore.getState().setPinVerified(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return <PinLogin onSuccess={() => router.replace("/dashboard")} />;
}
