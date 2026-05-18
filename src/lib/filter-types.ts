export type StatusFilter = "all" | "pending" | "completed" | "skipped";
export type SortOrder = "displayOrder" | "createdAt" | "scheduledAt_asc" | "scheduledAt_desc";

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "displayOrder", label: "表示順" },
  { value: "createdAt", label: "作成日時" },
  { value: "scheduledAt_asc", label: "予定日（近い順）" },
  { value: "scheduledAt_desc", label: "予定日（遠い順）" },
];

export const KEYWORD_DEBOUNCE_MS = 300;

export type FilterValues = {
  keyword: string;
  status: StatusFilter;
  isFavorite: boolean;
  date: string;
};
