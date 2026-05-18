import type { Category } from "@/types";

export const UNGROUPED_VIRTUAL_ID = "__ungrouped__";

export type CategoryFilter = { type: "all" } | { type: "group"; groupId: string } | { type: "category"; categoryId: string };

export function parseCategoryParam(param: string | null): CategoryFilter {
  if (param === null) return { type: "all" };
  if (param.startsWith("g:")) return { type: "group", groupId: param.slice(2) };
  if (param.startsWith("c:")) return { type: "category", categoryId: param.slice(2) };
  return { type: "all" };
}

export function categoryFilterToParam(filter: CategoryFilter): string | null {
  if (filter.type === "all") return null;
  if (filter.type === "group") return `g:${filter.groupId}`;
  return `c:${filter.categoryId}`;
}

export function resolveCategoryIds(filter: CategoryFilter, categories: Category[]): string[] | undefined {
  if (filter.type === "all") return undefined;
  if (filter.type === "group") {
    if (filter.groupId === UNGROUPED_VIRTUAL_ID) {
      return categories.filter((c) => !c.groupId).map((c) => c.id);
    }
    return categories.filter((c) => c.groupId === filter.groupId).map((c) => c.id);
  }
  return [filter.categoryId];
}
