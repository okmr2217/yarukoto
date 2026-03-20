"use client";

import { Search, X, Calendar, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type FilterValues = {
  keyword: string;
  status: "all" | "pending" | "completed" | "skipped";
  isFavorite: boolean;
  dateFrom: string;
  dateTo: string;
};

interface FilterPanelProps {
  values: FilterValues;
  onChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterPanel({ values, onChange, onClear, hasActiveFilters }: FilterPanelProps) {
  return (
    <div className="bg-muted/30 border-b px-4 py-3 space-y-3">
      {/* キーワード検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="キーワードを入力..."
          value={values.keyword}
          onChange={(e) => onChange("keyword", e.target.value)}
          className="pl-10 pr-10"
        />
        {values.keyword && (
          <button
            type="button"
            onClick={() => onChange("keyword", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ステータスフィルタ */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">ステータス:</span>
        {(
          [
            { value: "all", label: "すべて" },
            { value: "pending", label: "未完了" },
            { value: "completed", label: "完了" },
            { value: "skipped", label: "やらない" },
          ] as { value: FilterValues["status"]; label: string }[]
        ).map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={values.status === option.value ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange("status", option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* お気に入り & 日付範囲 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* お気に入り */}
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

        {/* 日付範囲 */}
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="size-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            value={values.dateFrom}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            className="h-7 text-xs flex-1"
          />
          <span className="text-muted-foreground text-xs">〜</span>
          <Input
            type="date"
            value={values.dateTo}
            onChange={(e) => onChange("dateTo", e.target.value)}
            className="h-7 text-xs flex-1"
          />
        </div>
      </div>

      {/* フィルタクリア */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="w-full text-muted-foreground h-7"
        >
          <X className="size-4 mr-1" />
          フィルターをクリア
        </Button>
      )}
    </div>
  );
}
