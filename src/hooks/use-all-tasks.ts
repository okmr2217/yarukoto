"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllTasks } from "@/actions";
import type { Task } from "@/types";
import type { GetAllTasksInput } from "@/lib/validations";

const TASK_REFETCH_INTERVAL_MS = 60_000;

/**
 * すべてのタスクを取得するhook。複合フィルタ対応。
 * @param filters フィルタ条件（省略時は全タスクを取得）
 */
export function useAllTasks(filters?: GetAllTasksInput, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["allTasks", filters ?? {}],
    queryFn: async (): Promise<Task[]> => {
      const result = await getAllTasks(filters ?? {});
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: TASK_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}
