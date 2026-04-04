"use client";

import { SlidersHorizontal } from "lucide-react";

interface FilterFabProps {
  onClick: () => void;
  activeFilterCount: number;
}

export function FilterFab({ onClick, activeFilterCount }: FilterFabProps) {
  return (
    <button
      onClick={onClick}
      aria-label="フィルターを開く"
      className="md:hidden fixed left-4 z-40 w-12 h-12 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
    >
      <SlidersHorizontal className="h-5 w-5" />
      {activeFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}
