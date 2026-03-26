import { z } from "zod";
import { TASK_CONSTANTS } from "@/lib/constants";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください");

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "タスク名を入力してください")
    .max(
      TASK_CONSTANTS.TITLE_MAX_LENGTH,
      `タスク名は${TASK_CONSTANTS.TITLE_MAX_LENGTH}文字以内で入力してください`,
    )
    .refine((val) => val.trim().length > 0, "タスク名を入力してください"),
  scheduledAt: dateStringSchema.optional(),
  categoryId: z.string().optional(),
  memo: z
    .string()
    .max(
      TASK_CONSTANTS.MEMO_MAX_LENGTH,
      `メモは${TASK_CONSTANTS.MEMO_MAX_LENGTH}文字以内で入力してください`,
    )
    .optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().min(1, "タスクIDは必須です"),
  title: z
    .string()
    .min(1, "タスク名を入力してください")
    .max(
      TASK_CONSTANTS.TITLE_MAX_LENGTH,
      `タスク名は${TASK_CONSTANTS.TITLE_MAX_LENGTH}文字以内で入力してください`,
    )
    .refine((val) => val.trim().length > 0, "タスク名を入力してください")
    .optional(),
  scheduledAt: dateStringSchema.nullable().optional(),
  categoryId: z.string().nullable().optional(),
  memo: z
    .string()
    .max(
      TASK_CONSTANTS.MEMO_MAX_LENGTH,
      `メモは${TASK_CONSTANTS.MEMO_MAX_LENGTH}文字以内で入力してください`,
    )
    .nullable()
    .optional(),
});

export const taskIdSchema = z.object({
  id: z.string().min(1, "タスクIDは必須です"),
});

export const skipTaskSchema = z.object({
  id: z.string().min(1, "タスクIDは必須です"),
  reason: z
    .string()
    .max(
      TASK_CONSTANTS.SKIP_REASON_MAX_LENGTH,
      `理由は${TASK_CONSTANTS.SKIP_REASON_MAX_LENGTH}文字以内で入力してください`,
    )
    .optional(),
});

export const getTasksByDateSchema = z.object({
  date: dateStringSchema,
});

export const toggleFavoriteSchema = z.object({
  id: z.string().min(1, "タスクIDは必須です"),
});

export const searchTasksSchema = z.object({
  keyword: z.string().optional(),
  status: z.enum(["all", "pending", "completed", "skipped"]).optional(),
  categoryId: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
});

export const getMonthlyTaskStatsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "月はYYYY-MM形式で入力してください"),
});

export const getAllTasksSchema = z.object({
  categoryIds: z.array(z.string()).optional(),
  date: dateStringSchema.optional(),
  keyword: z.string().optional(),
  status: z.enum(["all", "pending", "completed", "skipped"]).optional(),
  isFavorite: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
export type SkipTaskInput = z.infer<typeof skipTaskSchema>;
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
export type GetTasksByDateInput = z.infer<typeof getTasksByDateSchema>;
export type SearchTasksInput = z.infer<typeof searchTasksSchema>;
export type GetMonthlyTaskStatsInput = z.infer<
  typeof getMonthlyTaskStatsSchema
>;
export type GetAllTasksInput = z.infer<typeof getAllTasksSchema>;
