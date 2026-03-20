"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllTasks } from "@/actions";
import type { Task } from "@/types";
import type { GetAllTasksInput } from "@/lib/validations";

/**
 * すべてのタスクを取得するhook。複合フィルタ対応。
 * @param filters フィルタ条件（省略時は全タスクを取得）
 */
export function useAllTasks(filters?: GetAllTasksInput) {
  return useQuery({
    queryKey: ["allTasks", filters ?? {}],
    queryFn: async (): Promise<Task[]> => {
      const result = await getAllTasks(filters ?? {});
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}
