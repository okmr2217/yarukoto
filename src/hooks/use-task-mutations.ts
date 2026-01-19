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
  reorderTasks,
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
 * クエリキーの型
 */
type QueryKey = readonly unknown[];

/**
 * キャッシュのスナップショット型
 */
type CacheSnapshot = {
  previousAllTasks: Array<[QueryKey, unknown]>;
  previousTodayTasks: UnifiedTasks | undefined;
  previousDateTasks: Array<[QueryKey, UnifiedTasks | undefined]>;
};

/**
 * 共通のタスク操作mutation hooks
 * 楽観的更新対応
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();

  /**
   * すべてのクエリを無効化
   */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["todayTasks"] });
    queryClient.invalidateQueries({ queryKey: ["dateTasks"] });
    queryClient.invalidateQueries({ queryKey: ["allTasks"] });
  };

  /**
   * すべてのクエリをキャンセル
   */
  const cancelAllQueries = async () => {
    await queryClient.cancelQueries({ queryKey: ["allTasks"] });
    await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
    await queryClient.cancelQueries({ queryKey: ["dateTasks"] });
  };

  /**
   * 現在のキャッシュ状態をスナップショット
   */
  const snapshotCache = (): CacheSnapshot => {
    return {
      previousAllTasks: queryClient.getQueriesData({ queryKey: ["allTasks"] }),
      previousTodayTasks: queryClient.getQueryData<UnifiedTasks>(["todayTasks"]),
      previousDateTasks: queryClient.getQueriesData<UnifiedTasks>({
        queryKey: ["dateTasks"],
      }),
    };
  };

  /**
   * キャッシュをロールバック
   */
  const rollbackCache = (snapshot: CacheSnapshot) => {
    snapshot.previousAllTasks.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
    if (snapshot.previousTodayTasks) {
      queryClient.setQueryData(["todayTasks"], snapshot.previousTodayTasks);
    }
    snapshot.previousDateTasks.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  };

  /**
   * allTasksキャッシュ内のタスクを更新
   */
  const updateAllTasksCache = (
    updater: (task: Task) => Task | null
  ) => {
    queryClient.setQueriesData({ queryKey: ["allTasks"] }, (old: Task[] | undefined) => {
      if (!old) return old;
      const updated: Task[] = [];
      for (const task of old) {
        const result = updater(task);
        if (result !== null) {
          updated.push(result);
        }
      }
      return updated;
    });
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
      category: null,
    };

    if (isForToday) {
      queryClient.setQueryData<UnifiedTasks>(["todayTasks"], (old) => {
        if (!old) return old;
        if (scheduledAt === today) {
          return { ...old, today: [...old.today, tempTask] };
        } else {
          return { ...old, undated: [...old.undated, tempTask] };
        }
      });
    } else {
      queryClient.setQueryData<UnifiedTasks>(
        ["dateTasks", scheduledAt],
        (old) => {
          if (!old) return old;
          return { ...old, scheduled: [...old.scheduled, tempTask] };
        },
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
      categoryId: input.categoryId === undefined ? oldTask.categoryId : input.categoryId,
      updatedAt: new Date().toISOString(),
    };

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
        },
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
        },
      );
    }
  };

  /**
   * 全キャッシュからタスクを検索
   */
  const findTaskInCache = (taskId: string): Task | undefined => {
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
      await cancelAllQueries();
      const snapshot = snapshotCache();

      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        title: input.title,
        memo: input.memo || null,
        status: "PENDING",
        priority: input.priority || null,
        scheduledAt: input.scheduledAt || null,
        completedAt: null,
        skippedAt: null,
        skipReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: input.categoryId || null,
        category: null,
      };

      queryClient.setQueriesData({ queryKey: ["allTasks"] }, (old: Task[] | undefined) => {
        if (!old) return old;
        return [tempTask, ...old];
      });

      addTaskToCache(input, tempId);

      return { ...snapshot, tempId };
    },
    onError: (_err, _input, context) => {
      if (context) rollbackCache(context);
    },
    onSettled: invalidateAll,
  });

  const update = useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const result = await updateTask({
        id: input.id,
        title: input.title,
        scheduledAt: input.scheduledAt,
        categoryId: input.categoryId,
        priority: input.priority,
        memo: input.memo,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onMutate: async (input) => {
      await cancelAllQueries();
      const snapshot = snapshotCache();

      updateAllTasksCache((task) =>
        task.id === input.id
          ? {
              ...task,
              title: input.title ?? task.title,
              memo: input.memo === undefined ? task.memo : input.memo,
              priority: input.priority === undefined ? task.priority : input.priority,
              scheduledAt: input.scheduledAt === undefined ? task.scheduledAt : input.scheduledAt,
              categoryId: input.categoryId === undefined ? task.categoryId : input.categoryId,
              updatedAt: new Date().toISOString(),
            }
          : task
      );

      const oldTask = findTaskInCache(input.id);
      if (oldTask) {
        updateTaskInCache(input, oldTask);
      }

      return snapshot;
    },
    onError: (_err, _input, context) => {
      if (context) rollbackCache(context);
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
    onMutate: async (id) => {
      await cancelAllQueries();
      const snapshot = snapshotCache();

      updateAllTasksCache((task) =>
        task.id === id
          ? { ...task, status: "COMPLETED" as const, completedAt: new Date().toISOString() }
          : task
      );

      return snapshot;
    },
    onError: (_err, _id, context) => {
      if (context) rollbackCache(context);
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
    onMutate: async (id) => {
      await cancelAllQueries();
      const snapshot = snapshotCache();

      updateAllTasksCache((task) =>
        task.id === id
          ? { ...task, status: "PENDING" as const, completedAt: null }
          : task
      );

      return snapshot;
    },
    onError: (_err, _id, context) => {
      if (context) rollbackCache(context);
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
    onMutate: async (input) => {
      await cancelAllQueries();
      const snapshot = snapshotCache();

      updateAllTasksCache((task) =>
        task.id === input.id
          ? {
              ...task,
              status: "SKIPPED" as const,
              skippedAt: new Date().toISOString(),
              skipReason: input.reason || null
            }
          : task
      );

      return snapshot;
    },
    onError: (_err, _input, context) => {
      if (context) rollbackCache(context);
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
    onMutate: async (id) => {
      await cancelAllQueries();
      const snapshot = snapshotCache();

      updateAllTasksCache((task) =>
        task.id === id
          ? { ...task, status: "PENDING" as const, skippedAt: null, skipReason: null }
          : task
      );

      return snapshot;
    },
    onError: (_err, _id, context) => {
      if (context) rollbackCache(context);
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
    onMutate: async (id) => {
      await cancelAllQueries();
      const snapshot = snapshotCache();

      updateAllTasksCache((task) => task.id === id ? null : task);

      return snapshot;
    },
    onError: (_err, _id, context) => {
      if (context) rollbackCache(context);
    },
    onSettled: invalidateAll,
  });

  const reorder = useMutation({
    mutationFn: async (input: {
      taskId: string;
      beforeTaskId?: string;
      afterTaskId?: string;
    }) => {
      const result = await reorderTasks(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["allTasks"] });

      const previousData: Array<[QueryKey, unknown]> = [];
      const queries = queryClient.getQueriesData({ queryKey: ["allTasks"] });
      queries.forEach(([key, data]) => {
        previousData.push([key, data]);
      });

      queries.forEach(([queryKey]) => {
        queryClient.setQueryData(queryKey, (old: Task[] | undefined) => {
          if (!old || !Array.isArray(old)) return old;

          const { taskId, beforeTaskId, afterTaskId } = input;

          const task = old.find((t) => t.id === taskId);
          if (!task) return old;

          const withoutTask = old.filter((t) => t.id !== taskId);

          let newIndex: number;
          if (beforeTaskId && afterTaskId) {
            const beforeIndex = withoutTask.findIndex((t) => t.id === beforeTaskId);
            newIndex = beforeIndex + 1;
          } else if (beforeTaskId) {
            const beforeIndex = withoutTask.findIndex((t) => t.id === beforeTaskId);
            newIndex = beforeIndex + 1;
          } else if (afterTaskId) {
            const afterIndex = withoutTask.findIndex((t) => t.id === afterTaskId);
            newIndex = afterIndex;
          } else {
            newIndex = 0;
          }

          const newOrder = [
            ...withoutTask.slice(0, newIndex),
            task,
            ...withoutTask.slice(newIndex),
          ];

          return newOrder;
        });
      });

      return { previousData };
    },
    onError: (_err, _input, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todayTasks"] });
      queryClient.invalidateQueries({ queryKey: ["dateTasks"] });
    },
  });

  return {
    createTask: create,
    updateTask: update,
    completeTask: complete,
    uncompleteTask: uncomplete,
    skipTask: skip,
    unskipTask: unskip,
    deleteTask: remove,
    reorderTasks: reorder,
  };
}
