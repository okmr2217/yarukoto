"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateSection, FavoriteSection, SortSection } from "./filter-sections";
import type { useFilterState } from "@/hooks/useFilterState";
import type { SortOrder } from "@/lib/filter-types";

type FilterState = ReturnType<typeof useFilterState>;

interface FilterDetailDialogProps {
  open: boolean;
  onClose: () => void;
  state: FilterState;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

export function FilterDetailDialog({ open, onClose, state, sort, onSortChange }: FilterDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>詳細フィルター</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <DateSection state={state} />
          <FavoriteSection state={state} />
          <div className="border-t border-border/50" />
          <SortSection sort={sort} onSortChange={onSortChange} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
