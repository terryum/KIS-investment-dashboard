"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PIN_LENGTH = 4;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function SettingsPage() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleChangePin() {
    setMessage(null);

    if (currentPin.length !== PIN_LENGTH) {
      setMessage({ type: "error", text: "현재 PIN 4자리를 입력하세요" });
      return;
    }
    if (newPin.length !== PIN_LENGTH) {
      setMessage({ type: "error", text: "새 PIN 4자리를 입력하세요" });
      return;
    }
    if (newPin !== confirmPin) {
      setMessage({ type: "error", text: "새 PIN이 일치하지 않습니다" });
      return;
    }
    if (currentPin === newPin) {
      setMessage({
        type: "error",
        text: "현재 PIN과 다른 PIN을 입력하세요",
      });
      return;
    }

    setLoading(true);
    try {
      const currentPinHash = await hashPin(currentPin);
      const newPinHash = await hashPin(newPin);

      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPinHash, newPinHash }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({ type: "success", text: "PIN이 변경되었습니다" });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch {
      setMessage({ type: "error", text: "PIN 변경에 실패했습니다" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">설정</h2>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>PIN 변경</CardTitle>
          <CardDescription>
            로그인에 사용하는 4자리 PIN을 변경합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">현재 PIN</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              placeholder="현재 4자리 PIN"
              value={currentPin}
              onChange={(e) =>
                setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">새 PIN</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              placeholder="새 4자리 PIN"
              value={newPin}
              onChange={(e) =>
                setNewPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">새 PIN 확인</label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              placeholder="새 PIN 다시 입력"
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))
              }
            />
          </div>

          {message && (
            <p
              className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-500"}`}
            >
              {message.text}
            </p>
          )}

          <Button
            className="w-full"
            disabled={loading}
            onClick={handleChangePin}
          >
            {loading ? "변경 중..." : "PIN 변경"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
