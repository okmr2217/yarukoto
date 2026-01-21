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
import type { Task, TodayTasks } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations";

// 共通のinvalidate関数
function useInvalidateTaskQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["todayTasks"] });
    queryClient.invalidateQueries({ queryKey: ["dateTasks"] });
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateTaskQueries();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const result = await createTask(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onMutate: async ({ title, scheduledAt, categoryId, priority, memo }) => {
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });

      const previous = queryClient.getQueryData<TodayTasks>(["todayTasks"]);

      // Optimistic update
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title,
        memo: memo || null,
        status: "PENDING",
        priority: priority || null,
        scheduledAt: scheduledAt || null,
        completedAt: null,
        skippedAt: null,
        skipReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: categoryId || null,
        category: null,
      };

      if (previous) {
        const today = new Date().toISOString().split("T")[0];
        const isToday = scheduledAt === today;
        const isUndated = !scheduledAt;

        queryClient.setQueryData<TodayTasks>(["todayTasks"], {
          ...previous,
          today: isToday ? [optimisticTask, ...previous.today] : previous.today,
          undated: isUndated
            ? [optimisticTask, ...previous.undated]
            : previous.undated,
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todayTasks"], context.previous);
      }
    },
    onSettled: invalidateAll,
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateTaskQueries();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await completeTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
      const previous = queryClient.getQueryData<TodayTasks>(["todayTasks"]);

      if (previous) {
        let movedTask: Task | undefined;
        const newData: TodayTasks = {
          overdue: previous.overdue.filter((t) => {
            if (t.id === id) {
              movedTask = t;
              return false;
            }
            return true;
          }),
          today: previous.today.filter((t) => {
            if (t.id === id) {
              movedTask = t;
              return false;
            }
            return true;
          }),
          undated: previous.undated.filter((t) => {
            if (t.id === id) {
              movedTask = t;
              return false;
            }
            return true;
          }),
          completed: movedTask
            ? [
                {
                  ...movedTask,
                  status: "COMPLETED" as const,
                  completedAt: new Date().toISOString(),
                },
                ...previous.completed,
              ]
            : previous.completed,
          skipped: previous.skipped,
        };
        queryClient.setQueryData(["todayTasks"], newData);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todayTasks"], context.previous);
      }
    },
    onSettled: invalidateAll,
  });
}

export function useUncompleteTask() {
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateTaskQueries();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await uncompleteTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
      const previous = queryClient.getQueryData<TodayTasks>(["todayTasks"]);

      if (previous) {
        let movedTask: Task | undefined;
        const today = new Date().toISOString().split("T")[0];

        const newCompleted = previous.completed.filter((t) => {
          if (t.id === id) {
            movedTask = t;
            return false;
          }
          return true;
        });

        if (movedTask) {
          const restoredTask: Task = {
            ...movedTask,
            status: "PENDING",
            completedAt: null,
          };

          const isToday = movedTask.scheduledAt === today;
          const isOverdue =
            movedTask.scheduledAt && movedTask.scheduledAt < today;
          const isUndated = !movedTask.scheduledAt;

          queryClient.setQueryData<TodayTasks>(["todayTasks"], {
            overdue: isOverdue
              ? [restoredTask, ...previous.overdue]
              : previous.overdue,
            today: isToday ? [restoredTask, ...previous.today] : previous.today,
            undated: isUndated
              ? [restoredTask, ...previous.undated]
              : previous.undated,
            completed: newCompleted,
            skipped: previous.skipped,
          });
        }
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todayTasks"], context.previous);
      }
    },
    onSettled: invalidateAll,
  });
}

export function useSkipTask() {
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateTaskQueries();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const result = await skipTask({ id, reason });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
      const previous = queryClient.getQueryData<TodayTasks>(["todayTasks"]);

      if (previous) {
        let movedTask: Task | undefined;
        const newData: TodayTasks = {
          overdue: previous.overdue.filter((t) => {
            if (t.id === id) {
              movedTask = t;
              return false;
            }
            return true;
          }),
          today: previous.today.filter((t) => {
            if (t.id === id) {
              movedTask = t;
              return false;
            }
            return true;
          }),
          undated: previous.undated.filter((t) => {
            if (t.id === id) {
              movedTask = t;
              return false;
            }
            return true;
          }),
          completed: previous.completed,
          skipped: movedTask
            ? [
                {
                  ...movedTask,
                  status: "SKIPPED" as const,
                  skippedAt: new Date().toISOString(),
                  skipReason: reason || null,
                },
                ...previous.skipped,
              ]
            : previous.skipped,
        };
        queryClient.setQueryData(["todayTasks"], newData);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todayTasks"], context.previous);
      }
    },
    onSettled: invalidateAll,
  });
}

export function useUnskipTask() {
  const invalidateAll = useInvalidateTaskQueries();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await unskipTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.task;
    },
    onSettled: invalidateAll,
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateTaskQueries();

  return useMutation({
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
    onMutate: async ({
      id,
      title,
      scheduledAt,
      categoryId,
      priority,
      memo,
    }) => {
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
      const previous = queryClient.getQueryData<TodayTasks>(["todayTasks"]);

      if (previous) {
        const updateTaskInList = (tasks: Task[]): Task[] =>
          tasks.map((t) => {
            if (t.id === id) {
              return {
                ...t,
                title: title ?? t.title,
                scheduledAt:
                  scheduledAt !== undefined ? scheduledAt : t.scheduledAt,
                categoryId:
                  categoryId !== undefined ? categoryId : t.categoryId,
                priority: priority !== undefined ? priority : t.priority,
                memo: memo !== undefined ? memo : t.memo,
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          });

        queryClient.setQueryData<TodayTasks>(["todayTasks"], {
          overdue: updateTaskInList(previous.overdue),
          today: updateTaskInList(previous.today),
          undated: updateTaskInList(previous.undated),
          completed: updateTaskInList(previous.completed),
          skipped: updateTaskInList(previous.skipped),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todayTasks"], context.previous);
      }
    },
    onSettled: invalidateAll,
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateTaskQueries();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTask({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todayTasks"] });
      const previous = queryClient.getQueryData<TodayTasks>(["todayTasks"]);

      if (previous) {
        queryClient.setQueryData<TodayTasks>(["todayTasks"], {
          overdue: previous.overdue.filter((t) => t.id !== id),
          today: previous.today.filter((t) => t.id !== id),
          undated: previous.undated.filter((t) => t.id !== id),
          completed: previous.completed.filter((t) => t.id !== id),
          skipped: previous.skipped.filter((t) => t.id !== id),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todayTasks"], context.previous);
      }
    },
    onSettled: invalidateAll,
  });
}
