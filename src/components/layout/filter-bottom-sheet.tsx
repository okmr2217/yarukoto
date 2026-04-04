"use client";

import { useState } from "react";
import { X, Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import type { FilterValues } from "./filter-panel";

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
  filterValues: FilterValues;
  onApply: (values: FilterValues) => void;
  onClear: () => void;
}

const STATUS_OPTIONS: { value: FilterValues["status"]; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "未完了" },
  { value: "completed", label: "完了" },
  { value: "skipped", label: "やらない" },
];

export function FilterBottomSheet({ open, onClose, filterValues, onApply, onClear }: FilterBottomSheetProps) {
  const today = getTodayInJST();
  const [localValues, setLocalValues] = useState<FilterValues>(filterValues);

  const handleApply = () => {
    onApply(localValues);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-4 pb-2">
          <h2 className="text-sm font-semibold mb-4">絞り込み</h2>

          {/* キーワード */}
          <div className="mb-4">
            <label className="block text-sm text-muted-foreground mb-1.5">キーワード</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="キーワードを入力..."
                value={localValues.keyword}
                onChange={(e) => setLocalValues((v) => ({ ...v, keyword: e.target.value }))}
                className="pl-8 pr-8"
              />
              {localValues.keyword && (
                <button
                  type="button"
                  onClick={() => setLocalValues((v) => ({ ...v, keyword: "" }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* ステータス */}
          <div className="mb-4">
            <label className="block text-sm text-muted-foreground mb-1.5">ステータス</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={localValues.status === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalValues((v) => ({ ...v, status: option.value }))}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 日付 */}
          <div className="mb-4">
            <label className="block text-sm text-muted-foreground mb-1.5">日付</label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setLocalValues((v) => ({ ...v, date: addDaysJST(v.date || today, -1) }))}
                aria-label="前日"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Input
                type="date"
                value={localValues.date}
                onChange={(e) => setLocalValues((v) => ({ ...v, date: e.target.value }))}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setLocalValues((v) => ({ ...v, date: addDaysJST(v.date || today, 1) }))}
                aria-label="翌日"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setLocalValues((v) => ({ ...v, date: today }))}
                disabled={localValues.date === today}
              >
                今日
              </Button>
              {localValues.date && (
                <button
                  type="button"
                  onClick={() => setLocalValues((v) => ({ ...v, date: "" }))}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="日付フィルタを解除"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* お気に入り */}
          <div className="flex items-center gap-2 mb-4">
            <Checkbox
              id="filter-sheet-favorite"
              checked={localValues.isFavorite}
              onCheckedChange={(checked) => setLocalValues((v) => ({ ...v, isFavorite: !!checked }))}
            />
            <label htmlFor="filter-sheet-favorite" className="text-sm cursor-pointer flex items-center gap-1">
              <Star className="size-3.5 text-yellow-500" fill="currentColor" />
              お気に入りのみ
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-4">
          <Button type="button" className="flex-1" onClick={handleApply}>
            適用
          </Button>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            クリア
          </button>
        </div>
      </div>
    </>
  );
}
