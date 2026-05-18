"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDueDateAlerts } from "@/hooks";

export function DueDateAlertChip({ className }: { className?: string }) {
  const { overdueCount, todayCount } = useDueDateAlerts();

  if (overdueCount === 0 && todayCount === 0) return null;

  return (
    <div className={cn("relative group", className)}>
      <Link
        href="/?sort=scheduledAt_asc"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border",
          "bg-background hover:bg-muted transition-colors text-xs",
        )}
        aria-label={`期限アラート: 期限切れ${overdueCount}件、今日が期限${todayCount}件`}
      >
        <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {overdueCount > 0 && (
          <>
            <span className="w-px h-3 bg-border" />
            <span className="font-medium text-destructive">{overdueCount}</span>
          </>
        )}
        {todayCount > 0 && (
          <>
            <span className="w-px h-3 bg-border" />
            <span className="font-medium text-amber-600 dark:text-amber-400">{todayCount}</span>
          </>
        )}
      </Link>

      {/* ツールチップ */}
      <div
        className={cn(
          "absolute top-full right-0 mt-1.5 z-50",
          "w-48 rounded-lg border border-border bg-popover px-3 py-2.5 text-xs shadow-sm",
          "pointer-events-none",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
        )}
      >
        {/* 吹き出し矢印 */}
        <div className="absolute -top-1 right-3 w-2 h-2 rotate-45 border-l border-t border-border bg-popover" />

        <div className="space-y-1.5">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
              <span className="text-muted-foreground flex-1">期限切れ</span>
              <span className="font-medium text-destructive">{overdueCount}件</span>
            </div>
          )}
          {todayCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-muted-foreground flex-1">今日が期限</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{todayCount}件</span>
            </div>
          )}
          <p className="text-muted-foreground/70 pt-1 mt-1 border-t border-border">クリックで予定日順に表示</p>
        </div>
      </div>
    </div>
  );
}
