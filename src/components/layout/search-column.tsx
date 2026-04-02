"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import { useAllTasks } from "@/hooks";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

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
  onToggleCategory: (categoryId: string | null) => void;
}

export function SearchColumn({ categories, categoriesLoading, selectedCategoryIds, onToggleCategory }: SearchColumnProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInJST();

  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "all") as StatusFilter;
  const favoriteFilter = searchParams.get("favorite") === "true";
  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "all" || favoriteFilter || selectedCategoryIds.length > 0);

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setLocalKeyword(keyword);
  }

  // 全未完了タスクをカテゴリ別件数算出のために取得
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
    onToggleCategory(null);
    updateSearchParams({ keyword: null, status: null, favorite: null, date: null });
  };

  const totalPending = allPendingTasks?.length ?? 0;

  return (
    <div className="flex flex-col py-4 px-3 gap-5 overflow-y-auto">
      {/* カテゴリ */}
      <section>
        <span className="block text-[11px] font-medium text-muted-foreground/70 tracking-wider mb-2">カテゴリ</span>
        <div className="space-y-0.5">
          {/* すべて */}
          <button
            type="button"
            onClick={() => onToggleCategory(null)}
            className={cn(
              "w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors",
              selectedCategoryIds.length === 0
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span>すべて</span>
            {totalPending > 0 && (
              <span className={cn(
                "text-[11px] tabular-nums shrink-0",
                selectedCategoryIds.length === 0 ? "text-primary" : "text-muted-foreground",
              )}>
                {totalPending}
              </span>
            )}
          </button>

          {/* カテゴリ一覧 */}
          {categoriesLoading
            ? [80, 64, 96].map((w, i) => (
                <div key={i} className="h-8 rounded bg-muted animate-pulse mx-2" style={{ width: `${w}%` }} />
              ))
            : categories.map((category) => {
                const count = pendingCountByCategory[category.id] ?? 0;
                const active = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onToggleCategory(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors",
                      active
                        ? "font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                    style={
                      active && category.color
                        ? { backgroundColor: `${category.color}18`, color: category.color }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {category.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="truncate">{category.name}</span>
                    </div>
                    {count > 0 && (
                      <span className={cn(
                        "text-[11px] tabular-nums shrink-0 ml-1",
                        active ? "" : "text-muted-foreground",
                      )}>
                        {count}
                      </span>
                    )}
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
                  "w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span>カテゴリなし</span>
                {count > 0 && (
                  <span className="text-[11px] tabular-nums shrink-0 text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })()}
        </div>
      </section>

      {/* 絞り込み */}
      <section className="space-y-3">
        <span className="block text-[11px] font-medium text-muted-foreground/70 tracking-wider">絞り込み</span>

        {/* キーワード */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">キーワード</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="キーワード..."
              value={localKeyword}
              onChange={handleKeywordChange}
              onCompositionStart={() => { isComposingRef.current = true; }}
              onCompositionEnd={handleCompositionEnd}
              className="pl-8 pr-7 h-7 text-xs border-0 bg-muted/60 focus-visible:ring-1"
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
        </div>

        {/* ステータス */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">ステータス</span>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => updateSearchParams({ status: option.value === "all" ? null : option.value })}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 日付 */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">日付</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateSearchParams({ date: addDaysJST(dateFilter || today, -1) })}
              className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="前日"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => updateSearchParams({ date: e.target.value || null })}
              className="h-7 text-xs flex-1 min-w-0"
            />
            <button
              type="button"
              onClick={() => updateSearchParams({ date: addDaysJST(dateFilter || today, 1) })}
              className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="翌日"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs flex-1"
              onClick={() => updateSearchParams({ date: today })}
              disabled={dateFilter === today}
            >
              今日
            </Button>
            {dateFilter && (
              <button
                type="button"
                onClick={() => updateSearchParams({ date: null })}
                className="text-muted-foreground hover:text-foreground"
                aria-label="日付フィルタを解除"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* お気に入り */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="search-col-favorite"
            checked={favoriteFilter}
            onCheckedChange={(checked) => updateSearchParams({ favorite: checked ? "true" : null })}
          />
          <label htmlFor="search-col-favorite" className="text-xs cursor-pointer flex items-center gap-1">
            <Star className="size-3.5 text-yellow-500" fill="currentColor" />
            お気に入りのみ
          </label>
        </div>
      </section>

      {/* クリア */}
      {hasActiveFilters && (
        <div className="border-t border-border/50 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="w-full text-muted-foreground h-7 text-xs"
          >
            <X className="size-3.5 mr-1" />
            条件をクリア
          </Button>
        </div>
      )}
    </div>
  );
}
