"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroups } from "@/hooks";
import { getGroupEmoji } from "@/lib/categoryGroup";
import { CategoryChip } from "./category-chip";
import { UNGROUPED_VIRTUAL_ID, type CategoryFilter } from "@/lib/category-filter";
import type { Category } from "@/types";

interface CategorySelectFilterProps {
  categories: Category[];
  categoriesLoading: boolean;
  value: CategoryFilter;
  onChange: (val: CategoryFilter) => void;
  countByCategory: Record<string, number>;
  countByGroup: Record<string, number>;
}

type VGroup = { id: string; name: string; emoji: string | null; cats: Category[] };

function buildVGroups(groups: ReturnType<typeof useGroups>["data"], categories: Category[]): VGroup[] {
  const catsByGroup: Record<string, Category[]> = {};
  const ungrouped: Category[] = [];
  for (const cat of categories) {
    if (cat.archivedAt) continue;
    if (cat.groupId) {
      catsByGroup[cat.groupId] = [...(catsByGroup[cat.groupId] ?? []), cat];
    } else {
      ungrouped.push(cat);
    }
  }
  return [
    ...(groups ?? [])
      .filter((g) => (catsByGroup[g.id]?.length ?? 0) > 0)
      .map((g) => ({ id: g.id, name: g.name, emoji: g.emoji, cats: catsByGroup[g.id] ?? [] })),
    ...(ungrouped.length > 0 ? [{ id: UNGROUPED_VIRTUAL_ID, name: "グループなし", emoji: null, cats: ungrouped }] : []),
  ];
}

export function CategorySelectFilter({ categories, categoriesLoading, value, onChange, countByCategory }: CategorySelectFilterProps) {
  const { data: groups } = useGroups();

  const vGroups = buildVGroups(groups, categories);

  // 初期状態: 全折りたたみ。グループが1つのみなら初期展開
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(vGroups.length === 1 ? [vGroups[0].id] : []));

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const noneCount = countByCategory["none"] ?? 0;

  if (categoriesLoading) {
    return (
      <div className="space-y-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-6 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // グループなし: フラットグリッド
  if (vGroups.length === 0) {
    const allCats = categories.filter((c) => !c.archivedAt);
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-1">
          {allCats.map((cat) => {
            const isSelected = value.type === "category" && value.categoryId === cat.id;
            return (
              <CategoryChip
                key={cat.id}
                cat={cat}
                selected={isSelected}
                onSelect={() => onChange(isSelected ? { type: "all" } : { type: "category", categoryId: cat.id })}
              />
            );
          })}
        </div>
        {noneCount > 0 && <NoneItem value={value} onChange={onChange} />}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {vGroups.map((vg) => {
        const isGroupSelected = value.type === "group" && value.groupId === vg.id;
        const isOpen = expanded.has(vg.id);
        const emoji = vg.id === UNGROUPED_VIRTUAL_ID ? null : getGroupEmoji(vg.emoji);

        return (
          <div key={vg.id} className={cn("rounded-md overflow-hidden border transition-colors", isGroupSelected ? "bg-primary/5 border-primary/30" : "bg-muted/40 border-border/40")}>
            {/* グループヘッダー: 全体クリックで開閉 */}
            <button
              type="button"
              onClick={() => toggle(vg.id)}
              className="flex items-center gap-1 px-1.5 py-[3px] w-full text-left"
              aria-expanded={isOpen}
            >
              {emoji && <span className="text-sm leading-none">{emoji}</span>}
              <span className={cn("truncate flex-1 text-[11px] font-medium", isGroupSelected ? "text-primary" : "text-foreground/80")}>
                {vg.name}
              </span>
              {/* 「絞る」ボタン: グループ丸ごと選択 */}
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onChange(isGroupSelected ? { type: "all" } : { type: "group", groupId: vg.id }); }}
                className={cn(
                  "shrink-0 px-1.5 py-0.5 rounded text-[10px] border transition-all cursor-pointer",
                  isGroupSelected
                    ? "bg-primary/10 border-primary/40 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                絞る
              </span>
              {/* 件数バッジ: 非アーカイブカテゴリ数 */}
              <span className={cn("text-[10px] tabular-nums rounded-full px-1.5 py-0.5 border shrink-0", isGroupSelected ? "bg-primary/10 border-primary/40 text-primary" : "bg-background border-border/40 text-muted-foreground")}>{vg.cats.length}</span>
              {/* 開閉 chevron */}
              <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-150", isOpen && "rotate-180")} />
            </button>

            {/* カテゴリグリッド: 2列 */}
            {isOpen && (
              <div className="grid grid-cols-2 gap-1 px-1.5 pb-1.5 pt-1.5 border-t border-border/40">
                {vg.cats.map((cat) => {
                  const isSelected = value.type === "category" && value.categoryId === cat.id;
                  return (
                    <CategoryChip
                      key={cat.id}
                      cat={cat}
                      selected={isSelected}
                      onSelect={() => onChange(isSelected ? { type: "all" } : { type: "category", categoryId: cat.id })}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {noneCount > 0 && <NoneItem value={value} onChange={onChange} />}
    </div>
  );
}

function NoneItem({ value, onChange }: { value: CategoryFilter; onChange: (v: CategoryFilter) => void }) {
  const isSelected = value.type === "category" && value.categoryId === "none";
  return (
    <button
      type="button"
      onClick={() => onChange(isSelected ? { type: "all" } : { type: "category", categoryId: "none" })}
      aria-pressed={isSelected}
      className={cn(
        "flex items-center gap-1 px-1.5 py-[3px] w-full rounded-md border transition-colors",
        isSelected ? "bg-primary/5 border-primary/30" : "bg-muted/40 border-border/40",
      )}
    >
      <span className={cn("truncate flex-1 text-[11px] font-medium italic", isSelected ? "text-primary" : "text-foreground/80")}>カテゴリなし</span>
      {isSelected && <Check className="size-3 shrink-0 text-primary" />}
    </button>
  );
}
