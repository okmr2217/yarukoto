# Yarukoto — セッション引き継ぎドキュメント

> 最終更新: 2026-03-17
> バージョン: 0.1.0
> このドキュメントは次の AI セッションで開発を継続するための完全なコンテキストです。

---

## 1. プロダクトコンセプト

Yarukoto（やること）は **日毎の TODO を整理し、短期タスクを効率的に管理する Web アプリ**。

長期カレンダー管理ではなく、

- **今日やること** を中心としたシンプルな管理
- スマホのメモ帳で TODO を書いているユーザーの代替
- カテゴリ・優先度・メモで十分な情報量

こういった **「今日やること」に集中したタスク管理** が目的。

### 思想

| 思想 | 内容 |
|------|------|
| 今日主導 | ホームは「今日のタスク」が中心 |
| 軽量入力 | タイトルだけで作成でき、後から属性を追加できる |
| 視認性 | 過期・今日・未予定・完了をセクションで分けて表示 |

---

## 2. コア概念

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

## 3. 主な操作フロー

```
Home（今日のタスク）
↓
N キー or FAB でタスク作成
↓
タスクカードの操作
  ├─ チェック → 完了
  ├─ 編集 → タスク編集ダイアログ
  ├─ 詳細 → タスク詳細シート
  ├─ やらない → スキップ理由ダイアログ
  └─ 削除 → 確認なしで削除
↓
日付ナビゲーションで過去・未来の日付へ移動
```

---

## 4. 現在の実装状態（v0.1.0）

### 実装済み画面

| パス | 画面 | 主な機能 |
|------|------|---------|
| `/login` | ログイン | email/password 認証（Better Auth） |
| `/signup` | 新規登録 | ユーザー作成 |
| `/forgot-password` | パスワードリセット申請 | メール送信 |
| `/reset-password` | パスワードリセット実行 | 新パスワード設定 |
| `/` | Home（今日のタスク） | タスクセクション・FAB・N キーショートカット |
| `/dates/[date]` | 日付別タスク | 特定日のタスク表示 |
| `/calendar` | カレンダー | 月次カレンダー・日付クリックで遷移 |
| `/search` | 検索 | タスク全文・フィルター検索 |
| `/categories` | カテゴリ管理 | 一覧・作成・編集・削除 |
| `/settings` | 設定 | メール表示・パスワード変更・ログアウト・アカウント削除 |

### 実装済み機能

- タスク CRUD（作成・編集・完了・未完了に戻す・やらない・削除）
- ドラッグ＆ドロップ並び替え（displayOrder Float 方式）
- N キーショートカットでタスク作成モーダルを開く
- 新規タスクは常に最前に表示
- タスクの日付別セクション表示（過期・今日・未予定・完了・スキップ）
- カテゴリフィルター（画面上部に固定）
- タスク詳細シート（メモの URL 自動リンク化）
- タスク検索（displayOrder 順表示）
- カレンダー画面（サイドバーなし、DateCell クリックで直接遷移）
- メール・パスワード変更、パスワードリセット
- アカウント削除
- GitHub Actions による Supabase 停止防止（定期 ping）
- PWA manifest 設定（service worker は未実装）

### コミット履歴（抜粋）

| コミット | 内容 |
|---------|------|
| eec49f3 | chore: アイコン画像を変更 |
| 7f91712 | refactor: サイドバー・ヘッダーのナビゲーション UI を改善 |
| f81dcd0 | refactor: actions 配列でボタン順序を一元管理 |
| a02eed5 | feat: タスク詳細閲覧機能を追加 |
| ec09dd2 | feat: メモ欄の URL を自動リンク化 |
| 97aebf9 | feat: N キーでタスク作成モーダルを開くショートカット追加 |
| b460183 | feat: タスクのドラッグ＆ドロップ並び替え機能を実装 |
| 374eb5e | perf: タスク並び替えを小数方式で最適化 |
| c873d7c | feat: カテゴリタブ付き全タスク一覧ホームページを追加 |
| 3e45c90 | feat: カレンダーページを独立したページとして追加 |
| 206239d | feat: メール・パスワード変更とパスワードリセット機能を追加 |

---

## 5. 技術スタック

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

## 6. アーキテクチャ

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

## 7. フォルダ構成

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
│   │       ├── page.tsx           # Home（今日のタスク）
│   │       ├── dates/[date]/
│   │       ├── calendar/
│   │       ├── search/
│   │       ├── categories/
│   │       └── settings/
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/                # Header, Sidebar, DateNavigation, CategoryFilter
│   │   ├── task/                  # TaskCard, TaskSection, TaskCreateDialog, TaskEditDialog, TaskDetailSheet, TaskFab
│   │   ├── search/
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
    ├── requirements.md
    ├── api-design.md
    ├── screen-design.md
    ├── coding-guidelines.md
    └── handoff.md                 # このファイル
```

---

## 8. DB スキーマ（要点）

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

## 9. Key Patterns

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

```typescript
onMutate: async (input) => {
  await queryClient.cancelQueries({ queryKey: QUERY_KEYS.DATE_TASKS(date) });
  const snapshot = queryClient.getQueryData(QUERY_KEYS.DATE_TASKS(date));
  queryClient.setQueryData(QUERY_KEYS.DATE_TASKS(date), optimisticUpdate(input));
  return { snapshot };
},
onError: (_, __, context) => {
  queryClient.setQueryData(QUERY_KEYS.DATE_TASKS(date), context.snapshot);
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DATE_TASKS(date) });
},
```

### タスクのタイトル上限・バリデーション

| 定数 | 値 |
|------|-----|
| TITLE_MAX_LENGTH | 500 |
| MEMO_MAX_LENGTH | 10000 |
| SKIP_REASON_MAX_LENGTH | 1000 |
| CATEGORY_NAME_MAX_LENGTH | 100 |

---

## 10. デザインシステム

| 要素 | 値 |
|------|-----|
| Primary | オレンジ系（Tailwind `orange-*`） |
| Background | ホワイト / グレー系 |
| デザイン方針 | カード型・モダン、モバイルファースト |

- Tailwind CSS のみ使用（CSS-in-JS なし）
- アイコンは lucide-react のみ
- UI プリミティブは Radix UI ベース（`src/components/ui/`）
- Prettier printWidth = 120

---

## 11. 未実装・今後の候補

### 短期（UX 改善）

| 機能 | 概要 | 優先度 |
|------|------|--------|
| **デフォルトカテゴリ自動作成** | 新規ユーザー登録時に初期カテゴリを自動作成 | 中 |
| **タスク一括操作** | 複数タスクの一括完了・削除 | 低 |
| **完了タスクの折りたたみ** | 完了セクションをデフォルト非表示に | 低 |

### 中期（機能拡張）

| 機能 | 概要 |
|------|------|
| 繰り返しタスク | 毎日・毎週の繰り返し設定 |
| タスクのコピー | 既存タスクを複製して別日に作成 |
| 通知 | スケジュールタスクのリマインダー |
| データエクスポート | CSV / JSON エクスポート |
| Service Worker / オフライン | PWA 強化 |

### 長期（将来構想）

| 機能 | 概要 |
|------|------|
| チーム機能 | タスクの共有・アサイン |
| AI 提案 | タスク分解・優先度提案 |
| カレンダー連携 | Google Calendar との同期 |

---

## 12. 開発ルール（抜粋）

詳細は `CLAUDE.md` と `docs/coding-guidelines.md` を参照。

- **シンプルを優先**：不要な抽象化・ライブラリ追加をしない
- **サーバーコンポーネント優先**：Client Component は必要な場合のみ
- **セキュリティ最優先**：全クエリに userId フィルタ
- **コミットメッセージは日本語**（`feat:`, `fix:`, `refactor:`, `chore:` プレフィックス）
- **Prettier printWidth = 120**
- **ファイル 500 行以内** を目安に分割

---

## 13. 現在の積み残し・注意点

- `package.json` のバージョンは `0.1.0` のまま（CHANGELOG 未作成）
- Service Worker は未実装（manifest.json のみ）
- Supabase 停止防止の GitHub Actions は `.github/workflows/` に配置済み
- カレンダーページにはサイドバーなし（DateCell クリックで `/dates/[date]` に遷移）
- 検索結果は日付グループではなく `displayOrder` 順で表示（意図的な設計）

---

## 14. 次のセッションで相談したいこと

1. **繰り返しタスク**の実装方法（DB 設計・UI フロー）
2. **完了タスク折りたたみ**のデフォルト挙動設計
3. **CHANGELOG.md・バージョン管理**の運用ルール策定
4. **タスクのコピー機能**（別日への複製）

---

> このドキュメントは開発が進むたびに更新すること。
