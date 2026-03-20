# Yarukoto — プロジェクト安定情報

> このドキュメントは「何を作っているか」を記録する。更新頻度は低い（技術スタック変更・設計変更時のみ）。
> 現在の実装状態・積み残しは @docs/handoff.md を参照。

---

## プロダクトコンセプト

Yarukoto（やること）は **日毎の TODO を整理し、短期タスクを効率的に管理する Web アプリ**。

- **今日やること** を中心としたシンプルな管理
- スマホのメモ帳で TODO を書いているユーザーの代替
- カテゴリ・優先度・メモで十分な情報量

### 思想

| 思想 | 内容 |
|------|------|
| 今日主導 | ホームは「今日のタスク」が中心 |
| 軽量入力 | タイトルだけで作成でき、後から属性を追加できる |
| 視認性 | 過期・今日・未予定・完了をセクションで分けて表示 |

---

## コア概念

| 概念 | 説明 | 例 |
|------|------|-----|
| **Task** | やること（ユーザー作成） | 企画書を書く、買い物する |
| **Category** | タスクの分類（ユーザー定義） | 仕事、プライベート |
| **Status** | タスクの状態（3 種類） | PENDING / COMPLETED / SKIPPED |
| **Priority** | 優先度（任意） | HIGH / MEDIUM / LOW / null |

### Task の属性

- `title`（タスク名、必須）
- `memo`（メモ、任意・URL 自動リンク化）
- `status`（PENDING / COMPLETED / SKIPPED）
- `priority`（HIGH / MEDIUM / LOW / null）
- `scheduledAt`（予定日、任意）
- `categoryId`（カテゴリ、任意）
- `skipReason`（やらない理由、任意）
- `displayOrder`（Float 型、ドラッグ＆ドロップ並び替え用）

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15（App Router） |
| UI ライブラリ | React 19 |
| 言語 | TypeScript 5 |
| ORM | Prisma 6 |
| DB | Supabase PostgreSQL |
| 認証 | Better Auth 1.4.9 |
| スタイリング | Tailwind CSS 4 |
| サーバー状態管理 | TanStack React Query 5 |
| バリデーション | Zod 4 |
| 日付処理 | date-fns |
| アイコン | Lucide React |
| Toast | Sonner |
| UI プリミティブ | Radix UI（Dialog・Sheet・AlertDialog 等） |
| カレンダー | react-day-picker |
| ドラッグ＆ドロップ | @dnd-kit |
| ホスティング | Vercel |

---

## アーキテクチャ

```
Client Components（モーダル・フォーム・ドラッグ&ドロップ）
   ↓ TanStack Query Hooks（楽観的更新）
   ↓ Server Actions
Server Actions（認証・バリデーション・DB 書き込み）
   ↓ Prisma
Supabase PostgreSQL

Server Components（ページ・一覧）
   ↓ Server Queries（src/actions/*-queries.ts）
   ↓ Prisma
Supabase PostgreSQL
```

### 鉄則

- DB アクセスはサーバーのみ（Client から Prisma を呼ばない）
- すべてのクエリに `userId` フィルタを必ず含める
- Server Actions は Zod でバリデーション、Better Auth でセッション確認
- Server Actions は `src/actions/task/task-queries.ts` と `task-mutations.ts` で read/write を分離

---

## フォルダ構成

```
yarukoto/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   └── (app)/
│   │       ├── layout.tsx         # 認証済みレイアウト（Sidebar）
│   │       ├── page.tsx           # 全タスクビュー（URLクエリパラメータでフィルタ管理）
│   │       ├── calendar/
│   │       ├── categories/
│   │       └── settings/
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/                # Header, Sidebar, CategoryFilter, FilterPanel, DateNavigation
│   │   ├── task/                  # TaskCard, TaskSection, TaskCreateDialog, TaskEditDialog, TaskDetailSheet, TaskFab
│   │   ├── category/
│   │   └── ui/                    # Radix UI プリミティブ
│   ├── actions/
│   │   ├── task/
│   │   │   ├── task-queries.ts    # 読み取り専用
│   │   │   └── task-mutations.ts  # 書き込み系
│   │   ├── category.ts
│   │   └── account.ts
│   ├── hooks/                     # TanStack Query カスタムフック
│   ├── lib/
│   │   ├── auth.ts / auth-server.ts / auth-client.ts
│   │   ├── prisma.ts
│   │   ├── constants.ts
│   │   ├── dateUtils.ts
│   │   ├── task-helpers.ts
│   │   ├── email.ts
│   │   └── validations/
│   └── types/
│       ├── action-result.ts
│       ├── task.ts
│       └── category.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── docs/
    ├── project.md         # このファイル
    ├── handoff.md
    └── session-log.md
```

---

## DB スキーマ（要点）

```prisma
model Task {
  id           String    @id @default(cuid())
  userId       String
  categoryId   String?
  title        String    // max 200
  memo         String?   // max 10000
  status       TaskStatus @default(PENDING)
  priority     Priority?
  scheduledAt  DateTime? @db.Date
  completedAt  DateTime?
  skippedAt    DateTime?
  skipReason   String?
  displayOrder Float
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(...)
  category     Category? @relation(...)
}

model Category {
  id     String  @id @default(cuid())
  userId String
  name   String  // max 50
  color  String? // hex code
  @@unique([userId, name])
}

enum TaskStatus { PENDING  COMPLETED  SKIPPED }
enum Priority  { HIGH  MEDIUM  LOW }
```

### 重要な設計判断

- `scheduledAt` は PostgreSQL の `DATE` 型（タイムゾーンなし、YYYY-MM-DD）
- `displayOrder` は Float 型（新規タスクは最小値 - 1.0、並び替えは中間値）
- カテゴリの物理削除は可能だが、タスクの `categoryId` は `SET NULL`
- タスクの物理削除あり（soft delete なし）
- タイムゾーンは JST（Asia/Tokyo）を基準に `dateUtils.ts` で統一処理

---

## Key Patterns

### Result 型パターン

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };

// ヘルパー
success(data) → { success: true, data }
failure(error, code) → { success: false, error, code }
```

### 楽観的更新パターン（TanStack Query）

- queryKey は `["allTasks", filtersObj]` — prefix `["allTasks"]` で全フィルタバリアントをまとめて無効化
- mutations は `{ queryKey: ["allTasks"] }` prefix マッチで既存の楽観的更新がすべて機能する

```typescript
onMutate: async (input) => {
  await queryClient.cancelQueries({ queryKey: ["allTasks"] });
  const snapshot = queryClient.getQueryData<Task[]>(["allTasks", filters]);
  queryClient.setQueryData(["allTasks", filters], optimisticUpdate(snapshot, input));
  return { previousAllTasks: snapshot };
},
onError: (_, __, context) => {
  queryClient.setQueryData(["allTasks", filters], context?.previousAllTasks);
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ["allTasks"] });
},
```

### URL フィルタパラメータ（ホーム画面）

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `category` | string | カテゴリ ID でフィルタ |
| `date` | YYYY-MM-DD | 単日フィルタ（scheduledAt 一致 OR completedAt/skippedAt/createdAt がその日の JST 範囲内） |
| `keyword` | string | タイトル・メモの部分一致（大文字小文字無視） |
| `status` | all / pending / completed / skipped | ステータスフィルタ |
| `favorite` | 1 | お気に入りのみ表示 |

- フィルタ有効時は D&D 無効
- `date` フィルタ有効時はマッチ理由バッジをタスクカードに表示（クライアント側で JST 変換して判定）

### バリデーション定数

| 定数 | 値 |
|------|-----|
| TITLE_MAX_LENGTH | 500 |
| MEMO_MAX_LENGTH | 10000 |
| SKIP_REASON_MAX_LENGTH | 1000 |
| CATEGORY_NAME_MAX_LENGTH | 100 |

---

## デザインシステム

| 要素 | 値 |
|------|-----|
| Primary | オレンジ系（Tailwind `orange-*`） |
| Background | ホワイト / グレー系 |
| デザイン方針 | カード型・モダン、モバイルファースト |

- Tailwind CSS のみ使用（CSS-in-JS なし）
- アイコンは lucide-react のみ
- UI プリミティブは Radix UI ベース（`src/components/ui/`）
- Prettier printWidth = 120
