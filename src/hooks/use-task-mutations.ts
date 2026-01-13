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
import type {
  CreateTaskInput,
  UpdateTaskInput,
  SkipTaskInput,
} from "@/lib/validations";
import type { Task } from "@/types";
import type { UnifiedTasks } from "./use-tasks";
import { getTodayInJST } from "@/lib/dateUtils";

/**
 * 共通のタスク操作mutation hooks
 * 楽観的更新対応
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["todayTasks"] });
    queryClient.invalidateQueries({ queryKey: ["dateTasks"] });
  };

  /**
   * 楽観的更新用: 新規タスクをキャッシュに追加
   */
  const addTaskToCache = (input: CreateTaskInput, tempId: string) => {
    const today = getTodayInJST();
    const scheduledAt = input.scheduledAt || null;
    const isForToday = !scheduledAt || scheduledAt === today;

    const tempTask: Task = {
      id: tempId,
      title: input.title,
      memo: input.memo || null,
      status: "PENDING",
      priority: input.priority || null,
      scheduledAt,
      completedAt: null,
      skippedAt: null,
      skipReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categoryId: input.categoryId || null,
      category: null, // カテゴリはサーバーレスポンスで更新される
    };

    if (isForToday) {
      // 今日のタスクキャッシュを更新
      queryClient.setQueryData<UnifiedTasks>(["todayTasks"], (old) => {
        if (!old) return old;
        if (scheduledAt === today) {
          return { ...old, today: [...old.today, tempTask] };
        } else {
          // 日付未定
          return { ...old, undated: [...old.undated, tempTask] };
        }
      });
    } else {
      // 特定日付のキャッシュを更新
      queryClient.setQueryData<UnifiedTasks>(
        ["dateTasks", scheduledAt],
        (old) => {
          if (!old) return old;
          return { ...old, scheduled: [...old.scheduled, tempTask] };
        }
      );
    }
  };

  /**
   * 楽観的更新用: タスクをキャッシュ内で更新
   */
  const updateTaskInCache = (input: UpdateTaskInput, oldTask: Task) => {
    const today = getTodayInJST();
    const newScheduledAt =
      input.scheduledAt === undefined ? oldTask.scheduledAt : input.scheduledAt;
    const oldScheduledAt = oldTask.scheduledAt;

    const updatedTask: Task = {
      ...oldTask,
      title: input.title ?? oldTask.title,
      memo: input.memo === undefined ? oldTask.memo : input.memo,
      priority: input.priority === undefined ? oldTask.priority : input.priority,
      scheduledAt: newScheduledAt,
      categoryId:
        input.categoryId === undefined ? oldTask.categoryId : input.categoryId,
      updatedAt: new Date().toISOString(),
    };

    // 日付が変わった場合は移動処理
    const oldIsToday = !oldScheduledAt || oldScheduledAt === today;
    const newIsToday = !newScheduledAt || newScheduledAt === today;

    // 古いキャッシュからタスクを削除
    if (oldIsToday) {
      queryClient.setQueryData<UnifiedTasks>(["todayTasks"], (old) => {
        if (!old) return old;
        return {
          ...old,
          overdue: old.overdue.filter((t) => t.id !== input.id),
          today: old.today.filter((t) => t.id !== input.id),
          undated: old.undated.filter((t) => t.id !== input.id),
          completed: old.completed.filter((t) => t.id !== input.id),
          skipped: old.skipped.filter((t) => t.id !== input.id),
        };
      });
    } else {
      queryClient.setQueryData<UnifiedTasks>(
        ["dateTasks", oldScheduledAt],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            scheduled: old.scheduled.filter((t) => t.id !== input.id),
            completed: old.completed.filter((t) => t.id !== input.id),
            skipped: old.skipped.filter((t) => t.id !== input.id),
          };
        }
      );
    }

    // 新しいキャッシュにタスクを追加
    if (newIsToday) {
      queryClient.setQueryData<UnifiedTasks>(["todayTasks"], (old) => {
        if (!old) return old;
        if (newScheduledAt === today) {
          return { ...old, today: [...old.today, updatedTask] };
        } else {
          return { ...old, undated: [...old.undated, updatedTask] };
        }
      });
    } else {
      queryClient.setQueryData<UnifiedTasks>(
        ["dateTasks", newScheduledAt],
        (old) => {
          if (!old) return old;
          return { ...old, scheduled: [...old.scheduled, updatedTask] };
        }
      );
    }
  };

  /**
   * 全キャッシュからタスクを検索
   */
  const findTaskInCache = (taskId: string): Task | undefined => {
    // todayTasksから検索
    const todayData = queryClient.getQueryData<UnifiedTasks>(["todayTasks"]);
    if (todayData) {
      const allTodayTasks = [
        ...todayData.overdue,
        ...todayData.today,
        ...todayData.undated,
        ...todayData.completed,
        ...todayData.skipped,
      ];
      const found = allTodayTasks.find((t) => t.id === taskId);
      if (found) return found;
    }

    // dateTasksから検索
    const queries = queryClient.getQueriesData<UnifiedTasks>({
      queryKey: ["dateTasks"],
    });
    for (const [, data] of queries) {
      if (data) {
        const allDateTasks = [
          ...data.scheduled,
          ...data.completed,
          ...data.skipped,
        ];
        const found = allDateTasks.find((t) => t.id === taskId);
        if (found) return found;
      }
    }

    return undefined;
  };

  const create = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const result = await createTask(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onMutate: async (input) => {
      // キャンセル中のクエリを待機
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
      await queryClient.cancelQueries({ queryKey: ["dateTasks"] });

      // 以前のデータをスナップショット
      const previousTodayTasks =
        queryClient.getQueryData<UnifiedTasks>(["todayTasks"]);
      const previousDateTasks = queryClient.getQueriesData<UnifiedTasks>({
        queryKey: ["dateTasks"],
      });

      // 一時IDで楽観的更新
      const tempId = `temp-${Date.now()}`;
      addTaskToCache(input, tempId);

      return { previousTodayTasks, previousDateTasks, tempId };
    },
    onError: (_err, _input, context) => {
      // エラー時はロールバック
      if (context?.previousTodayTasks) {
        queryClient.setQueryData(["todayTasks"], context.previousTodayTasks);
      }
      if (context?.previousDateTasks) {
        for (const [queryKey, data] of context.previousDateTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
      await queryClient.cancelQueries({ queryKey: ["dateTasks"] });

      const previousTodayTasks =
        queryClient.getQueryData<UnifiedTasks>(["todayTasks"]);
      const previousDateTasks = queryClient.getQueriesData<UnifiedTasks>({
        queryKey: ["dateTasks"],
      });

      // 現在のタスクを検索
      const oldTask = findTaskInCache(input.id);
      if (oldTask) {
        updateTaskInCache(input, oldTask);
      }

      return { previousTodayTasks, previousDateTasks };
    },
    onError: (_err, _input, context) => {
      if (context?.previousTodayTasks) {
        queryClient.setQueryData(["todayTasks"], context.previousTodayTasks);
      }
      if (context?.previousDateTasks) {
        for (const [queryKey, data] of context.previousDateTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
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
