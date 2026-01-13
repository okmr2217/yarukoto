import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary font-display">404</h1>
          <h2 className="text-xl font-medium text-foreground">
            ページが見つかりません
          </h2>
          <p className="text-muted-foreground">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>
        <Button asChild>
          <Link href="/">ホームへ戻る</Link>
        </Button>
      </div>
    </div>
  );
}
