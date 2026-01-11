import { z } from "zod";
import { CATEGORY_CONSTANTS } from "@/lib/constants";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "カラーコードは#RRGGBB形式で入力してください");

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "カテゴリ名を入力してください")
    .max(
      CATEGORY_CONSTANTS.NAME_MAX_LENGTH,
      `カテゴリ名は${CATEGORY_CONSTANTS.NAME_MAX_LENGTH}文字以内で入力してください`,
    )
    .refine((val) => val.trim().length > 0, "カテゴリ名を入力してください"),
  color: hexColorSchema,
});

export const updateCategorySchema = z.object({
  id: z.string().min(1, "カテゴリIDは必須です"),
  name: z
    .string()
    .min(1, "カテゴリ名を入力してください")
    .max(
      CATEGORY_CONSTANTS.NAME_MAX_LENGTH,
      `カテゴリ名は${CATEGORY_CONSTANTS.NAME_MAX_LENGTH}文字以内で入力してください`,
    )
    .refine((val) => val.trim().length > 0, "カテゴリ名を入力してください")
    .optional(),
  color: hexColorSchema.optional(),
});

export const categoryIdSchema = z.object({
  id: z.string().min(1, "カテゴリIDは必須です"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryIdInput = z.infer<typeof categoryIdSchema>;
