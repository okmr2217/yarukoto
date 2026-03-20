# Session Log

新しい記録を先頭に追記（降順）。

---

## 2026-03-20（全タスクビュー統合 / dates・search 廃止）

### やったこと

- `getAllTasks` Server Action を拡張（`date`, `keyword`, `status`, `isFavorite`, `dateFrom`, `dateTo` パラメータ追加）
  - `date` 指定時: `scheduledAt` 一致 OR `completedAt`/`skippedAt`/`createdAt` がその日の JST 範囲内の OR クエリ
- `useAllTasks` hook を複合フィルタ対応に更新（queryKey にフィルタオブジェクトを含める）
- `page.tsx`（ホーム画面）を全面書き換え：
  - `?date=`, `?category=`, `?keyword=`, `?status=`, `?favorite=`, `?dateFrom=`, `?dateTo=` をURLクエリパラメータで管理
  - `?date=` 指定時: DateNavigation 表示、× で日付フィルタ解除、マッチ理由バッジ表示（クライアント側で判定）
  - フィルタパネル（Header の検索アイコンでトグル）：keyword/status/isFavorite/dateFrom/dateTo
  - お気に入りフィルタを独立ボタンからフィルタパネルに統合
  - D&D は dateFilter/hasActiveFilters がない場合のみ有効
- `FilterPanel` コンポーネントを新規作成 (`src/components/layout/filter-panel.tsx`)
- `Header`: 検索アイコンを `onFilterToggle` コールバックがある場合にフィルタトグルボタンへ変更。アクティブ時ドット表示
- `DateNavigation`: `onClear` オプション prop を追加（× ボタン）
- `TaskCard`/`TaskSection`: `matchReasons?: string[]` prop を追加してバッジ表示
- カレンダーの日付クリックを `/?date=YYYY-MM-DD` に変更（`/dates/xxx` 廃止）
- 削除ファイル: `dates/[date]/page.tsx`, `search/page.tsx`, `components/search/`, `use-date-tasks.ts`, `use-tasks.ts`, `use-search-tasks.ts`
- `NAV_ITEMS` から `/search` を削除、Sidebar の Search アイコン除去
- `use-task-mutations.ts`: `dateTasks` キャッシュ参照をすべて除去、`CacheSnapshot` を `allTasks` のみに簡略化

### 技術メモ

- Prisma の複合 OR/AND 条件: `andConditions[]` 配列に push して `{ AND: andConditions }` で結合するパターン
- `matchReasons` の計算はクライアント側（`formatDateToJST(new Date(completedAt)) === dateFilter` で JST 変換）
- `useAllTasks` の queryKey は `["allTasks", filtersObj]` — mutations の `{ queryKey: ["allTasks"] }` prefix マッチで既存の楽観的更新がすべて機能する

### 次にやりたいこと

- 繰り返しタスク実装の検討
- 完了タスク折りたたみのデフォルト挙動設計

---

## 2026-03-20（カテゴリ表示順並び替え機能）

### やったこと

- `Category` モデルに `sortOrder Int @default(0)` を追加（migration + 既存データを name 昇順で初期化）
- `getCategories` の orderBy を `name: asc` → `[sortOrder: asc, createdAt: asc]` に変更
- `createCategory` で `MAX(sortOrder) + 1` を新規カテゴリに割り当て
- `updateCategorySortOrder` Server Action を新規追加（`prisma.$transaction` で一括更新）
- `useUpdateCategorySortOrder` mutation フックを追加
- `useCreateCategory` / `useUpdateCategory` の楽観的更新から名前順ソートを削除
- `/categories` ページに dnd-kit（DndContext + SortableContext + DragOverlay）でドラッグ並び替えを実装
  - GripVertical ハンドル（touch-none）+ 楽観的更新 + エラー時ロールバック

### 技術メモ

- `useUpdateCategorySortOrder` は楽観的更新を hook 内ではなく page.tsx 側の handleDragEnd で直接実装（queryClient.setQueryData）
- onSettled で invalidateQueries を実行してサーバーと同期

---

## 2026-03-20（タスク編集モーダルの楽観的更新改善）

### やったこと

- `sonner` を導入し、`Providers` に `<Toaster richColors />` を追加
- タスク編集モーダルを即座に閉じる楽観的更新を実装
  - `handleEditTaskWithDetails` を `mutateAsync` (await) → `mutate` に変更
  - `setEditingTask(null)` を先に実行してモーダルを即閉じ
  - 対象: `page.tsx`（ホーム）、`dates/[date]/page.tsx`、`search/page.tsx`
- 更新失敗時に `toast.error("タスクの更新に失敗しました")` を表示
  - `use-task-mutations.ts` の update onError に追加
  - `use-today-tasks.ts` の useUpdateTask の onError に追加
- `TaskEditDialog` から `isLoading` prop と関連ロジック（disabled・"保存中..."）を削除

### 技術メモ

- search/page.tsx は `useUpdateTask` を直接使うため `onSuccess: invalidateSearch` をコールバックで渡す形に変更
- 既存の lint エラー（`use-media-query.ts`, `use-settings.ts`, `use-theme.ts`）は変更前からの既存問題

### 次にやりたいこと

- DB 接続を確認してマイグレーションを適用（isFavorite カラム）
- 繰り返しタスクの実装検討

---

## 2026-03-20（お気に入り機能実装）

### やったこと

- 優先度（HIGH/MEDIUM/LOW）機能を廃止してお気に入り（★）機能に置き換え
  - `isFavorite Boolean @default(false)` カラムを Prisma スキーマに追加
  - マイグレーションファイルを手動作成（DB 接続不可のため）
  - Task 型から priority を削除、isFavorite: boolean を追加
  - バリデーションスキーマ（priority → toggleFavoriteSchema, searchTasksSchema の isFavorite）を更新
  - `toggleFavorite` Server Action を追加（楽観的更新対応）
  - タスクカードに ★ トグルボタンを追加（常時表示、lucide-react の Star アイコン）
  - タスク作成・編集フォームから優先度選択 UI を削除
  - 検索フィルタの優先度ドロップダウンを「お気に入りのみ」チェックボックスに置き換え
  - ホーム画面に ★ フィルタトグルボタンを追加（お気に入りのみ表示/全表示）
  - タスク詳細シートの PriorityBadge を「★ お気に入り」バッジに変更
  - `use-task-mutations`, `use-today-tasks` から priority 参照を除去

### 改善案（未対応）

- DB が停止中のため、デプロイ後に `prisma migrate deploy` を実行する必要あり

### 失敗したアプローチ

- `prisma migrate dev` がリモート DB 接続不可で失敗 → マイグレーション SQL を手動作成で対応

### 技術メモ

- Prisma クライアントは `prisma generate` で問題なく生成できた（DB 接続不要）
- DB の priority カラムはデータ保全のため残置（削除なし）
- ★ ボタンは hover に依存せず常時表示（モバイルでも使いやすい設計）

### 次にやりたいこと

- DB 接続を確認してマイグレーションを適用
- 繰り返しタスクの実装検討
- 完了タスク折りたたみのデフォルト挙動設計

---

## 2026-03-20

### やったこと

- Claude Code ワークフロー（セッション管理・バージョニング）を導入
  - `docs/project.md` を新規作成（安定情報を handoff.md から分離）
  - `docs/handoff.md` を「今どこにいるか」のみに絞り込み
  - `docs/session-log.md` を新規作成
  - `docs/versioning.md` を新規作成
  - `CHANGELOG.md` を新規作成
  - `CLAUDE.md` を 2 ゾーン構成（プロジェクト固有 + 汎用ルール）に書き直し

### 改善案（未対応）

- なし

### 失敗したアプローチ

- なし

### 技術メモ

- なし

### 次にやりたいこと

- handoff.md の「今後の候補」から優先度の高いものを選んで実装
