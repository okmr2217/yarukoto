"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import { useAllTasks } from "@/hooks";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";
import { CATEGORY_DESELECTED_SENTINEL } from "@/lib/constants";

type StatusFilter = "all" | "pending" | "completed" | "skipped";
type SortOrder = "displayOrder" | "createdAt" | "completedAt" | "skippedAt";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "displayOrder", label: "表示順" },
  { value: "createdAt", label: "作成日時" },
  { value: "completedAt", label: "完了日時" },
  { value: "skippedAt", label: "やらない日時" },
];

const KEYWORD_DEBOUNCE_MS = 300;

interface SearchColumnProps {
  categories: Category[];
  categoriesLoading: boolean;
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
}

/** 各サブセクションの小見出し */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold text-muted-foreground tracking-wide mb-1">
      {children}
    </span>
  );
}

export function SearchColumn({ categories, categoriesLoading, selectedCategoryIds, onToggleCategory }: SearchColumnProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInJST();

  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "pending") as StatusFilter;
  const favoriteFilter = searchParams.get("favorite") === "true";
  const sortOrder = (searchParams.get("sort") || "displayOrder") as SortOrder;
  const categoryParam = searchParams.get("category");
  const isDefaultAllSelected = categoryParam === null;
  const isAllDeselected = categoryParam === CATEGORY_DESELECTED_SENTINEL;
  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setLocalKeyword(keyword);
  }

  // カテゴリ件数: カテゴリ以外のフィルター（日付・キーワード・ステータス・お気に入り）に連動
  const { data: tasksForCategoryCounts } = useAllTasks({
    date: dateFilter || undefined,
    keyword: keyword || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    isFavorite: favoriteFilter || undefined,
  });

  const countByCategory = (() => {
    if (!tasksForCategoryCounts) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const task of tasksForCategoryCounts) {
      const key = task.categoryId ?? "none";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  })();

  // ステータス件数: 現在のフィルター（カテゴリ・日付・キーワード・お気に入り）に連動、ステータス条件は除外
  const { data: allFilteredTasks } = useAllTasks(
    {
      categoryIds: isDefaultAllSelected ? undefined : selectedCategoryIds,
      date: dateFilter || undefined,
      keyword: keyword || undefined,
      isFavorite: favoriteFilter || undefined,
    },
    { enabled: !isAllDeselected },
  );

  const statusCounts: Record<StatusFilter, number> = (() => {
    if (!allFilteredTasks) return { all: 0, pending: 0, completed: 0, skipped: 0 };
    const pending = allFilteredTasks.filter((t) => t.status === "PENDING").length;
    const completed = allFilteredTasks.filter((t) => t.status === "COMPLETED").length;
    const skipped = allFilteredTasks.filter((t) => t.status === "SKIPPED").length;
    return { all: allFilteredTasks.length, pending, completed, skipped };
  })();

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const commitKeyword = (value: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateSearchParams({ keyword: value || null });
    }, KEYWORD_DEBOUNCE_MS);
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalKeyword(value);
    if (!isComposingRef.current) commitKeyword(value);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    commitKeyword(e.currentTarget.value);
  };

  const handleKeywordClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLocalKeyword("");
    updateSearchParams({ keyword: null });
  };

  const allSelected = !categoriesLoading && isDefaultAllSelected;
  const noneSelected = isAllDeselected;

  const handleSelectAll = () => {
    updateSearchParams({ category: null }); // null = デフォルト全選択
  };

  const handleDeselectAll = () => {
    updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });
  };

  return (
    <div className="px-4 py-2 flex flex-col gap-4">
      {/* カテゴリ */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">カテゴリ</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDeselectAll}
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded transition-colors",
                noneSelected ? "text-foreground font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              全て解除
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded transition-colors",
                allSelected ? "text-foreground font-semibold bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              全て選択
            </button>
          </div>
        </div>

        {/* カテゴリ一覧 — 2列グリッド */}
        <div className="grid grid-cols-2 gap-1">
          {categoriesLoading
            ? [80, 64, 96, 72].map((w, i) => (
                <div key={i} className="h-7 rounded-md bg-muted animate-pulse" />
              ))
            : (
              <>
                {categories.map((category) => {
                  const count = countByCategory[category.id] ?? 0;
                  const active = selectedCategoryIds.includes(category.id);
                  const color = category.color;

                  const activeStyle = color
                    ? { backgroundColor: `${color}28`, color: color, boxShadow: `inset 0 0 0 1.5px ${color}50` }
                    : undefined;
                  const inactiveStyle = color
                    ? { backgroundColor: `${color}14`, color: `${color}aa` }
                    : undefined;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onToggleCategory(category.id)}
                      className={cn(
                        "flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors min-w-0",
                        active ? "font-semibold" : color ? "" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                      style={active ? activeStyle : inactiveStyle}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
                        <span className="truncate">{category.name}</span>
                      </div>
                      {count > 0 && <span className="text-xs tabular-nums shrink-0 ml-1 opacity-70">{count}</span>}
                    </button>
                  );
                })}
                {/* カテゴリなし */}
                {(() => {
                  const count = countByCategory["none"] ?? 0;
                  const active = selectedCategoryIds.includes("none");
                  return (
                    <button
                      type="button"
                      onClick={() => onToggleCategory("none")}
                      className={cn(
                        "flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors min-w-0",
                        active ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <span className="truncate">カテゴリなし</span>
                      {count > 0 && <span className="text-[10px] tabular-nums shrink-0 ml-1 opacity-70">{count}</span>}
                    </button>
                  );
                })()}
              </>
            )}
        </div>
      </section>

      {/* キーワード */}
      <section>
        <SectionLabel>キーワード</SectionLabel>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="キーワード..."
            value={localKeyword}
            onChange={handleKeywordChange}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={handleCompositionEnd}
            className="pl-8 pr-7 h-8 text-xs focus-visible:ring-1"
          />
          {localKeyword && (
            <button
              type="button"
              onClick={handleKeywordClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* ステータス */}
      <section>
        <SectionLabel>ステータス</SectionLabel>
        <div className="flex rounded-md border border-input overflow-hidden divide-x divide-border text-xs bg-background">
          {STATUS_OPTIONS.map((option) => {
            const count = statusCounts[option.value];
            const active = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-[2rem] transition-colors",
                  active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => updateSearchParams({ status: option.value === "pending" ? null : option.value })}
              >
                <span className="whitespace-nowrap leading-none">{option.label}</span>
                {allFilteredTasks !== undefined && (
                  <span className={cn("tabular-nums leading-none mt-0.5 text-[10px]", active ? "opacity-70" : "opacity-50")}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 日付 */}
      <section>
        <SectionLabel>日付</SectionLabel>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => updateSearchParams({ date: addDaysJST(dateFilter || today, -1) })}
            className="shrink-0 h-8 w-7 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="前日"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => updateSearchParams({ date: e.target.value || null })}
            className="h-8 text-xs flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={() => updateSearchParams({ date: addDaysJST(dateFilter || today, 1) })}
            className="shrink-0 h-8 w-7 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="翌日"
          >
            <ChevronRight className="size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              "shrink-0 h-8 px-2 text-xs rounded-md border border-input bg-background transition-colors",
              dateFilter === today
                ? "text-muted-foreground/40 cursor-default"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => updateSearchParams({ date: today })}
            disabled={dateFilter === today}
          >
            今日
          </button>
          {dateFilter && (
            <button
              type="button"
              onClick={() => updateSearchParams({ date: null })}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="日付フィルタを解除"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* お気に入り */}
      <section>
        <SectionLabel>お気に入り</SectionLabel>
        <button
          type="button"
          onClick={() => updateSearchParams({ favorite: favoriteFilter ? null : "true" })}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 h-8 rounded-md border text-xs transition-colors",
            favoriteFilter
              ? "bg-yellow-50 border-yellow-300 text-yellow-700 font-medium dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-400"
              : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Star
            className={cn("size-3.5 shrink-0", favoriteFilter ? "text-yellow-500" : "text-muted-foreground/40")}
            fill={favoriteFilter ? "currentColor" : "none"}
          />
          お気に入りのみ
          {allFilteredTasks !== undefined && (
            <span className={cn("ml-auto tabular-nums text-xs", favoriteFilter ? "opacity-70" : "opacity-50")}>
              {allFilteredTasks.filter((t) => t.isFavorite).length}
            </span>
          )}
        </button>
      </section>

      {/* 並び替え */}
      <section>
        <SectionLabel>並び替え</SectionLabel>
        <div className="grid grid-cols-2 gap-1">
          {SORT_OPTIONS.map((option) => {
            const active = sortOrder === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex items-center justify-center px-2 py-1.5 rounded-md text-xs transition-colors border",
                  active ? "bg-primary text-primary-foreground font-medium border-primary" : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => updateSearchParams({ sort: option.value === "displayOrder" ? null : option.value })}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
