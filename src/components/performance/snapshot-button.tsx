"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCaptureSnapshot } from "./hooks";

export function SnapshotButton() {
  const capture = useCaptureSnapshot();

  return (
    <Button
      variant="outline"
      onClick={() => capture.mutate(undefined)}
      disabled={capture.isPending}
    >
      <Camera className="mr-2 size-4" />
      {capture.isPending ? "스냅샷 생성 중..." : "지금 스냅샷 찍기"}
    </Button>
  );
}
