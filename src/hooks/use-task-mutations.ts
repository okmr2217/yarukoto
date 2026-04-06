"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  skipTask,
  unskipTask,
  deleteTask,
  reorderTasks,
  toggleFavorite,
} from "@/actions";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  SkipTaskInput,
} from "@/lib/validations";
import type { Task, Category } from "@/types";

/**
 * クエリキーの型
 */
type QueryKey = readonly unknown[];

/**
 * キャッシュのスナップショット型
 */
type CacheSnapshot = {
  previousAllTasks: Array<[QueryKey, unknown]>;
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
    queryClient.invalidateQueries({ queryKey: ["allTasks"] });
  };

  /**
   * すべてのクエリをキャンセル
   */
  const cancelAllQueries = async () => {
    await queryClient.cancelQueries({ queryKey: ["allTasks"] });
  };

  /**
   * 現在のキャッシュ状態をスナップショット
   */
  const snapshotCache = (): CacheSnapshot => {
    return {
      previousAllTasks: queryClient.getQueriesData({ queryKey: ["allTasks"] }),
    };
  };

  /**
   * キャッシュをロールバック
   */
  const rollbackCache = (snapshot: CacheSnapshot) => {
    snapshot.previousAllTasks.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  };

  /**
   * allTasksキャッシュ内のタスクを更新
   */
  const updateAllTasksCache = (updater: (task: Task) => Task | null) => {
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
      const categories = queryClient.getQueryData<Category[]>(["categories"]);
      const foundCategory = categories?.find((c) => c.id === input.categoryId) ?? null;
      const tempTask: Task = {
        id: tempId,
        title: input.title,
        memo: input.memo || null,
        status: "PENDING",
        isFavorite: false,
        scheduledAt: input.scheduledAt || null,
        completedAt: null,
        skippedAt: null,
        skipReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: input.categoryId || null,
        category: foundCategory ? { id: foundCategory.id, name: foundCategory.name, color: foundCategory.color } : null,
      };

      queryClient.setQueriesData({ queryKey: ["allTasks"] }, (old: Task[] | undefined) => {
        if (!old) return old;
        return [tempTask, ...old];
      });

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

      const categories = queryClient.getQueryData<Category[]>(["categories"]);
      const newCategoryId = input.categoryId === undefined ? undefined : input.categoryId;
      const newCategory =
        newCategoryId === undefined
          ? undefined
          : newCategoryId === null
            ? null
            : (categories?.find((c) => c.id === newCategoryId) ?? undefined);

      updateAllTasksCache((task) =>
        task.id === input.id
          ? {
              ...task,
              title: input.title ?? task.title,
              memo: input.memo === undefined ? task.memo : input.memo,
              scheduledAt: input.scheduledAt === undefined ? task.scheduledAt : input.scheduledAt,
              categoryId: newCategoryId === undefined ? task.categoryId : newCategoryId,
              category:
                newCategory === undefined
                  ? task.category
                  : newCategory === null
                    ? null
                    : { id: newCategory.id, name: newCategory.name, color: newCategory.color },
              updatedAt: new Date().toISOString(),
            }
          : task
      );

      return snapshot;
    },
    onError: (_err, _input, context) => {
      if (context) rollbackCache(context);
      toast.error("タスクの更新に失敗しました");
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

      const allTasks = queryClient.getQueriesData<Task[]>({ queryKey: ["allTasks"] });
      let taskTitle: string | undefined;
      for (const [, tasks] of allTasks) {
        const found = tasks?.find((t) => t.id === id);
        if (found) {
          taskTitle = found.title;
          break;
        }
      }

      updateAllTasksCache((task) =>
        task.id === id
          ? { ...task, status: "COMPLETED" as const, completedAt: new Date().toISOString() }
          : task
      );

      return { ...snapshot, taskTitle };
    },
    onSuccess: (_data, id, context) => {
      const title = context?.taskTitle;
      toast.success(title ? `"${title}" を完了しました` : "タスクを完了しました", {
        action: {
          label: "元に戻す",
          onClick: () => uncomplete.mutate(id),
        },
      });
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
              skipReason: input.reason || null,
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

      updateAllTasksCache((task) => (task.id === id ? null : task));

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

          return [
            ...withoutTask.slice(0, newIndex),
            task,
            ...withoutTask.slice(newIndex),
          ];
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
    onSettled: invalidateAll,
  });

  const toggleFav = useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleFavorite({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onMutate: async (id) => {
      await cancelAllQueries();
      const snapshot = snapshotCache();

      updateAllTasksCache((task) =>
        task.id === id ? { ...task, isFavorite: !task.isFavorite } : task
      );

      return snapshot;
    },
    onError: (_err, _id, context) => {
      if (context) rollbackCache(context);
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
    reorderTasks: reorder,
    toggleFavorite: toggleFav,
  };
}
