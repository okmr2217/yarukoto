"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilterSearchParams, useDebouncedKeyword } from "@/hooks";

interface MobileTaskBarProps {
  activeFilterCount: number;
  onFilterOpen: () => void;
}

export function MobileTaskBar({ activeFilterCount, onFilterOpen }: MobileTaskBarProps) {
  const { keyword, updateSearchParams } = useFilterSearchParams();
  const { localKeyword, isComposingRef, handleKeywordChange, handleCompositionEnd, handleKeywordClear } = useDebouncedKeyword(
    keyword,
    updateSearchParams,
  );

  return (
    <div className="md:hidden sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm flex items-center h-12 px-3 gap-2">
      <Search className="shrink-0 size-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="タスク名・メモで検索..."
        value={localKeyword}
        onChange={handleKeywordChange}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={handleCompositionEnd}
        className="flex-1 min-w-0 h-full bg-transparent text-sm placeholder:text-muted-foreground outline-none"
      />
      {localKeyword && (
        <button
          type="button"
          onClick={handleKeywordClear}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="検索をクリア"
        >
          <X className="size-4" />
        </button>
      )}
      <div className="shrink-0 w-px h-5 bg-border" />
      <button
        type="button"
        onClick={onFilterOpen}
        className={cn(
          "relative shrink-0 h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
          activeFilterCount > 0 && "text-primary",
        )}
        aria-label="フィルターを開く"
      >
        <SlidersHorizontal className="size-4" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
