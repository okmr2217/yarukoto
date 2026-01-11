import type { Task as PrismaTask, Category } from "@/generated/prisma/client";
import type { Task } from "@/types";
import { formatDateToJST } from "@/lib/dateUtils";

/**
 * Prismaのタスクオブジェクトを、APIレスポンス用のTask型に変換します。
 *
 * @param task - Prismaから取得したタスクオブジェクト（カテゴリ含む）
 * @returns API用のTask型オブジェクト
 *
 * @remarks
 * - scheduledAtはPostgreSQLのDATE型から、YYYY-MM-DD形式のJST日付文字列に変換されます
 * - completedAt, skippedAt, createdAt, updatedAtはISO 8601形式の文字列に変換されます
 * - categoryがnullの場合は、category全体がnullとして返されます
 */
export function toTask(task: PrismaTask & { category: Category | null }): Task {
  return {
    id: task.id,
    title: task.title,
    memo: task.memo,
    status: task.status,
    priority: task.priority,
    // scheduledAtはJSTの日付文字列として返す（YYYY-MM-DD形式）
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
