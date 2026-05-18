"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroups, useGroupExpanded } from "@/hooks";
import type { Category } from "@/types";
import { type CategoryFilter, UNGROUPED_VIRTUAL_ID } from "@/lib/category-filter";
import { categoryTreeItemStyle } from "@/lib/category-color";
import { CategoryChip } from "@/components/category";

interface FilterCategoryTreeProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  countByCategory: Record<string, number>;
  countByGroup: Record<string, number>;
}

interface CategoryItemProps {
  cat: Category;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  countByCategory: Record<string, number>;
}

function CategoryItem({ cat, categoryFilter, onCategoryFilterChange, countByCategory }: CategoryItemProps) {
  const count = countByCategory[cat.id] ?? 0;
  if (count === 0) return null;
  const isCatSelected = categoryFilter.type === "category" && categoryFilter.categoryId === cat.id;
  return (
    <CategoryChip
      cat={cat}
      selected={isCatSelected}
      onSelect={() => onCategoryFilterChange(isCatSelected ? { type: "all" } : { type: "category", categoryId: cat.id })}
      count={count}
    />
  );
}

export function FilterCategoryTree({
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  countByCategory,
  countByGroup,
}: FilterCategoryTreeProps) {
  const { data: groups = [] } = useGroups();
  const { isExpanded, toggle } = useGroupExpanded();

  const groupedCategories = (() => {
    const byGroup: Record<string, Category[]> = {};
    const ungrouped: Category[] = [];
    for (const cat of categories) {
      if (cat.groupId) {
        byGroup[cat.groupId] = [...(byGroup[cat.groupId] ?? []), cat];
      } else {
        ungrouped.push(cat);
      }
    }
    return { byGroup, ungrouped };
  })();

  const hasGroups = groups.length > 0 && categories.some((c) => c.groupId);

  if (categoriesLoading) {
    return (
      <div className="space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-6 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {hasGroups &&
        groups.map((group) => {
          const groupCats = groupedCategories.byGroup[group.id] ?? [];
          if (groupCats.length === 0) return null;
          const isGroupSelected = categoryFilter.type === "group" && categoryFilter.groupId === group.id;
          const expanded = isExpanded(group.id);
          const groupColor = group.color;
          const groupCount = countByGroup[group.id] ?? 0;

          return (
            <div key={group.id} className="mb-0.5">
              <div
                className="flex items-center w-full rounded-md text-[11px] overflow-hidden"
                style={
                  isGroupSelected && groupColor
                    ? { ...categoryTreeItemStyle(groupColor), paddingLeft: "calc(0.375rem - 3px)" }
                    : !isGroupSelected && groupColor
                      ? { backgroundColor: `${groupColor}18` }
                      : {}
                }
              >
                <button
                  type="button"
                  onClick={() => onCategoryFilterChange(isGroupSelected ? { type: "all" } : { type: "group", groupId: group.id })}
                  className={cn(
                    "flex items-center gap-1.5 flex-1 py-[3px] transition-all min-w-0",
                    isGroupSelected
                      ? "font-medium text-foreground"
                      : groupColor
                        ? "hover:opacity-90"
                        : "text-muted-foreground hover:bg-accent/40",
                    !isGroupSelected && "px-1.5",
                  )}
                  style={!isGroupSelected && groupColor ? { color: groupColor } : undefined}
                >
                  <span className="truncate flex-1">{group.name}</span>
                  {groupCount > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{groupCount}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mr-0.5"
                  aria-label={expanded ? "折りたたむ" : "展開する"}
                >
                  <ChevronDown className={cn("size-2.5 transition-transform duration-150", expanded && "rotate-180")} />
                </button>
              </div>

              {expanded && (
                <div className="ml-3">
                  {groupCats.map((cat) => (
                    <CategoryItem key={cat.id} cat={cat} categoryFilter={categoryFilter} onCategoryFilterChange={onCategoryFilterChange} countByCategory={countByCategory} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {groupedCategories.ungrouped.length > 0 &&
        hasGroups &&
        (() => {
          const isUngroupedSelected = categoryFilter.type === "group" && categoryFilter.groupId === UNGROUPED_VIRTUAL_ID;
          const ungroupedCount = countByGroup["ungrouped"] ?? 0;
          return (
            <div className="mb-0.5">
              <div
                className="flex items-center w-full rounded-md text-[11px] overflow-hidden"
                style={
                  isUngroupedSelected
                    ? {
                        backgroundColor: "var(--muted)",
                        borderLeft: `3px solid color-mix(in oklch, var(--muted-foreground) 40%, transparent)`,
                        paddingLeft: "calc(0.375rem - 3px)",
                      }
                    : {}
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    onCategoryFilterChange(isUngroupedSelected ? { type: "all" } : { type: "group", groupId: UNGROUPED_VIRTUAL_ID })
                  }
                  className={cn(
                    "flex items-center gap-1.5 flex-1 py-[3px] transition-colors min-w-0",
                    isUngroupedSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                    !isUngroupedSelected && "px-1.5",
                  )}
                >
                  <span className={cn("truncate flex-1 italic opacity-60")}>グループなし</span>
                  {ungroupedCount > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-70">{ungroupedCount}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(UNGROUPED_VIRTUAL_ID)}
                  className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mr-0.5"
                  aria-label={isExpanded(UNGROUPED_VIRTUAL_ID) ? "折りたたむ" : "展開する"}
                >
                  <ChevronDown
                    className={cn("size-2.5 transition-transform duration-150", isExpanded(UNGROUPED_VIRTUAL_ID) && "rotate-180")}
                  />
                </button>
              </div>
              {isExpanded(UNGROUPED_VIRTUAL_ID) && (
                <div className="ml-3">
                  {groupedCategories.ungrouped.map((cat) => (
                    <CategoryItem key={cat.id} cat={cat} categoryFilter={categoryFilter} onCategoryFilterChange={onCategoryFilterChange} countByCategory={countByCategory} />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

      {groupedCategories.ungrouped.length > 0 && !hasGroups && (
        <div className="mt-0.5">
          {groupedCategories.ungrouped.map((cat) => (
            <CategoryItem key={cat.id} cat={cat} categoryFilter={categoryFilter} onCategoryFilterChange={onCategoryFilterChange} countByCategory={countByCategory} />
          ))}
        </div>
      )}

      {(() => {
        const count = countByCategory["none"] ?? 0;
        if (count === 0) return null;
        const isNoneSelected = categoryFilter.type === "category" && categoryFilter.categoryId === "none";
        return (
          <div className="mb-0.5">
            <div
              className="flex items-center w-full rounded-md text-[11px] overflow-hidden"
              style={
                isNoneSelected
                  ? {
                      backgroundColor: "var(--muted)",
                      borderLeft: `3px solid color-mix(in oklch, var(--muted-foreground) 40%, transparent)`,
                      paddingLeft: "calc(0.375rem - 3px)",
                    }
                  : {}
              }
            >
              <button
                type="button"
                onClick={() => onCategoryFilterChange(isNoneSelected ? { type: "all" } : { type: "category", categoryId: "none" })}
                aria-pressed={isNoneSelected}
                className={cn(
                  "flex items-center gap-1.5 flex-1 pr-1.5 py-[3px] transition-colors min-w-0",
                  isNoneSelected ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/40",
                  !isNoneSelected && "px-1.5",
                )}
              >
                <span className="truncate flex-1 italic opacity-60">カテゴリなし</span>
                <span className="ml-auto shrink-0 text-[10px] tabular-nums opacity-70">{count}</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
