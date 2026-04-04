"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface LastLogin {
  ip: string;
  device: string;
  at: string;
}

interface PinLoginProps {
  onSuccess: () => void;
}

export function PinLogin({ onSuccess }: PinLoginProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState<LastLogin | null>(null);
  const [showLastLogin, setShowLastLogin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setPinVerified = useAuthStore((s) => s.setPinVerified);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const submit = useCallback(
    async (pin: string) => {
      setLoading(true);
      setError(null);

      try {
        const pinHash = await hashPin(pin);
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinHash }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "인증에 실패했습니다");
          setDigits(Array(PIN_LENGTH).fill(""));
          setTimeout(() => inputRefs.current[0]?.focus(), 0);
          return;
        }

        const result = (await res.json()) as {
          success: boolean;
          lastLogin: LastLogin | null;
        };

        setPinVerified(true);

        if (result.lastLogin) {
          setLastLogin(result.lastLogin);
          setShowLastLogin(true);
        } else {
          onSuccess();
        }
      } catch {
        setError("서버 연결에 실패했습니다");
        setDigits(Array(PIN_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 0);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, setPinVerified],
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const digit = value.slice(-1);
      const next = [...digits];
      next[index] = digit;
      setDigits(next);
      setError(null);

      if (digit && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (digit && index === PIN_LENGTH - 1) {
        const pin = next.join("");
        if (pin.length === PIN_LENGTH) {
          submit(pin);
        }
      }
    },
    [digits, submit],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
      if (!pasted) return;

      const next = Array(PIN_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setDigits(next);

      if (pasted.length === PIN_LENGTH) {
        submit(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    },
    [submit],
  );

  function formatLoginTime(isoString: string): string {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const timeStr = d.toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffMin < 60) return `${timeStr} (${diffMin}분 전)`;
    if (diffHour < 24) return `${timeStr} (${diffHour}시간 전)`;
    return `${timeStr} (${diffDay}일 전)`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">KIS 투자관리</CardTitle>
          <CardDescription>4자리 PIN을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={loading}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  "w-14 h-14 text-center text-2xl font-[family-name:var(--font-geist-mono)]",
                  error && "border-red-500",
                )}
                aria-label={`PIN ${i + 1}번째 자리`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <Button
            className="w-full"
            disabled={loading || digits.some((d) => !d)}
            onClick={() => submit(digits.join(""))}
          >
            {loading ? "확인 중..." : "로그인"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showLastLogin} onOpenChange={(open) => {
        if (!open) {
          setShowLastLogin(false);
          onSuccess();
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>마지막 로그인 정보</DialogTitle>
          </DialogHeader>
          {lastLogin && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">시간</span>
                <span className="font-medium">{formatLoginTime(lastLogin.at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">기기</span>
                <span className="font-medium">{lastLogin.device}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP</span>
                <span className="font-medium font-[family-name:var(--font-geist-mono)] text-xs">{lastLogin.ip}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                본인이 아닌 로그인이 의심되면 설정에서 PIN을 변경하세요.
              </p>
            </div>
          )}
          <Button className="w-full" onClick={() => { setShowLastLogin(false); onSuccess(); }}>
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
