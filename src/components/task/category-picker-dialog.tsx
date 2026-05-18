"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CategorySelector } from "./category-selector";
import type { Category, Group } from "@/types";

interface CategoryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  groups: Group[];
  selectedCategoryId: string | null;
  onChange: (id: string | null) => void;
  mode: "create" | "edit";
  recentCategoryIds: string[];
}

export function CategoryPickerDialog({ open, onOpenChange, categories, groups, selectedCategoryId, onChange, mode, recentCategoryIds }: CategoryPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>カテゴリ</DialogTitle>
          <DialogDescription className="sr-only">カテゴリを選択してください。</DialogDescription>
        </DialogHeader>
        <CategorySelector
          categories={categories}
          groups={groups}
          selectedCategoryId={selectedCategoryId}
          onChange={(id) => {
            onChange(id);
            onOpenChange(false);
          }}
          mode={mode}
          recentCategoryIds={recentCategoryIds}
        />
      </DialogContent>
    </Dialog>
  );
}
