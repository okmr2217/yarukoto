"use client";

import { cn } from "@/lib/utils";
import { FilterSectionInfo } from "./filter-section-info";
import {
  FilterStatusChips,
  FilterDateNav,
  FilterFavoriteToggle,
  FilterSortChips,
  FilterKeywordInput,
} from "./filter-controls";
import { CategorySelectFilter } from "@/components/category";
import type { useFilterState } from "@/hooks/useFilterState";
import type { Category } from "@/types";
import { type SortOrder, SORT_OPTIONS } from "@/lib/filter-types";
import { type CategoryFilter, UNGROUPED_VIRTUAL_ID } from "@/lib/category-filter";

type FilterState = ReturnType<typeof useFilterState>;

// ─── セクションラベル ────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode;
  tooltip?: string;
  badge?: string;
  noMargin?: boolean;
}

export function SectionLabel({ children, tooltip, badge, noMargin = false }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium text-muted-foreground tracking-wide", !noMargin && "mb-1")}>
      {children}
      {tooltip && <FilterSectionInfo content={tooltip} />}
      {badge && <span className="ml-auto font-normal text-[10px] text-primary/90 max-w-[7rem] truncate">{badge}</span>}
    </div>
  );
}

// ─── 各セクション ─────────────────────────────────────────────────────────────

export function StatusSection({ state }: { state: FilterState }) {
  return (
    <section>
      <SectionLabel tooltip="タスクの進捗状態で絞り込みます。1つだけ選択できます。デフォルトは「未完了」で、完了済みやスキップしたタスクの確認にも使えます。">
        ステータス
      </SectionLabel>
      <FilterStatusChips
        statusFilter={state.statusFilter}
        statusCounts={state.statusCounts}
        allFilteredTasks={state.allFilteredTasks}
        onUpdate={state.updateSearchParams}
      />
    </section>
  );
}

export function DateSection({ state }: { state: FilterState }) {
  const badge = (() => {
    if (!state.dateFilter) return undefined;
    if (state.dateFilter === state.today) return "今日";
    const [, m, d] = state.dateFilter.split("-");
    return `${m}/${d}`;
  })();

  return (
    <section>
      <SectionLabel
        tooltip="特定の日付のタスクだけを表示します。未設定の場合は全期間が対象。前後の矢印ボタンで1日ずつ移動できます。"
        badge={badge}
      >
        日付
      </SectionLabel>
      <FilterDateNav dateFilter={state.dateFilter} today={state.today} onUpdate={state.updateSearchParams} />
    </section>
  );
}

export function CategorySection({
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  countByCategory,
  countByGroup,
}: {
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  countByCategory: Record<string, number>;
  countByGroup: Record<string, number>;
}) {
  const badge = (() => {
    if (categoryFilter.type === "category") {
      const name = categories.find((c) => c.id === categoryFilter.categoryId)?.name;
      return name ? (name.length > 8 ? `${name.slice(0, 8)}…` : name) : undefined;
    }
    if (categoryFilter.type === "group") {
      if (categoryFilter.groupId === UNGROUPED_VIRTUAL_ID) return "グループなし";
      const name = categories.find((c) => c.groupId === categoryFilter.groupId)?.group?.name;
      return name ? (name.length > 8 ? `${name.slice(0, 8)}…` : name) : undefined;
    }
    return undefined;
  })();

  return (
    <section>
      <SectionLabel
        tooltip="1つ選択できます。グループ名をクリックするとそのグループ全体、カテゴリ名をクリックすると個別絞り込みができます。再クリックで解除。"
        badge={badge}
      >
        カテゴリ
      </SectionLabel>
      <CategorySelectFilter
        categories={categories}
        categoriesLoading={categoriesLoading}
        value={categoryFilter}
        onChange={onCategoryFilterChange}
        countByCategory={countByCategory}
        countByGroup={countByGroup}
      />
    </section>
  );
}

export function KeywordSection({ state }: { state: FilterState }) {
  const kw = state.localKeyword;
  const badge = kw ? (kw.length > 8 ? `${kw.slice(0, 8)}…` : kw) : undefined;

  return (
    <section>
      <SectionLabel
        tooltip="タスク名・メモに含まれる文字列でリアルタイムに絞り込みます。他のフィルターと組み合わせて使えます。"
        badge={badge}
      >
        キーワード
      </SectionLabel>
      <FilterKeywordInput
        localKeyword={state.localKeyword}
        isComposingRef={state.isComposingRef}
        onKeywordChange={state.handleKeywordChange}
        onCompositionEnd={state.handleCompositionEnd}
        onKeywordClear={state.handleKeywordClear}
      />
    </section>
  );
}

export function FavoriteSection({ state }: { state: FilterState }) {
  return (
    <section>
      <SectionLabel tooltip="★マークをつけたタスクだけを表示します。重要なタスクをすばやく確認したいときに使います。">
        お気に入り
      </SectionLabel>
      <FilterFavoriteToggle
        favoriteFilter={state.favoriteFilter}
        favoriteCount={state.allFilteredTasks?.filter((t) => t.isFavorite).length}
        onUpdate={state.updateSearchParams}
      />
    </section>
  );
}

export function SortSection({ sort, onSortChange }: { sort: SortOrder; onSortChange: (sort: SortOrder) => void }) {
  const badge = sort !== "displayOrder" ? SORT_OPTIONS.find((o) => o.value === sort)?.label : undefined;

  return (
    <section>
      <SectionLabel
        tooltip="タスクの並び順を変更します。「表示順」はドラッグ＆ドロップで設定したカスタム順、「予定日」は予定日の近い順に並びます。"
        badge={badge}
      >
        並び順
      </SectionLabel>
      <FilterSortChips sort={sort} onSortChange={onSortChange} />
    </section>
  );
}
