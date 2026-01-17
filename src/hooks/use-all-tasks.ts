"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllTasks } from "@/actions";
import type { Task } from "@/types";

/**
 * すべてのタスクを取得するhook
 * @param categoryId カテゴリID（未指定: 全タスク、null: カテゴリなし、文字列: 指定カテゴリ）
 */
export function useAllTasks(categoryId?: string | null) {
  // クエリキー: undefined="all", null="none", その他=カテゴリID
  const queryKey =
    categoryId === undefined ? "all" : categoryId === null ? "none" : categoryId;

  return useQuery({
    queryKey: ["allTasks", queryKey],
    queryFn: async (): Promise<Task[]> => {
      const result = await getAllTasks(
        categoryId !== undefined ? { categoryId } : undefined,
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}
