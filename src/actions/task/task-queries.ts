"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-server";
import {
  type ActionResult,
  success,
  failure,
  type Task,
  type DateTasks,
  type SearchTasksResult,
  type MonthlyTaskStats,
} from "@/types";
import {
  getTasksByDateSchema,
  searchTasksSchema,
  getMonthlyTaskStatsSchema,
  type GetTasksByDateInput,
  type SearchTasksInput,
  type GetMonthlyTaskStatsInput,
} from "@/lib/validations";
import {
  getTodayInJST,
  getDateRangeInJST,
  getMonthRangeInJST,
  formatDateToJST,
} from "@/lib/dateUtils";
import { ERROR_MESSAGES } from "@/lib/constants";
import { toTask } from "@/lib/task-helpers";

/**
 * 指定した日付のタスクを取得します。
 *
 * @param input - 取得する日付情報
 * @returns 指定日のタスク情報（予定、完了、スキップの各グループ）
 *
 * @remarks
 * - 過去の日付の場合: 完了とスキップのタスクを含む
 * - 未来の日付の場合: 予定のタスクのみ
 * - すべての日付処理はJST（日本標準時）基準で行われます
 */
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

    // 過去の日付の場合、完了とスキップのタスクを取得
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

    // 指定日に予定されているタスクを取得
    // scheduledAtはDATE型なので、完全一致で検索
    const scheduledTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledAt: dateObj,
      },
      include: { category: true },
      orderBy: { displayOrder: "desc" },
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
    return failure(ERROR_MESSAGES.TASK_FETCH_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクを検索します。
 *
 * @param input - 検索条件（キーワード、ステータス、カテゴリ、優先度、日付範囲）
 * @returns 検索結果（displayOrder降順にソートされたタスク）
 *
 * @remarks
 * - キーワード検索はタイトルとメモの両方に対して、大文字小文字を区別せずに行われます
 * - 日付範囲検索はJST（日本標準時）基準で行われます
 * - displayOrderが大きい値ほど上に表示されます
 */
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

    // WHERE句の構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: user.id };

    // キーワード検索（タイトルまたはメモに含まれる）
    if (keyword && keyword.trim()) {
      where.OR = [
        { title: { contains: keyword.trim(), mode: "insensitive" } },
        { memo: { contains: keyword.trim(), mode: "insensitive" } },
      ];
    }

    // ステータスフィルタ
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    // カテゴリフィルタ
    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    // 優先度フィルタ
    if (priority !== undefined && priority !== "all") {
      where.priority = priority;
    }

    // 日付範囲フィルタ（JSTベースで日付範囲を計算）
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
      orderBy: { displayOrder: "desc" },
    });

    return success({
      tasks: tasks.map(toTask),
      total: tasks.length,
    });
  } catch (error) {
    console.error("searchTasks error:", error);
    return failure(ERROR_MESSAGES.SEARCH_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * すべてのタスクを取得します。
 *
 * @param input - フィルタ条件（カテゴリID）
 * @returns すべてのタスク（displayOrder降順にソート）
 *
 * @remarks
 * - カテゴリIDが未指定の場合、すべてのタスクを取得
 * - カテゴリIDがnullの場合、カテゴリなしのタスクのみ取得
 * - displayOrderが大きい値ほど上に表示されます
 */
export async function getAllTasks(input?: {
  categoryId?: string | null;
}): Promise<ActionResult<Task[]>> {
  try {
    const user = await getRequiredUser();

    // WHERE句の構築
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: user.id };

    // カテゴリフィルタ
    if (input?.categoryId !== undefined) {
      where.categoryId = input.categoryId;
    }
    
    const tasks = await prisma.task.findMany({
      where,
      include: { category: true },
      orderBy: { displayOrder: "desc" },
    });

    return success(tasks.map(toTask));
  } catch (error) {
    console.error("getAllTasks error:", error);
    return failure(ERROR_MESSAGES.TASK_FETCH_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * 指定月のタスク統計を取得します。
 *
 * @param input - 取得する月（YYYY-MM形式）
 * @returns 日付別のタスク統計（合計、完了、遅延、スキップの数）
 *
 * @remarks
 * - 統計には、その月に予定・完了・スキップされたすべてのタスクが含まれます
 * - 遅延は、今日時点で未完了かつ過去に予定されたタスクです
 * - すべての日付処理はJST（日本標準時）基準で行われます
 */
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

    // 月範囲を取得（YYYY-MM形式からJSTベースで月の開始と終了を計算）
    const { start: firstDay, end: lastDay } = getMonthRangeInJST(month);

    // この月に関連するすべてのタスクを取得
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        OR: [
          // この月に予定されたタスク
          {
            scheduledAt: {
              gte: firstDay,
              lte: lastDay,
            },
          },
          // この月に完了したタスク
          {
            completedAt: {
              gte: firstDay,
              lte: lastDay,
            },
          },
          // この月にスキップしたタスク
          {
            skippedAt: {
              gte: firstDay,
              lte: lastDay,
            },
          },
        ],
      },
      include: {
        category: true,
      },
    });

    // 日付別の統計を構築（JSTベースで日付を計算）
    const stats: MonthlyTaskStats = {};
    // 日付ごとの完了タスクのカテゴリを追跡
    const completedCategoriesMap = new Map<
      string,
      Map<string, { id: string; name: string; color: string | null }>
    >();

    for (const task of tasks) {
      const dates = new Set<string>();

      // 予定日を追加（JSTで日付を取得）
      if (
        task.scheduledAt &&
        task.scheduledAt >= firstDay &&
        task.scheduledAt <= lastDay
      ) {
        dates.add(formatDateToJST(task.scheduledAt));
      }

      // 完了日を追加（JSTで日付を取得）
      if (
        task.completedAt &&
        task.completedAt >= firstDay &&
        task.completedAt <= lastDay
      ) {
        dates.add(formatDateToJST(task.completedAt));
      }

      // スキップ日を追加（JSTで日付を取得）
      if (
        task.skippedAt &&
        task.skippedAt >= firstDay &&
        task.skippedAt <= lastDay
      ) {
        dates.add(formatDateToJST(task.skippedAt));
      }

      // 各関連日付の統計を更新
      for (const dateStr of dates) {
        if (!stats[dateStr]) {
          stats[dateStr] = { total: 0, completed: 0, overdue: 0, skipped: 0 };
        }

        // この日に予定されたタスクの場合、合計に加算（JSTで比較）
        const scheduledDateStr = task.scheduledAt
          ? formatDateToJST(task.scheduledAt)
          : null;
        const isScheduledForThisDay = scheduledDateStr === dateStr;

        if (isScheduledForThisDay) {
          stats[dateStr].total++;

          // 遅延チェック（今日時点で未完了かつ過去の日付）
          if (task.status === "PENDING" && dateStr < today) {
            stats[dateStr].overdue++;
          }
        }

        // この日に完了した場合、完了数に加算（JSTで比較）
        const completedDateStr = task.completedAt
          ? formatDateToJST(task.completedAt)
          : null;
        if (completedDateStr === dateStr) {
          stats[dateStr].completed++;

          // 完了タスクのカテゴリを追跡
          if (task.category) {
            if (!completedCategoriesMap.has(dateStr)) {
              completedCategoriesMap.set(dateStr, new Map());
            }
            const categoryMap = completedCategoriesMap.get(dateStr)!;
            if (!categoryMap.has(task.category.id)) {
              categoryMap.set(task.category.id, {
                id: task.category.id,
                name: task.category.name,
                color: task.category.color,
              });
            }
          }
        }

        // この日にスキップした場合、スキップ数に加算（JSTで比較）
        const skippedDateStr = task.skippedAt
          ? formatDateToJST(task.skippedAt)
          : null;
        if (skippedDateStr === dateStr) {
          stats[dateStr].skipped++;
        }
      }
    }

    // 完了カテゴリをstatsに追加
    for (const [dateStr, categoryMap] of completedCategoriesMap.entries()) {
      if (stats[dateStr]) {
        stats[dateStr].completedCategories = Array.from(categoryMap.values());
      }
    }

    return success(stats);
  } catch (error) {
    console.error("getMonthlyTaskStats error:", error);
    return failure(ERROR_MESSAGES.TASK_STATS_FAILED, "INTERNAL_ERROR");
  }
}
