"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryChipProps {
  cat: Category;
  selected: boolean;
  onSelect: () => void;
  count?: number;
  className?: string;
}

export function CategoryChip({ cat, selected, onSelect, count, className }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-[11px] transition-all min-w-0 border",
        selected ? "bg-primary/10 border-primary/40 text-primary font-medium" : "border-transparent text-muted-foreground hover:bg-accent",
        className,
      )}
    >
      <span
        className={cn("w-2 h-2 rounded-full shrink-0 transition-opacity", !selected && "opacity-40")}
        style={{ backgroundColor: cat.color ?? "#6B7280" }}
      />
      <span className="truncate flex-1">{cat.name}</span>
      {count !== undefined && count > 0 && <span className="text-[10px] tabular-nums shrink-0 opacity-60">{count}</span>}
      {selected && <Check className="size-3 shrink-0 text-primary" />}
    </button>
  );
}
