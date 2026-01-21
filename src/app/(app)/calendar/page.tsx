"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMonthlyTaskStats, useTasks } from "@/hooks";
import type { DayTaskStats } from "@/types";
import { cn } from "@/lib/utils";
import {
  formatDateToJST,
  isTodayInJST,
  toJSTDate,
  getTodayInJST,
  formatDateForDisplay,
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

  const hasStats = stats && stats.total > 0;

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
        <div className="flex flex-col items-center gap-2 w-full mt-auto mb-0.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-green-600 dark:text-green-400">
              ✓{stats.completed}
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              ○{stats.total}
            </span>
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

  if (!hasStats) {
    return cellContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
      <TooltipContent>
        <div className="text-sm space-y-1">
          <div>予定: {stats.total}件</div>
          <div>完了: {stats.completed}件</div>
          {stats.completedCategories && stats.completedCategories.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              <div className="text-xs text-muted-foreground">完了カテゴリ:</div>
              {stats.completedCategories.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: category.color || "#6b7280",
                    }}
                  />
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const router = useRouter();
  const today = getTodayInJST();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthString = getMonthString(viewDate);
  const { data: stats } = useMonthlyTaskStats(monthString);
  const { data: dayTasks } = useTasks(selectedDate || today);

  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
    setSelectedDate(today);
  };

  const handleSelectDate = (date: Date) => {
    const dateString = formatDateToJST(date);
    setSelectedDate(dateString);
  };

  const handleNavigateToDate = () => {
    if (selectedDate) {
      router.push(`/dates/${selectedDate}`);
    }
  };

  // 月全体の統計を計算
  const monthStats = stats
    ? Object.values(stats).reduce(
        (acc, day) => ({
          total: acc.total + day.total,
          completed: acc.completed + day.completed,
        }),
        { total: 0, completed: 0 },
      )
    : null;

  const completionRate =
    monthStats && monthStats.total > 0
      ? Math.round((monthStats.completed / monthStats.total) * 100)
      : 0;

  return (
    <div className="flex-1 bg-background flex flex-col">
      <Header />

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* カレンダーセクション */}
            <div className="lg:col-span-2">
              <div>
                {/* ヘッダー */}
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

                <TooltipProvider>
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
                          isSelected={dateString === selectedDate}
                          stats={stats?.[dateString]}
                          onClick={() => handleSelectDate(date)}
                        />
                      );
                    })}
                  </div>
                </TooltipProvider>

                {/* フッター */}
                <div className="flex justify-center mt-4 gap-2">
                  <Button variant="outline" onClick={handleToday}>
                    今日
                  </Button>
                  {selectedDate && (
                    <Button onClick={handleNavigateToDate}>
                      {selectedDate === today ? "今日" : "この日"}のタスクを見る
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* サイドバー：統計情報 */}
            <div className="space-y-6">
              {/* 月次統計 */}
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">今月の統計</h3>
                {monthStats ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          完了率
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          総タスク
                        </div>
                        <div className="text-xl font-bold">
                          {monthStats.total}
                        </div>
                      </div>
                      <div className="bg-background rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                          完了
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          {monthStats.completed}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    タスクがありません
                  </div>
                )}
              </div>

              {/* 選択日のタスク概要 */}
              {selectedDate && (
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedDate === today
                      ? "今日"
                      : formatDateForDisplay(new Date(selectedDate))}
                  </h3>
                  {dayTasks ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>予定</span>
                        <span className="font-medium">
                          {dayTasks.scheduled.length}件
                        </span>
                      </div>
                      {dayTasks.completed.length > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600">完了</span>
                          <span className="font-medium">
                            {dayTasks.completed.length}件
                          </span>
                        </div>
                      )}
                      {dayTasks.skipped.length > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">スキップ</span>
                          <span className="font-medium">
                            {dayTasks.skipped.length}件
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      タスクがありません
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
