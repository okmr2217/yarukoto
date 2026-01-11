"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-server";
import {
  type ActionResult,
  success,
  failure,
  type Task,
  type TodayTasks,
  type DateTasks,
  type SearchTasksResult,
  type MonthlyTaskStats,
} from "@/types";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  skipTaskSchema,
  getTasksByDateSchema,
  searchTasksSchema,
  getMonthlyTaskStatsSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type SkipTaskInput,
  type GetTasksByDateInput,
  type SearchTasksInput,
  type GetMonthlyTaskStatsInput,
} from "@/lib/validations";
import type { Task as PrismaTask, Category } from "@/generated/prisma/client";
import {
  getTodayInJST,
  getDateRangeInJST,
  getMonthRangeInJST,
  formatDateToJST,
} from "@/lib/dateUtils";

// Helper: Convert Prisma task to API task type
function toTask(task: PrismaTask & { category: Category | null }): Task {
  return {
    id: task.id,
    title: task.title,
    memo: task.memo,
    status: task.status,
    priority: task.priority,
    // scheduledAtはJSTの日付文字列として返す
    scheduledAt: task.scheduledAt ? formatDateToJST(task.scheduledAt) : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    skippedAt: task.skippedAt ? task.skippedAt.toISOString() : null,
    skipReason: task.skipReason,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    categoryId: task.categoryId,
    category: task.category
      ? {
          id: task.category.id,
          name: task.category.name,
          color: task.category.color,
        }
      : null,
  };
}

export async function getTodayTasks(): Promise<ActionResult<TodayTasks>> {
  try {
    const user = await getRequiredUser();
    const today = getTodayInJST();
    const todayDate = new Date(today);
    const { start: todayStart, end: todayEnd } = getDateRangeInJST(today);

    const [overdue, todayTasks, undated, completed, skipped] =
      await Promise.all([
        // Overdue: scheduled before today and still pending
        // scheduledAtはDATE型なので、日付として比較
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "PENDING",
            scheduledAt: { lt: todayDate },
          },
          include: { category: true },
          orderBy: { scheduledAt: "asc" },
        }),
        // Today: scheduled for today and pending
        // DATE型なので、完全一致で比較
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "PENDING",
            scheduledAt: todayDate,
          },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        }),
        // Undated: no scheduled date and pending
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "PENDING",
            scheduledAt: null,
          },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        }),
        // Completed today
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "COMPLETED",
            completedAt: { gte: todayStart, lte: todayEnd },
          },
          include: { category: true },
          orderBy: { completedAt: "desc" },
        }),
        // Skipped today
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "SKIPPED",
            skippedAt: { gte: todayStart, lte: todayEnd },
          },
          include: { category: true },
          orderBy: { skippedAt: "desc" },
        }),
      ]);

    return success({
      overdue: overdue.map(toTask),
      today: todayTasks.map(toTask),
      undated: undated.map(toTask),
      completed: completed.map(toTask),
      skipped: skipped.map(toTask),
    });
  } catch (error) {
    console.error("getTodayTasks error:", error);
    return failure("タスクの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function getTasksByDate(
  input: GetTasksByDateInput,
): Promise<ActionResult<DateTasks>> {
  try {
    const parsed = getTasksByDateSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { date } = parsed.data;
    const today = getTodayInJST();
    const isPast = date < today;
    const isFuture = date > today;
    const dateObj = new Date(date);
    const { start, end } = getDateRangeInJST(date);

    let completed: Task[] = [];
    let skipped: Task[] = [];

    // For past dates, get completed and skipped tasks
    // completedAtとskippedAtはTIMESTAMP型なので、範囲で検索
    if (isPast) {
      const [completedTasks, skippedTasks] = await Promise.all([
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "COMPLETED",
            completedAt: { gte: start, lte: end },
          },
          include: { category: true },
          orderBy: { completedAt: "desc" },
        }),
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: "SKIPPED",
            skippedAt: { gte: start, lte: end },
          },
          include: { category: true },
          orderBy: { skippedAt: "desc" },
        }),
      ]);
      completed = completedTasks.map(toTask);
      skipped = skippedTasks.map(toTask);
    }

    // Get scheduled tasks for the date
    // scheduledAtはDATE型なので、完全一致で検索
    const scheduledTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledAt: dateObj,
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return success({
      isPast,
      isFuture,
      completed,
      skipped,
      scheduled: scheduledTasks.map(toTask),
    });
  } catch (error) {
    console.error("getTasksByDate error:", error);
    return failure("タスクの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function searchTasks(
  input: SearchTasksInput,
): Promise<ActionResult<SearchTasksResult>> {
  try {
    const parsed = searchTasksSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { keyword, status, categoryId, priority, dateFrom, dateTo } =
      parsed.data;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: user.id };

    // Keyword search
    if (keyword && keyword.trim()) {
      where.OR = [
        { title: { contains: keyword.trim(), mode: "insensitive" } },
        { memo: { contains: keyword.trim(), mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    // Category filter
    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    // Priority filter
    if (priority !== undefined && priority !== "all") {
      where.priority = priority;
    }

    // Date range filter (JSTベースで日付範囲を計算)
    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) {
        const { start } = getDateRangeInJST(dateFrom);
        where.scheduledAt.gte = start;
      }
      if (dateTo) {
        const { end } = getDateRangeInJST(dateTo);
        where.scheduledAt.lte = end;
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { category: true },
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    });

    // Group by scheduled date (JSTベースで日付をグループ化)
    const groupMap = new Map<string | null, Task[]>();
    for (const task of tasks) {
      const dateKey = task.scheduledAt
        ? formatDateToJST(task.scheduledAt)
        : null;
      const existing = groupMap.get(dateKey) || [];
      existing.push(toTask(task));
      groupMap.set(dateKey, existing);
    }

    // Sort groups: dated first (descending), then null
    const groups = Array.from(groupMap.entries())
      .sort((a, b) => {
        if (a[0] === null) return 1;
        if (b[0] === null) return -1;
        return b[0].localeCompare(a[0]);
      })
      .map(([date, tasks]) => ({ date, tasks }));

    return success({
      groups,
      total: tasks.length,
    });
  } catch (error) {
    console.error("searchTasks error:", error);
    return failure("検索に失敗しました", "INTERNAL_ERROR");
  }
}

export async function createTask(
  input: CreateTaskInput,
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { title, scheduledAt, categoryId, priority, memo } = parsed.data;

    // scheduledAtはPostgreSQLのDATE型なので、YYYY-MM-DD形式の文字列をそのまま渡す
    const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;

    // Verify category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return failure("カテゴリが見つかりません", "NOT_FOUND");
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        memo: memo?.trim() || null,
        scheduledAt: parsedScheduledAt,
        categoryId: categoryId || null,
        priority: priority || null,
        userId: user.id,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("createTask error:", error);
    return failure("タスクの作成に失敗しました", "INTERNAL_ERROR");
  }
}

export async function updateTask(
  input: UpdateTaskInput,
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id, title, scheduledAt, categoryId, priority, memo } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    // Verify category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return failure("カテゴリが見つかりません", "NOT_FOUND");
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (memo !== undefined) updateData.memo = memo?.trim() || null;
    if (scheduledAt !== undefined) {
      // scheduledAtはDATE型なので、文字列をそのままDateオブジェクトに変換
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (priority !== undefined) updateData.priority = priority;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("updateTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function completeTask(input: {
  id: string;
}): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        skippedAt: null,
        skipReason: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("completeTask error:", error);
    return failure("タスクの完了に失敗しました", "INTERNAL_ERROR");
  }
}

export async function uncompleteTask(input: {
  id: string;
}): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "PENDING",
        completedAt: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("uncompleteTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function skipTask(
  input: SkipTaskInput,
): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = skipTaskSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id, reason } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "SKIPPED",
        skippedAt: new Date(),
        skipReason: reason?.trim() || null,
        completedAt: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("skipTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function unskipTask(input: {
  id: string;
}): Promise<ActionResult<{ task: Task }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "PENDING",
        skippedAt: null,
        skipReason: null,
      },
      include: { category: true },
    });

    return success({ task: toTask(task) });
  } catch (error) {
    console.error("unskipTask error:", error);
    return failure("タスクの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function deleteTask(input: {
  id: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = taskIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure("タスクが見つかりません", "NOT_FOUND");
    }

    await prisma.task.delete({ where: { id } });

    return success({ id });
  } catch (error) {
    console.error("deleteTask error:", error);
    return failure("タスクの削除に失敗しました", "INTERNAL_ERROR");
  }
}

export async function getMonthlyTaskStats(
  input: GetMonthlyTaskStatsInput,
): Promise<ActionResult<MonthlyTaskStats>> {
  try {
    const parsed = getMonthlyTaskStatsSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { month } = parsed.data;
    const today = getTodayInJST();

    // Parse month (YYYY-MM) - JSTベースで月範囲を計算
    const { start: firstDay, end: lastDay } = getMonthRangeInJST(month);

    // Get all tasks for this month
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          // Tasks scheduled in this month
          {
            scheduledAt: {
              gte: firstDay,
              lte: lastDay,
            },
          },
          // Tasks completed in this month
          {
            completedAt: {
              gte: firstDay,
              lte: lastDay,
            },
          },
          // Tasks skipped in this month
          {
            skippedAt: {
              gte: firstDay,
              lte: lastDay,
            },
          },
        ],
      },
    });

    // Build stats by date (JSTベースで日付を計算)
    const stats: MonthlyTaskStats = {};

    for (const task of tasks) {
      const dates = new Set<string>();

      // Add scheduled date (JSTで日付を取得)
      if (task.scheduledAt && task.scheduledAt >= firstDay && task.scheduledAt <= lastDay) {
        dates.add(formatDateToJST(task.scheduledAt));
      }

      // Add completed date (JSTで日付を取得)
      if (task.completedAt && task.completedAt >= firstDay && task.completedAt <= lastDay) {
        dates.add(formatDateToJST(task.completedAt));
      }

      // Add skipped date (JSTで日付を取得)
      if (task.skippedAt && task.skippedAt >= firstDay && task.skippedAt <= lastDay) {
        dates.add(formatDateToJST(task.skippedAt));
      }

      // Update stats for each relevant date
      for (const dateStr of dates) {
        if (!stats[dateStr]) {
          stats[dateStr] = { total: 0, completed: 0, overdue: 0, skipped: 0 };
        }

        // Count based on scheduled date for this day (JSTで比較)
        const scheduledDateStr = task.scheduledAt
          ? formatDateToJST(task.scheduledAt)
          : null;
        const isScheduledForThisDay = scheduledDateStr === dateStr;

        if (isScheduledForThisDay) {
          stats[dateStr].total++;

          // Check if overdue
          if (task.status === "PENDING" && dateStr < today) {
            stats[dateStr].overdue++;
          }
        }

        // Count completed on this day (JSTで比較)
        const completedDateStr = task.completedAt
          ? formatDateToJST(task.completedAt)
          : null;
        if (completedDateStr === dateStr) {
          stats[dateStr].completed++;
        }

        // Count skipped on this day (JSTで比較)
        const skippedDateStr = task.skippedAt
          ? formatDateToJST(task.skippedAt)
          : null;
        if (skippedDateStr === dateStr) {
          stats[dateStr].skipped++;
        }
      }
    }

    return success(stats);
  } catch (error) {
    console.error("getMonthlyTaskStats error:", error);
    return failure("タスク統計の取得に失敗しました", "INTERNAL_ERROR");
  }
}
