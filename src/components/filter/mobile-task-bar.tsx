"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilterSearchParams, useDebouncedKeyword } from "@/hooks";
import { FilterKeywordInput } from "./filter-controls";

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
    <div className="md:hidden sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <FilterKeywordInput
            localKeyword={localKeyword}
            isComposingRef={isComposingRef}
            onKeywordChange={handleKeywordChange}
            onCompositionEnd={handleCompositionEnd}
            onKeywordClear={handleKeywordClear}
          />
        </div>
        <button
          type="button"
          onClick={onFilterOpen}
          className={cn(
            "relative shrink-0 h-8 w-9 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            activeFilterCount > 0 && "border-primary/40 text-primary",
          )}
          aria-label="フィルターを開く"
        >
          <SlidersHorizontal className="size-3.5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
