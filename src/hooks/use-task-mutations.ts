"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  skipTask,
  unskipTask,
  deleteTask,
} from "@/actions";

export interface CreateTaskInput {
  title: string;
  scheduledAt?: string;
  categoryId?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  memo?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  scheduledAt?: string | null;
  categoryId?: string | null;
  priority?: "HIGH" | "MEDIUM" | "LOW" | null;
  memo?: string | null;
}

export interface SkipTaskInput {
  id: string;
  reason?: string;
}

/**
 * 共通のタスク操作mutation hooks
 * 楽観的更新は呼び出し側で必要に応じて実装
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["todayTasks"] });
    queryClient.invalidateQueries({ queryKey: ["dateTasks"] });
  };

  const create = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const result = await createTask(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onSettled: invalidateAll,
  });

  const update = useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const result = await updateTask({
        id: input.id,
        title: input.title,
        scheduledAt: input.scheduledAt === null ? undefined : input.scheduledAt,
        categoryId: input.categoryId === null ? undefined : input.categoryId,
        priority: input.priority === null ? undefined : input.priority,
        memo: input.memo === null ? undefined : input.memo,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onSettled: invalidateAll,
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const result = await completeTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onSettled: invalidateAll,
  });

  const uncomplete = useMutation({
    mutationFn: async (id: string) => {
      const result = await uncompleteTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onSettled: invalidateAll,
  });

  const skip = useMutation({
    mutationFn: async (input: SkipTaskInput) => {
      const result = await skipTask(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onSettled: invalidateAll,
  });

  const unskip = useMutation({
    mutationFn: async (id: string) => {
      const result = await unskipTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onSettled: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.id;
    },
    onSettled: invalidateAll,
  });

  return {
    createTask: create,
    updateTask: update,
    completeTask: complete,
    uncompleteTask: uncomplete,
    skipTask: skip,
    unskipTask: unskip,
    deleteTask: remove,
  };
}
