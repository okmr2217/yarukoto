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
  description: z.string().max(CATEGORY_CONSTANTS.DESCRIPTION_MAX_LENGTH, `説明文は${CATEGORY_CONSTANTS.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`).optional(),
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
  description: z.string().max(CATEGORY_CONSTANTS.DESCRIPTION_MAX_LENGTH, `説明文は${CATEGORY_CONSTANTS.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`).optional(),
});

export const categoryIdSchema = z.object({
  id: z.string().min(1, "カテゴリIDは必須です"),
});

export const updateCategorySortOrderSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryIdInput = z.infer<typeof categoryIdSchema>;
export type UpdateCategorySortOrderInput = z.infer<typeof updateCategorySortOrderSchema>;
