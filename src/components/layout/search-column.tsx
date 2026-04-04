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

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
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
    <span className="block text-[11px] font-semibold text-muted-foreground/60 tracking-wider mb-1.5">
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
  const statusFilter = (searchParams.get("status") || "all") as StatusFilter;
  const favoriteFilter = searchParams.get("favorite") === "true";
  const categoryParam = searchParams.get("category");
  const isDefaultAllSelected = categoryParam === null;
  const isAllDeselected = categoryParam === CATEGORY_DESELECTED_SENTINEL;
  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "all" || favoriteFilter || !isDefaultAllSelected);

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setLocalKeyword(keyword);
  }

  const { data: allPendingTasks } = useAllTasks({ status: "pending" });

  const pendingCountByCategory = (() => {
    if (!allPendingTasks) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const task of allPendingTasks) {
      const key = task.categoryId ?? "none";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
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

  const handleClearFilters = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLocalKeyword("");
    updateSearchParams({ keyword: null, status: null, favorite: null, date: null, category: null });
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
    <div className="px-3 py-3">
      <div className="flex flex-col gap-2 border border-border rounded-lg p-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">絞り込み</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            <X className="size-3" />
            クリア
          </button>
        )}
      </div>

      {/* カテゴリ */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground/60 tracking-wider">カテゴリ</span>
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
                  const count = pendingCountByCategory[category.id] ?? 0;
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
                      {count > 0 && <span className="text-[10px] tabular-nums shrink-0 ml-1 opacity-70">{count}</span>}
                    </button>
                  );
                })}
                {/* カテゴリなし */}
                {(() => {
                  const count = pendingCountByCategory["none"] ?? 0;
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
        <div className="flex h-8 rounded-md border border-input overflow-hidden divide-x divide-border text-xs bg-background">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex-1 px-1 whitespace-nowrap overflow-hidden transition-colors",
                statusFilter === option.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => updateSearchParams({ status: option.value === "all" ? null : option.value })}
            >
              {option.label}
            </button>
          ))}
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
        </button>
      </section>
      </div>
    </div>
  );
}
