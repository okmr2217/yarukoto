"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCheck, ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonthlyTaskStats } from "@/hooks";
import type { DayTaskStats } from "@/types";
import { cn } from "@/lib/utils";
import {
  formatDateToJST,
  isTodayInJST,
  toJSTDate,
} from "@/lib/dateUtils";

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(new Date(0));
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatMonthYear(date: Date): string {
  const zonedDate = toJSTDate(date);
  return zonedDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
}

function getMonthString(date: Date): string {
  const zonedDate = toJSTDate(date);
  const year = zonedDate.getFullYear();
  const month = String(zonedDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

interface DateCellProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  stats?: DayTaskStats;
  onClick: () => void;
}

function DateCell({
  date,
  isToday,
  isSelected,
  stats,
  onClick,
}: DateCellProps) {
  const isEmpty = date.getTime() === 0;

  if (isEmpty) {
    return <div className="aspect-square" />;
  }

  const hasStats = stats && (stats.total > 0 || stats.completed > 0 || stats.createdCount > 0);

  const cellContent = (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-2 rounded-lg transition-colors flex flex-col items-center relative",
        "hover:bg-accent",
        "h-20 min-h-20",
        isToday && "bg-primary/10 font-bold",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        !hasStats && "text-muted-foreground",
      )}
    >
      <span className="text-base mb-1">{date.getDate()}</span>
      {hasStats ? (
        <div className="flex flex-col items-center gap-1.5 w-full mt-auto mb-0.5">
          <div className="flex items-center gap-1.5 font-semibold flex-wrap justify-center">
            {stats.createdCount > 0 && (
              <span className="flex items-center gap-0.5 text-muted-foreground">
                <PenLine className="h-2 w-2" />
                <span className="text-base leading-none">{stats.createdCount}</span>
              </span>
            )}
            {stats.total > 0 && (
              <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                <CalendarDays className="h-2 w-2" />
                <span className="text-base leading-none">{stats.total}</span>
              </span>
            )}
            {stats.completed > 0 && (
              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                <CheckCheck className="h-2 w-2" />
                <span className="text-base leading-none">{stats.completed}</span>
              </span>
            )}
          </div>
          <div className="flex gap-1 flex-wrap justify-center max-w-full min-h-2">
            {stats.completedCategories &&
              stats.completedCategories.length > 0 &&
              stats.completedCategories.slice(0, 5).map((category) => (
                <div
                  key={category.id}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: category.color || "#6b7280",
                  }}
                  title={category.name}
                />
              ))}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </button>
  );

  return cellContent;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const router = useRouter();
  const [viewDate, setViewDate] = useState(new Date());

  const monthString = getMonthString(viewDate);
  const { data: stats } = useMonthlyTaskStats(monthString);

  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  const uniqueCategories = useMemo(() => {
    if (!stats) return [];
    const map = new Map<string, { id: string; name: string; color: string | null }>();
    for (const dayStats of Object.values(stats)) {
      for (const cat of dayStats.completedCategories ?? []) {
        if (!map.has(cat.id)) map.set(cat.id, cat);
      }
    }
    return Array.from(map.values());
  }, [stats]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    const dateString = formatDateToJST(date);
    router.push(`/?date=${dateString}`);
  };

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* Header - Mobile only */}
      <header className="sticky top-0 z-10 bg-background border-b border-border md:hidden">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="ml-2 text-lg font-semibold">カレンダー</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* PC Header */}
          <header className="hidden md:flex items-center h-14 px-4 border-b border-border">
            <h1 className="text-lg font-semibold">カレンダー</h1>
          </header>

          <div className="p-4 md:p-6">
          {/* ページ説明 */}
          <p className="text-sm text-muted-foreground mb-4">
            月ごとのタスク集計を確認できます。日付をクリックするとその日のタスク一覧に移動します。
          </p>

          {/* 凡例 */}
          <div className="mb-4 text-xs text-muted-foreground border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="flex items-center gap-1">
                <PenLine className="h-3.5 w-3.5" />
                作成
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <CalendarDays className="h-3.5 w-3.5" />
                予定
              </span>
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCheck className="h-3.5 w-3.5" />
                完了
              </span>
            </div>
            {uniqueCategories.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pt-2 border-t">
                {uniqueCategories.map((cat) => (
                  <span key={cat.id} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 inline-block"
                      style={{ backgroundColor: cat.color || "#6b7280" }}
                    />
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 月選択 */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="前月"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold">
              {formatMonthYear(viewDate)}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              aria-label="次月"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* 曜日ラベル */}
          <div className="grid grid-cols-7 gap-0 md:gap-2 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-0 md:gap-2">
            {days.map((date, index) => {
              const dateString = formatDateToJST(date);
              return (
                <DateCell
                  key={index}
                  date={date}
                  isToday={isTodayInJST(date)}
                  isSelected={false}
                  stats={stats?.[dateString]}
                  onClick={() => handleSelectDate(date)}
                />
              );
            })}
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
