"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getTodayInJST } from "@/lib/dateUtils";
import { useFilterPanel } from "./filter-panel-context";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "completed" | "skipped";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

const KEYWORD_DEBOUNCE_MS = 300;

function SidebarFilterPanelInner() {
  const pathname = usePathname();
  const { filterPanelOpen } = useFilterPanel();
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInJST();

  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "all") as StatusFilter;
  const favoriteFilter = searchParams.get("favorite") === "true";
  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "all" || favoriteFilter);

  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setLocalKeyword(keyword);
  }

  if (pathname !== "/" || !filterPanelOpen) return null;

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
    updateSearchParams({ keyword: null, status: null, favorite: null, date: null });
  };

  return (
    <div className="border-t px-3 pt-2 pb-3">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-wider">絞り込み条件</span>
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

        {/* キーワード */}
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground/70">キーワード</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="キーワードを入力..."
              value={localKeyword}
              onChange={handleKeywordChange}
              onCompositionStart={() => { isComposingRef.current = true; }}
              onCompositionEnd={handleCompositionEnd}
              className="pl-8 pr-7 h-8 text-xs border-border/60 bg-background focus-visible:ring-1 rounded-md"
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
          <span className="text-[11px] text-muted-foreground/70">ステータス</span>
          <div className="flex h-8 rounded-md border border-border/60 overflow-hidden divide-x divide-border/60 text-xs bg-background">
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
        </div>

        {/* 日付 */}
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground/70">日付</span>
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => updateSearchParams({ date: e.target.value || null })}
              className="h-8 text-xs flex-1 min-w-0 border-border/60 bg-background rounded-md"
            />
            <button
              type="button"
              className={cn(
                "shrink-0 h-8 px-2.5 text-xs rounded-md border border-border/60 bg-background transition-colors",
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
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="日付フィルタを解除"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* お気に入り */}
        <button
          type="button"
          onClick={() => updateSearchParams({ favorite: favoriteFilter ? null : "true" })}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 h-8 rounded-md border text-xs transition-colors",
            favoriteFilter
              ? "bg-yellow-50 border-yellow-300 text-yellow-700 font-medium dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-400"
              : "border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Star
            className={cn("size-3.5 shrink-0", favoriteFilter ? "text-yellow-500" : "text-muted-foreground/50")}
            fill={favoriteFilter ? "currentColor" : "none"}
          />
          お気に入りのみ
        </button>
      </div>
    </div>
  );
}

export function SidebarFilterPanel() {
  return (
    <SidebarFilterPanelInner />
  );
}
