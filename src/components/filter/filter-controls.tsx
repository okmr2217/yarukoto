"use client";

import { Search, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addDaysJST } from "@/lib/dateUtils";
import { FilterSectionInfo } from "./filter-section-info";
import {
  type StatusFilter,
  type SortOrder,
  STATUS_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/filter-types";
import type { Task } from "@/types";

interface FilterStatusChipsProps {
  statusFilter: StatusFilter;
  statusCounts: Record<StatusFilter, number>;
  allFilteredTasks: Task[] | undefined;
  onUpdate: (updates: Record<string, string | null>) => void;
}

export function FilterStatusChips({ statusFilter, statusCounts, allFilteredTasks, onUpdate }: FilterStatusChipsProps) {
  return (
    <div className="flex rounded-md border border-input overflow-hidden divide-x divide-border text-xs bg-background">
      {STATUS_OPTIONS.map((option) => {
        const count = statusCounts[option.value];
        const active = statusFilter === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-h-8 transition-colors",
              active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => onUpdate({ status: option.value === "pending" ? null : option.value })}
          >
            <span className="whitespace-nowrap leading-none">{option.label}</span>
            {allFilteredTasks !== undefined && (
              <span className={cn("tabular-nums leading-none mt-0.5 text-[10px]", active ? "opacity-70" : "opacity-50")}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface FilterDateNavProps {
  dateFilter: string;
  today: string;
  onUpdate: (updates: Record<string, string | null>) => void;
}

export function FilterDateNav({ dateFilter, today, onUpdate }: FilterDateNavProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onUpdate({ date: addDaysJST(dateFilter || today, -1) })}
        className="shrink-0 h-8 w-7 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="前日"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <Input
        type="date"
        value={dateFilter}
        onChange={(e) => onUpdate({ date: e.target.value || null })}
        className="h-8 text-xs flex-1 min-w-0"
      />
      <button
        type="button"
        onClick={() => onUpdate({ date: addDaysJST(dateFilter || today, 1) })}
        className="shrink-0 h-8 w-7 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="翌日"
      >
        <ChevronRight className="size-3.5" />
      </button>
      <button
        type="button"
        className={cn(
          "shrink-0 h-8 px-2 text-xs rounded-md border border-input bg-background transition-colors",
          dateFilter === today ? "text-muted-foreground/40 cursor-default" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        onClick={() => onUpdate({ date: today })}
        disabled={dateFilter === today}
      >
        今日
      </button>
      {dateFilter && (
        <button
          type="button"
          onClick={() => onUpdate({ date: null })}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="日付フィルタを解除"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

interface FilterFavoriteToggleProps {
  favoriteFilter: boolean;
  favoriteCount: number | undefined;
  onUpdate: (updates: Record<string, string | null>) => void;
}

export function FilterFavoriteToggle({ favoriteFilter, favoriteCount, onUpdate }: FilterFavoriteToggleProps) {
  return (
    <div className="flex rounded-md border border-input overflow-hidden text-xs bg-background">
      <button
        type="button"
        aria-pressed={favoriteFilter}
        onClick={() => onUpdate({ favorite: favoriteFilter ? null : "true" })}
        className={cn(
          "flex-1 flex items-center gap-2 px-2.5 py-1.5 transition-colors",
          favoriteFilter
            ? "bg-yellow-50 text-yellow-700 font-medium dark:bg-yellow-950/30 dark:text-yellow-400"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <Star
          className={cn("size-3.5 shrink-0", favoriteFilter ? "text-yellow-500" : "text-muted-foreground/40")}
          fill={favoriteFilter ? "currentColor" : "none"}
        />
        お気に入りのみ
        {favoriteCount !== undefined && (
          <span className={cn("ml-auto tabular-nums text-[10px]", favoriteFilter ? "opacity-70" : "opacity-50")}>{favoriteCount}</span>
        )}
      </button>
    </div>
  );
}

interface FilterSortChipsProps {
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

export function FilterSortChips({ sort, onSortChange }: FilterSortChipsProps) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {SORT_OPTIONS.map((option) => {
        const active = sort === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center px-2 py-1.5 rounded-md text-xs transition-colors border",
              active
                ? "bg-primary text-primary-foreground font-medium border-primary"
                : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => onSortChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface FilterKeywordInputProps {
  localKeyword: string;
  isComposingRef: React.RefObject<boolean>;
  onKeywordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void;
  onKeywordClear: () => void;
  tooltip?: string;
}

export function FilterKeywordInput({
  localKeyword,
  isComposingRef,
  onKeywordChange,
  onCompositionEnd,
  onKeywordClear,
  tooltip,
}: FilterKeywordInputProps) {
  return (
    <>
      {tooltip && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/60 tracking-wider mb-0.5">
          キーワード
          <FilterSectionInfo content={tooltip} />
        </span>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
        <Input
          type="text"
          placeholder="キーワード..."
          value={localKeyword}
          onChange={onKeywordChange}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={onCompositionEnd}
          className="pl-8 pr-7 h-8 text-xs focus-visible:ring-1"
        />
        {localKeyword && (
          <button
            type="button"
            onClick={onKeywordClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </>
  );
}
