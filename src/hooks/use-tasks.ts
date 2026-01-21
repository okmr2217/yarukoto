"use client";

import { useQuery } from "@tanstack/react-query";
import { getTasksByDate } from "@/actions";
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
    queryKey: ["dateTasks", targetDate],
    queryFn: async (): Promise<UnifiedTasks> => {
      const result = await getTasksByDate({ date: targetDate });
      if (!result.success) {
        throw new Error(result.error);
      }
      return {
        isToday: isToday,
        isPast: result.data.isPast,
        isFuture: result.data.isFuture,
        scheduled: result.data.scheduled,
        completed: result.data.completed,
        skipped: result.data.skipped,
      };
    },
  });
}
