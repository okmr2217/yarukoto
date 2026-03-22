"use client";

import { Search, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import { useState, useRef, useCallback } from "react";

export type FilterValues = {
  keyword: string;
  status: "all" | "pending" | "completed" | "skipped";
  isFavorite: boolean;
  date: string; // YYYY-MM-DD or ""
};

interface FilterPanelProps {
  values: FilterValues;
  onChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: FilterValues["status"]; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

const KEYWORD_DEBOUNCE_MS = 300;

export function FilterPanel({ values, onChange, onClear, hasActiveFilters }: FilterPanelProps) {
  const today = getTodayInJST();
  const [localKeyword, setLocalKeyword] = useState(values.keyword);
  const [syncedExternalKeyword, setSyncedExternalKeyword] = useState(values.keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 外部から keyword が変化した場合（例：フィルタクリア）に同期（derived state パターン）
  if (values.keyword !== syncedExternalKeyword) {
    setSyncedExternalKeyword(values.keyword);
    setLocalKeyword(values.keyword);
  }

  const commitKeyword = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onChange("keyword", value);
      }, KEYWORD_DEBOUNCE_MS);
    },
    [onChange],
  );

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalKeyword(value);
    if (!isComposingRef.current) {
      commitKeyword(value);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    commitKeyword(e.currentTarget.value);
  };

  const handleKeywordClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLocalKeyword("");
    onChange("keyword", "");
  };

  const handlePrevDay = () => {
    onChange("date", addDaysJST(values.date || today, -1));
  };

  const handleNextDay = () => {
    onChange("date", addDaysJST(values.date || today, 1));
  };

  return (
    <div className="bg-muted border-b px-4 py-3">
      <div className="grid grid-cols-[5rem_1fr] gap-x-4 gap-y-2.5 items-center">

        {/* キーワード */}
        <span className="text-sm text-muted-foreground">キーワード</span>
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="キーワードを入力..."
            value={localKeyword}
            onChange={handleKeywordChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="pl-8 pr-7 h-7 text-xs"
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

        {/* ステータス */}
        <span className="text-sm text-muted-foreground">ステータス</span>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={values.status === option.value ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => onChange("status", option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* 日付 */}
        <span className="text-sm text-muted-foreground">日付</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handlePrevDay}
            aria-label="前日"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Input
            type="date"
            value={values.date}
            onChange={(e) => onChange("date", e.target.value)}
            className="h-7 text-xs w-36"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleNextDay}
            aria-label="翌日"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => onChange("date", today)}
            disabled={values.date === today}
          >
            今日
          </Button>
          {values.date && (
            <button
              type="button"
              onClick={() => onChange("date", "")}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="日付フィルタを解除"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* お気に入り */}
        <span className="text-sm text-muted-foreground">お気に入り</span>
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-favorite"
            checked={values.isFavorite}
            onCheckedChange={(checked) => onChange("isFavorite", !!checked)}
          />
          <label
            htmlFor="filter-favorite"
            className="text-sm cursor-pointer flex items-center gap-1"
          >
            <Star className="size-3.5 text-yellow-500" fill="currentColor" />
            お気に入りのみ
          </label>
        </div>
      </div>

      {/* フィルタクリア */}
      {hasActiveFilters && (
        <div className="mt-3 pt-2.5 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="w-full text-muted-foreground h-7"
          >
            <X className="size-3.5 mr-1" />
            フィルターをクリア
          </Button>
        </div>
      )}
    </div>
  );
}
