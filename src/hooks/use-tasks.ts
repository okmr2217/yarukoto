"use client";

import { useQuery } from "@tanstack/react-query";
import { getTodayTasks, getTasksByDate } from "@/actions";
import { getTodayInJST } from "@/lib/dateUtils";
import type { Task } from "@/types";

/**
 * 統合タスクデータ
 * - 今日: overdue, today, undated, completed, skipped
 * - 過去/未来: scheduled, completed, skipped
 */
export type UnifiedTasks = {
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  // 今日のみ
  overdue: Task[];
  today: Task[];
  undated: Task[];
  // 共通
  scheduled: Task[];
  completed: Task[];
  skipped: Task[];
};

/**
 * 日付に応じたタスクを取得する統合hook
 * @param date YYYY-MM-DD形式の日付文字列（省略時は今日）
 */
export function useTasks(date?: string) {
  const today = getTodayInJST();
  const targetDate = date || today;
  const isToday = targetDate === today;

  return useQuery({
    queryKey: isToday ? ["todayTasks"] : ["dateTasks", targetDate],
    queryFn: async (): Promise<UnifiedTasks> => {
      if (isToday) {
        const result = await getTodayTasks();
        if (!result.success) {
          throw new Error(result.error);
        }
        return {
          isToday: true,
          isPast: false,
          isFuture: false,
          overdue: result.data.overdue,
          today: result.data.today,
          undated: result.data.undated,
          scheduled: [],
          completed: result.data.completed,
          skipped: result.data.skipped,
        };
      } else {
        const result = await getTasksByDate({ date: targetDate });
        if (!result.success) {
          throw new Error(result.error);
        }
        return {
          isToday: false,
          isPast: result.data.isPast,
          isFuture: result.data.isFuture,
          overdue: [],
          today: [],
          undated: [],
          scheduled: result.data.scheduled,
          completed: result.data.completed,
          skipped: result.data.skipped,
        };
      }
    },
  });
}
