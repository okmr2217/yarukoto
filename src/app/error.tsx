"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-destructive font-display">
            Error
          </h1>
          <h2 className="text-xl font-medium text-foreground">
            エラーが発生しました
          </h2>
          <p className="text-muted-foreground">
            予期しない問題が発生しました。再度お試しください。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>再試行</Button>
          <Button variant="outline" asChild>
            <Link href="/">ホームへ戻る</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
