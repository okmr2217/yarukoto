"use client";

import { getGroupEmoji } from "@/lib/categoryGroup";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { CategoryChip } from "./category-chip";
import type { Category, Group } from "@/types";

const UNGROUPED_ID = "__ungrouped__";

interface VirtualGroup {
  id: string;
  name: string;
  emoji: string | null;
}

interface CategorySelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  categories: Category[];
  value: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategorySelectModal({ open, onOpenChange, groups, categories, value, onSelect }: CategorySelectModalProps) {
  const visibleCats = categories.filter((c) => !c.archivedAt);

  const catsByGroup: Record<string, Category[]> = {};
  const ungrouped: Category[] = [];
  for (const cat of visibleCats) {
    if (cat.groupId) {
      catsByGroup[cat.groupId] = [...(catsByGroup[cat.groupId] ?? []), cat];
    } else {
      ungrouped.push(cat);
    }
  }

  const sections: VirtualGroup[] = [
    ...groups.filter((g) => (catsByGroup[g.id]?.length ?? 0) > 0).map((g) => ({ id: g.id, name: g.name, emoji: g.emoji })),
    ...(ungrouped.length > 0 ? [{ id: UNGROUPED_ID, name: "その他", emoji: null }] : []),
  ];

  const getCats = (sectionId: string) => (sectionId === UNGROUPED_ID ? ungrouped : (catsByGroup[sectionId] ?? []));

  const handleSelect = (categoryId: string | null) => {
    onSelect(categoryId);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>カテゴリを選択</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="overflow-y-auto flex-1 py-2 min-h-0">
          {sections.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">カテゴリがありません</p>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => {
                const cats = getCats(section.id);
                const emoji = section.id === UNGROUPED_ID ? "📂" : getGroupEmoji(section.emoji);
                return (
                  <div key={section.id}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm leading-none">{emoji}</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{section.name}</span>
                      <div className="flex-1 border-t border-border ml-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {cats.map((cat) => (
                        <CategoryChip key={cat.id} cat={cat} selected={value === cat.id} onSelect={() => handleSelect(cat.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" className="w-full" onClick={() => handleSelect(null)}>
            クリア
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
