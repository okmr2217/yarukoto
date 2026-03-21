# Session Log

新しい記録を先頭に追記（降順）。

---

## 2026-03-22（ナビゲーション「ホーム」→「タスク」に変更）

### やったこと

- `NAV_ITEMS` のホーム項目のラベルを `ホーム` → `タスク` に変更
- アイコンを `Home` → `ListTodo`（Lucide）に変更
- `sidebar.tsx` / `header.tsx` の import と iconMap を合わせて更新

---

## 2026-03-22（ページヘッダーのUI統一）

### やったこと

- calendar・categories・settings の各ページからモバイル専用 sticky ヘッダー（戻るボタン + タイトル）を削除
- インデックスページと同じ `<Header />` コンポーネント（ハンバーガーメニュー + ロゴ）を3ページに追加
- ページタイトルをインライン見出し `<h1>` として PC・モバイル共通で表示（`hidden md:block` を削除）
- 見出しと説明文の間隔を `mb-3` に統一

### 技術メモ

- `<Header />` はもともと index ページのみで使用していた（layout.tsx には含まれていない）
- 不要になった `Link`・`ArrowLeft` インポートを各ページから削除

---

## 2026-03-22（カレンダー集計表示の改善）

### やったこと

- カレンダー各日セルの集計表示を3指標独立表示に刷新
  - `createdCount`（作成数・`createdAt`基準）を `DayTaskStats` 型と `getMonthlyTaskStats` に追加
  - セルに PenLine（作成）/ CalendarDays（予定）/ CheckCheck（完了）の Lucide アイコン + 数値を表示
  - 非ゼロの指標のみ表示。`hasStats` 条件を3指標のいずれかが1以上に修正（元バグ解消）
  - Tooltip を廃止
- カレンダーページ下部に凡例を追加（アイコン説明 + 当月完了カテゴリのカラードット一覧）
- カレンダーページのヘッダーをカテゴリ管理ページと同パターンに統一
  - モバイル: sticky ヘッダー（ArrowLeft 戻るボタン + "カレンダー" タイトル）
  - PC: `hidden md:flex` ヘッダー（タイトルのみ）
  - 共通 `<Header />` コンポーネントを削除
- 「今日」ボタンを削除

### 技術メモ

- `total`（scheduledAt）と `completed`（completedAt）は異なる日付基準のまま。独立指標として明示することで混乱を防ぐ設計
- カテゴリ凡例は `useMemo` で stats から当月の完了カテゴリを集約して表示（ゼロ件月は非表示）

---

## 2026-03-21（フィルタトグルのパフォーマンス改善）

### やったこと

- `FilterArea` コンポーネントを新規作成（`src/components/layout/filter-area.tsx`）
  - `filterPanelOpen` state を `HomePage` から切り出し `FilterArea` 内に移動
  - `CategoryFilter` と `FilterPanel` をまとめて管理
  - `FilterPanel` の表示切替を `{filterPanelOpen && ...}` の条件レンダリングから `hidden` クラスの切り替えに変更（事前マウント）
- `page.tsx` から `filterPanelOpen` state・`CategoryFilter`・`FilterPanel` の直接使用を削除し `FilterArea` に置き換え

### 技術メモ

- 遅延の原因は2段階あった
  1. `FilterPanel` がアンマウント済みだったため、開くたびに初回マウントコストが発生
  2. `filterPanelOpen` state が `HomePage` にあったため、トグルのたびに `TaskSection` 含む全子コンポーネントが再レンダリングされていた
- state を子コンポーネントに閉じ込めることで `HomePage` の再レンダリングを根本から防止

---

## 2026-03-21（ホームページ スケルトン UI）

### やったこと

- `page.tsx` の `isLoading` 時の表示を「読み込み中...」テキストからスケルトン UI に変更
  - Header・CategoryFilter は実際のコンポーネントをそのまま表示（レイアウトジャンプ防止、フィルター操作も可能）
  - 未完了セクションのカード 4 枚分をスケルトン表示（チェックボックス・タイトル・作成日・メニューボタン・バッジ行）
  - `animate-pulse` + `bg-muted` でスタイル統一、外部ライブラリ不要
  - タイトル幅は `55 / 72 / 40 / 63 %` で変化、偶数行にはバッジ行スケルトンも追加

### 技術メモ

- shadcn/ui の `Skeleton` コンポーネントは未導入のため `animate-pulse bg-muted` で直接実装
- 完了・やらないセクションはデフォルト折りたたみのため省略しても自然な見た目になる

---

## 2026-03-21（作成日時・予定日の相対表示）

### やったこと

- `dateUtils.ts` に `formatRelativeDate`（Twitter風・datetime用）と `formatRelativeScheduledDate`（DATE型・前後両対応）を追加
  - `formatRelativeDate`: 60秒以内/N分前/N時間前/N日前/YYYY/MM/DD
  - `formatRelativeScheduledDate`: 昨日/N日前/M/d（過去）、明日/N日後/M/d（未来）、境界は7日
- タスクカードのタイトル行右端（☆ の左）に作成日時を `text-xs text-muted-foreground/50` で常時表示
- 予定日バッジ（overdue・future）の表示テキストを相対形式に変更（例: `3日前`、`明日`、`3日後`）

### 技術メモ

- `scheduledAt` は DATE 型（時刻なし）のため seconds ベースの `formatRelativeDate` は不適。`differenceInDays` を使った日単位の専用関数を用意
- `parseJSTDate` でUTC正午として解釈するため、タイムゾーンによるズレが起きない

---

## 2026-03-21（TaskCard メタバッジ UI 改善 / D&D ハンドル改善）

### やったこと

- **TaskCardMeta リデザイン（Part 2）**
  - バッジを3分類に整理: ステータスバッジ（ピル型背景色付き）・日付バッジ（テキスト+アイコン）・カテゴリドット
  - 絵文字をすべて Lucide アイコンに統一（Calendar / AlertCircle / CheckCircle2 / Clock / Ban）
  - 2行レイアウト導入: 1行目=タスク固有情報（予定日・カテゴリ・スキップ理由）、2行目=文脈情報（matchReasons、opacity-70）
  - matchReasons の「予定日」を scheduledDateStatus バッジと重複しないようフィルタリング
  - `page.tsx` の `getMatchReasons` から絵文字を除去しプレーンな文字列に統一
  - カテゴリ表示をタイトル行のドットからメタ行のカラードット（`w-2 h-2`）に移動し、Tooltip の title 属性でカテゴリ名を確認できるように
- **D&D ハンドル改善**
  - グリップアイコンをインライン配置からカード左端のグレーストライプ（`w-6 bg-muted/50`）に変更
  - アイコンは `h-4 w-4 text-muted-foreground/50` で存在感を抑制
  - D&D 無効時はストライプ非表示・通常の `p-3` レイアウトを維持

### 技術メモ

- `MATCH_REASON_CONFIG` を定数化し、reason 文字列 → `{ Icon, className }` マッピングで拡張しやすい構造に
- カード外側を `flex` に変更したことで、D&D ストライプと本文エリアを自然に分離できた
- 親の `overflow-hidden rounded-lg` により、先頭・末尾カードのストライプ角丸は自動クリップされる

---

## 2026-03-21（TaskCard リファクタリング）

### やったこと

- **StopPropagation** ラッパーコンポーネントを作成し、`onPointerDown + onClick` の `stopPropagation` 重複（チェックボックス・スター・ドロップダウンの3箇所）を共通化
- **ACTION_DEFINITIONS** 定数をコンポーネント外に切り出し（label / Icon / className / destructive の静的部分）
- **TaskCardActions** サブコンポーネントに分割（スターボタン + ドロップダウンメニュー）
- **TaskCardMeta** サブコンポーネントに分割（予定日バッジ・matchReasons・スキップ理由）
- **getScheduledDateStatus** を `src/lib/dateUtils.ts` に移動し、コンポーネント内は `useMemo` で呼び出し

### 技術メモ

- `ACTION_DEFINITIONS` は `LucideIcon` 型を使うことで Icon コンポーネント参照を保持できる（`<action.Icon className="..." />` で JSX レンダリング）
- `as const` ではなく明示的な型定義配列にした方が `destructive?: boolean` のオプショナルが扱いやすい

---

## 2026-03-21（TaskCard / TaskSection スタイル変更）

### やったこと

- **TaskSection**: タスクリスト全体を `rounded-lg border border-border overflow-hidden bg-card` でグループ枠化（iOS Settings リスト風）
  - 隣接タスク間に `border-t border-border` の仕切り線を挿入（最後の下には入れない）
  - `space-y-2` を廃止（個別カードの間隔をなくして連続表示に）
- **TaskCard**: 個別カードの枠線・shadow・rounded をすべて削除（`bg-card border rounded-lg` → `p-3` のみ）
  - PC ホバー時アクションボタン群を完全削除
  - `⋯` ドロップダウンを常時表示（`sm:hidden` 廃止）
  - カテゴリ表示をカラーバッジ → カラードット（`w-2 h-2 rounded-full`）に変更。Tooltip でカテゴリ名を表示
  - `isHovered` state・`onMouseEnter`/`onMouseLeave` を削除
  - メモは `whitespace-pre-wrap` で改行を反映（元々対応済みだったため変更なし）

### 次にやりたいこと

- 繰り返しタスク実装の検討
- タスクのコピー機能（別日への複製）

---

## 2026-03-20（ナビゲーショングループ廃止・フラット表示化）

### やったこと

- `constants.ts` から `NAV_GROUPS` を削除、`NAV_ITEMS` の `group` フィールドを除去
- `sidebar.tsx`: グループループを廃止し、`NAV_ITEMS.map()` で直接フラット表示
- `header.tsx`: モバイルメニューのグループループを廃止し、同様にフラット表示

### 次にやりたいこと

- 繰り返しタスク実装の検討
- タスクのコピー機能（別日への複製）

---

## 2026-03-20（FilterPanel UI 改善 / フィルタ開閉ボタン追加）

### やったこと

- `FilterPanel` コンポーネントを UI 改善
  - レイアウトを `grid grid-cols-[5rem_1fr]` のラベル+フィールド表形式に変更
  - `dateFrom`/`dateTo` 範囲フィルタを廃止し、日付ナビゲーション（←→・今日・×）を FilterPanel 内に統合
  - キーワード入力を `h-7 text-xs max-w-xs` に統一（他フィールドと高さ・サイズ感を揃える）
- `CategoryFilter` にフィルタ開閉ボタン（`SlidersHorizontal` アイコン）を追加
  - PC・モバイル両対応（CategoryFilter はどちらでも表示される）
  - アクティブ時: `text-primary bg-primary/10`、フィルタ有効時はドットインジケーター表示
- `Header` からフィルタ関連 props を除去（`onFilterToggle`/`hasActiveFilters` → CategoryFilter へ移動）
- `DateNavigation` に `onClear?: () => void` prop を追加（× ボタン）
- `useAllTasks` の filters から `dateFrom`/`dateTo` を除去（`getAllTasksSchema` も合わせて削除済み）

### 技術メモ

- Tailwind の `grid-cols-[5rem_1fr]` で任意幅カラムを指定する方法が有効
- フィルタ開閉ボタンは Header ではなく CategoryFilter に置くことで PC/モバイル共通対応できた

### 次にやりたいこと

- 繰り返しタスク実装の検討
- タスクのコピー機能（別日への複製）

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
