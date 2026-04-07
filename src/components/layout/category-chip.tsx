"use client";

import { cn } from "@/lib/utils";

interface CategoryChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string | null;
  isSpecial?: boolean; // For "すべて" and "カテゴリなし"
  count?: number;
}

export function CategoryChip({
  label,
  active,
  onClick,
  color,
  isSpecial = false,
  count,
}: CategoryChipProps) {
  // Special chips (すべて, カテゴリなし) - Gray style
  if (isSpecial) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "text-xs px-2.5 py-1.5 rounded flex items-center gap-1 whitespace-nowrap transition-all",
          active
            ? "bg-muted text-foreground font-semibold"
            : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
        )}
      >
        {label}
        {count !== undefined && count > 0 && (
          <span className="tabular-nums opacity-60">{count}</span>
        )}
      </button>
    );
  }

  // Regular category chips - Same style as SearchColumn
  const activeStyle = color
    ? { backgroundColor: `${color}28`, color: color, boxShadow: `inset 0 0 0 1.5px ${color}50` }
    : undefined;
  const inactiveStyle = color
    ? { backgroundColor: `${color}14`, color: `${color}aa`, boxShadow: `inset 0 0 0 1.5px transparent` }
    : undefined;

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-2.5 py-1.5 rounded flex items-center gap-1 whitespace-nowrap transition-all",
        active ? "font-semibold" : color ? "" : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
      )}
      style={active ? activeStyle : inactiveStyle}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="tabular-nums opacity-60">{count}</span>
      )}
    </button>
  );
}
