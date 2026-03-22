"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  DragOverlay,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryEditDialog } from "@/components/category";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useUpdateCategorySortOrder,
  useDeleteCategory,
} from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Category } from "@/types";

interface SortableCategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function SortableCategoryRow({ category, onEdit, onDelete }: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label="ドラッグして並び替え"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color || "#6B7280" }}
        />
        <div className="min-w-0">
          <span className="font-medium">{category.name}</span>
          {category.description && (
            <p className="text-sm text-muted-foreground truncate">{category.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(category)} aria-label="編集">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(category)}
          aria-label="削除"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CategoryRowOverlay({ category }: { category: Category }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-lg">
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color || "#6B7280" }}
        />
        <span className="font-medium">{category.name}</span>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useCategories();
  const queryClient = useQueryClient();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const updateSortOrder = useUpdateCategorySortOrder();
  const deleteCategory = useDeleteCategory();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  );

  const handleCreate = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: { name: string; color: string; description?: string }) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: data.name,
          color: data.color,
          description: data.description,
        });
      } else {
        await createCategory.mutateAsync({
          name: data.name,
          color: data.color,
          description: data.description,
        });
      }
      setIsDialogOpen(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const cat = categories?.find((c) => c.id === event.active.id);
    setActiveCategory(cat ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCategory(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    // Optimistic update
    queryClient.setQueryData<Category[]>(["categories"], reordered);

    const updates = reordered.map((cat, i) => ({ id: cat.id, sortOrder: i }));
    updateSortOrder.mutate(updates, {
      onError: () => {
        queryClient.setQueryData<Category[]>(["categories"], categories);
      },
    });
  };

  return (
    <div className="flex-1 bg-background">
      <Header />

      <div className="max-w-2xl w-full mx-auto">
        <main className="p-4">
          <h1 className="text-xl font-semibold mb-3">カテゴリ</h1>
          <p className="text-sm text-muted-foreground mb-6">
            タスクに設定するカテゴリを管理します。色を設定してタスクを視覚的に分類できます。ドラッグで表示順を並び替えられます。
          </p>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              エラーが発生しました: {error.message}
            </div>
          ) : (
            <>
              {/* Category list */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories?.map((c) => c.id) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categories && categories.length > 0 ? (
                      categories.map((category) => (
                        <SortableCategoryRow
                          key={category.id}
                          category={category}
                          onEdit={handleEdit}
                          onDelete={setDeletingCategory}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>カテゴリがありません</p>
                        <p className="text-sm mt-1">下のボタンから新しいカテゴリを追加しましょう</p>
                      </div>
                    )}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeCategory && <CategoryRowOverlay category={activeCategory} />}
                </DragOverlay>
              </DndContext>

              {/* Add button */}
              <button
                onClick={handleCreate}
                className="w-full mt-4 flex items-center justify-center gap-2 p-4 bg-card rounded-lg border border-dashed border-border hover:border-primary hover:bg-accent transition-colors"
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">新しいカテゴリを追加</span>
              </button>
            </>
          )}
        </main>
      </div>

      {/* Edit Dialog */}
      <CategoryEditDialog
        key={editingCategory?.id ?? "new"}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={editingCategory}
        onSave={handleSave}
        isLoading={createCategory.isPending || updateCategory.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingCategory?.name}」を削除します。
              このカテゴリに紐づいているタスクはカテゴリなしになります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
