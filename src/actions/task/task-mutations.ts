"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-server";
import { type ActionResult, success, failure, type Task } from "@/types";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  skipTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type SkipTaskInput,
} from "@/lib/validations";
import { ERROR_MESSAGES } from "@/lib/constants";
import { toTask } from "@/lib/task-helpers";

/**
 * タスクを作成します。
 *
 * @param input - タスク作成情報（タイトル、予定日、カテゴリ、優先度、メモ）
 * @returns 作成されたタスク
 *
 * @remarks
 * - タイトルとメモは前後の空白が自動的に削除されます
 * - カテゴリIDが指定された場合、そのカテゴリがユーザーのものであることを確認します
 * - scheduledAtはYYYY-MM-DD形式の文字列で、PostgreSQLのDATE型に格納されます
 */
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

    // scheduledAtはPostgreSQLのDATE型なので、YYYY-MM-DD形式の文字列をDateオブジェクトに変換
    const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;

    // カテゴリが指定された場合、ユーザーに属することを確認
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return failure(ERROR_MESSAGES.CATEGORY_NOT_FOUND, "NOT_FOUND");
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
    return failure(ERROR_MESSAGES.TASK_CREATE_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクを更新します。
 *
 * @param input - タスク更新情報（ID、タイトル、予定日、カテゴリ、優先度、メモ）
 * @returns 更新されたタスク
 *
 * @remarks
 * - タスクがユーザーのものであることを確認します
 * - カテゴリIDが指定された場合、そのカテゴリがユーザーのものであることを確認します
 * - undefinedのフィールドは更新されません（部分更新をサポート）
 * - タイトルとメモは前後の空白が自動的に削除されます
 */
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

    // タスクがユーザーに属することを確認
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure(ERROR_MESSAGES.TASK_NOT_FOUND, "NOT_FOUND");
    }

    // カテゴリが指定された場合、ユーザーに属することを確認
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId: user.id },
      });
      if (!category) {
        return failure(ERROR_MESSAGES.CATEGORY_NOT_FOUND, "NOT_FOUND");
      }
    }

    // 更新データを構築（undefinedのフィールドは更新しない）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (memo !== undefined) updateData.memo = memo?.trim() || null;
    if (scheduledAt !== undefined) {
      // scheduledAtはDATE型なので、文字列をDateオブジェクトに変換
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
    return failure(ERROR_MESSAGES.TASK_UPDATE_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクを完了としてマークします。
 *
 * @param input - タスクID
 * @returns 更新されたタスク
 *
 * @remarks
 * - タスクがユーザーのものであることを確認します
 * - ステータスを「COMPLETED」に設定し、完了日時を現在時刻に設定します
 * - スキップ情報（skippedAt, skipReason）はクリアされます
 */
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

    // タスクがユーザーに属することを確認
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure(ERROR_MESSAGES.TASK_NOT_FOUND, "NOT_FOUND");
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
    return failure(ERROR_MESSAGES.TASK_COMPLETE_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクの完了を取り消します。
 *
 * @param input - タスクID
 * @returns 更新されたタスク
 *
 * @remarks
 * - タスクがユーザーのものであることを確認します
 * - ステータスを「PENDING」に戻し、完了日時をクリアします
 */
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

    // タスクがユーザーに属することを確認
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure(ERROR_MESSAGES.TASK_NOT_FOUND, "NOT_FOUND");
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
    return failure(ERROR_MESSAGES.TASK_UPDATE_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクをスキップとしてマークします。
 *
 * @param input - タスクIDとスキップ理由（任意）
 * @returns 更新されたタスク
 *
 * @remarks
 * - タスクがユーザーのものであることを確認します
 * - ステータスを「SKIPPED」に設定し、スキップ日時を現在時刻に設定します
 * - 完了情報（completedAt）はクリアされます
 * - スキップ理由は前後の空白が自動的に削除されます
 */
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

    // タスクがユーザーに属することを確認
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure(ERROR_MESSAGES.TASK_NOT_FOUND, "NOT_FOUND");
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
    return failure(ERROR_MESSAGES.TASK_UPDATE_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクのスキップを取り消します。
 *
 * @param input - タスクID
 * @returns 更新されたタスク
 *
 * @remarks
 * - タスクがユーザーのものであることを確認します
 * - ステータスを「PENDING」に戻し、スキップ情報（skippedAt, skipReason）をクリアします
 */
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

    // タスクがユーザーに属することを確認
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure(ERROR_MESSAGES.TASK_NOT_FOUND, "NOT_FOUND");
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
    return failure(ERROR_MESSAGES.TASK_UPDATE_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクを削除します。
 *
 * @param input - タスクID
 * @returns 削除されたタスクのID
 *
 * @remarks
 * - タスクがユーザーのものであることを確認します
 * - 削除は物理削除（データベースから完全に削除）されます
 */
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

    // タスクがユーザーに属することを確認
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingTask) {
      return failure(ERROR_MESSAGES.TASK_NOT_FOUND, "NOT_FOUND");
    }

    await prisma.task.delete({ where: { id } });

    return success({ id });
  } catch (error) {
    console.error("deleteTask error:", error);
    return failure(ERROR_MESSAGES.TASK_DELETE_FAILED, "INTERNAL_ERROR");
  }
}

/**
 * タスクの並び順を更新します。
 *
 * @param input - タスクIDの配列（新しい順序）
 * @returns 成功ステータス
 *
 * @remarks
 * - すべてのタスクがユーザーのものであることを確認します
 * - 配列の順序に基づいてdisplayOrderを設定します（0から始まる連番）
 */
export async function reorderTasks(input: {
  taskIds: string[];
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await getRequiredUser();
    const { taskIds } = input;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return failure("タスクIDの配列が必要です", "VALIDATION_ERROR");
    }

    // すべてのタスクがユーザーに属することを確認
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId: user.id,
      },
    });

    if (tasks.length !== taskIds.length) {
      return failure(ERROR_MESSAGES.TASK_NOT_FOUND, "NOT_FOUND");
    }

    // トランザクションで並び順を一括更新
    await prisma.$transaction(
      taskIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: { displayOrder: index },
        }),
      ),
    );

    return success({ success: true });
  } catch (error) {
    console.error("reorderTasks error:", error);
    return failure(ERROR_MESSAGES.TASK_UPDATE_FAILED, "INTERNAL_ERROR");
  }
}
