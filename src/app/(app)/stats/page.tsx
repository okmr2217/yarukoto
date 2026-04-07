"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, PlusCircle, CircleCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonthlyTaskStats, useCategoryStats } from "@/hooks";
import { cn } from "@/lib/utils";
import { toJSTDate, formatDateToJST } from "@/lib/dateUtils";

type Tab = "daily" | "category";

// ---- Daily Stats ----

function getMonthString(date: Date): string {
  const zonedDate = toJSTDate(date);
  const year = zonedDate.getFullYear();
  const month = String(zonedDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthYear(date: Date): string {
  return toJSTDate(date).toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
}

function formatDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${month}/${day}（${weekdays[d.getDay()]}）`;
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDateToJST(new Date());
}

function getAllDaysInMonth(year: number, month: number): string[] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }).reverse();
}

function DailyStatsTab() {
  const router = useRouter();
  const [viewDate, setViewDate] = useState(new Date());
  const monthString = getMonthString(viewDate);
  const { data: stats, isLoading } = useMonthlyTaskStats(monthString);

  const zonedDate = toJSTDate(viewDate);
  const todayStr = formatDateToJST(new Date());
  const allDays = getAllDaysInMonth(zonedDate.getFullYear(), zonedDate.getMonth()).filter(
    (d) => d <= todayStr,
  );

  return (
    <div>
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          aria-label="前月"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-base font-semibold">{formatMonthYear(viewDate)}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          aria-label="次月"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">日付</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                  <span className="flex items-center justify-end gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />作成
                  </span>
                </th>
                <th className="text-right px-3 py-2 font-medium text-green-600 dark:text-green-400">
                  <span className="flex items-center justify-end gap-1">
                    <CircleCheck className="h-3.5 w-3.5" />完了
                  </span>
                </th>
                <th className="text-right px-3 py-2 font-medium text-yellow-600">
                  <span className="flex items-center justify-end gap-1">
                    <Ban className="h-3.5 w-3.5" />やらない
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {allDays.map((dateStr) => {
                const s = stats?.[dateStr];
                const today = isToday(dateStr);
                return (
                  <tr
                    key={dateStr}
                    onClick={() => router.push(`/?date=${dateStr}`)}
                    className={cn(
                      "border-b last:border-0 cursor-pointer transition-colors hover:bg-accent",
                      today && "bg-primary/10",
                    )}
                  >
                    <td className={cn("px-3 py-2.5", today && "text-primary font-semibold")}>
                      {formatDayLabel(dateStr)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium text-muted-foreground">
                      {s?.createdCount ?? 0}
                    </td>
                    <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", s?.completed ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                      {s?.completed ?? 0}
                    </td>
                    <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", s?.skipped ? "text-yellow-600" : "text-muted-foreground")}>
                      {s?.skipped ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Category Stats ----

function CategoryStatsTab() {
  const { data: stats, isLoading } = useCategoryStats();

  return (
    <div>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!stats || stats.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-8">データがありません</p>
      )}

      {!isLoading && stats && stats.length > 0 && (
        <div className="space-y-2">
          {stats.map((s, i) => {
            const completionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
            return (
              <div key={i} className="border rounded-lg px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  {s.color ? (
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground/30" />
                  )}
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{completionRate}%</span>
                </div>

                {/* 完了率バー */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>計 {s.total}</span>
                  <span className="text-green-600 dark:text-green-400">完了 {s.completed}</span>
                  <span>スキップ {s.skipped}</span>
                  {s.overdue > 0 && (
                    <span className="text-destructive">期限切れ {s.overdue}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Page ----

export default function StatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "daily" ? "daily" : "category";

  const setTab = (t: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (t === "category") {
      params.delete("tab");
    } else {
      params.set("tab", t);
    }
    const qs = params.toString();
    router.push(qs ? `/stats?${qs}` : "/stats");
  };

  return (
    <div className="flex-1 bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-4 pb-20 md:pb-4">
          <h1 className="text-lg font-semibold mb-1.5">統計</h1>
          <p className="text-xs text-muted-foreground mb-4">タスクの傾向を確認できます。</p>

          {/* タブ */}
          <div className="flex gap-1 mb-4 border-b">
            {(["category", "daily"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "category" ? "カテゴリ" : "日次"}
              </button>
            ))}
          </div>

          {tab === "category" ? <CategoryStatsTab /> : <DailyStatsTab />}
        </div>
      </div>
    </div>
  );
}
