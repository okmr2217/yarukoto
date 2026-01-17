# コーディングガイドライン

このドキュメントは、Yarukotoプロジェクトのコーディング方針をまとめたものです。
新規コードの追加や既存コードの修正時は、このガイドラインに従ってください。

## 目次

1. [ファイル構成](#ファイル構成)
2. [型定義](#型定義)
3. [定数管理](#定数管理)
4. [コンポーネント設計](#コンポーネント設計)
5. [Server Actions](#server-actions)
6. [ドキュメンテーション](#ドキュメンテーション)
7. [エラーハンドリング](#エラーハンドリング)

---

## ファイル構成

### ファイルサイズの目安

- **単一ファイルは500行以内を目安**とする
- 500行を超える場合は、責務に応じて分割を検討する

### 分割の原則

**良い例: Server Actionsの分割**

```
src/actions/task/
├── task-queries.ts      # データ取得系（getTodayTasks, getTasksByDate等）
├── task-mutations.ts    # データ更新系（createTask, updateTask等）
└── index.ts            # バレルエクスポート
```

**理由**:

- クエリとミューテーションで責務が明確
- ファイルを開いたときに目的がすぐ分かる
- 関連する機能がまとまっている

### ヘルパー関数の配置

**Server Actionsファイル内の非async関数は別ファイルに**

```typescript
// ❌ 悪い例: "use server" ファイル内の非async関数
// src/actions/task/task-helpers.ts
"use server";

export function toTask(task: PrismaTask) {
  // ← asyncではないのでビルドエラー
  return {
    /* ... */
  };
}
```

```typescript
// ✅ 良い例: libディレクトリに配置
// src/lib/task-helpers.ts
export function toTask(task: PrismaTask) {
  return {
    /* ... */
  };
}
```

**理由**: Next.jsの制約で、`"use server"`ディレクティブを含むファイル内のすべてのエクスポート関数は`async`である必要がある。

---

## 型定義

### 型の一元管理

**Zodスキーマから型を推論**

```typescript
// ✅ 良い例: バリデーションスキーマで型を定義
// src/lib/validations/task.ts
export const createTaskSchema = z.object({
  title: z.string().min(1),
  scheduledAt: z.string().optional(),
  // ...
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

```typescript
// ❌ 悪い例: 型を重複定義
// src/hooks/use-task-mutations.ts
export interface CreateTaskInput {
  // ← validationsと重複
  title: string;
  scheduledAt?: string;
}
```

**理由**:

- バリデーションロジックと型定義が同期される
- 修正時の変更箇所が1箇所で済む
- 型の不整合を防げる

### 型のインポート元

| 型の種類                              | インポート元                |
| ------------------------------------- | --------------------------- |
| APIレスポンス型（Task, TodayTasks等） | `@/types`                   |
| API入力型（CreateTaskInput等）        | `@/lib/validations`         |
| Prisma型                              | `@/generated/prisma/client` |
| コンポーネントprops型                 | 同じファイル内で定義        |

---

## 定数管理

### 定数の配置

**すべてのマジックナンバー・文字列は定数化**

```typescript
// ✅ 良い例: 定数ファイルで一元管理
// src/lib/constants.ts
export const TASK_CONSTANTS = {
  TITLE_MAX_LENGTH: 500,
  MEMO_MAX_LENGTH: 10000,
} as const;

export const ERROR_MESSAGES = {
  TASK_CREATE_FAILED: "タスクの作成に失敗しました",
  TASK_NOT_FOUND: "タスクが見つかりません",
} as const;
```

```typescript
// バリデーションで使用
export const createTaskSchema = z.object({
  title: z
    .string()
    .max(
      TASK_CONSTANTS.TITLE_MAX_LENGTH,
      `タスク名は${TASK_CONSTANTS.TITLE_MAX_LENGTH}文字以内で入力してください`,
    ),
});
```

```typescript
// エラーメッセージで使用
return failure(ERROR_MESSAGES.TASK_CREATE_FAILED, "INTERNAL_ERROR");
```

**理由**:

- 値の意味が明確になる
- 変更時の修正箇所が1箇所で済む
- タイポを防げる

### 定数の種類

`src/lib/constants.ts`で管理する定数:

1. **制約値**: 文字数制限、数値制限等
2. **エラーメッセージ**: ユーザー向けエラー文言
3. **クエリキー**: React Queryのキー
4. **固定値**: アプリケーション全体で使用する定数

---

## コンポーネント設計

### Props設計の原則

**関連するコールバックはオブジェクトにまとめる**

```typescript
// ✅ 良い例: ハンドラーをオブジェクト化
export interface TaskCardHandlers {
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
}

interface TaskCardProps {
  task: Task;
  handlers: TaskCardHandlers;
  showScheduledDate?: boolean;
}
```

```typescript
// ❌ 悪い例: 個別のprops
interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  showScheduledDate?: boolean;
}
```

**理由**:

- propsの数が減り、可読性が向上
- 親コンポーネントでハンドラーをまとめて定義できる
- 将来的なハンドラー追加が容易

**使用例**:

```typescript
// 親コンポーネント
const taskHandlers: TaskCardHandlers = {
  onComplete: handleComplete,
  onUncomplete: handleUncomplete,
  onEdit: handleEdit,
  onSkip: handleSkip,
  onDelete: handleDelete,
};

return <TaskCard task={task} handlers={taskHandlers} />;
```

### Propsへのコメント

**すべてのpropsに説明を追加**

```typescript
interface TaskSectionProps {
  /** セクションタイトル */
  title: string;
  /** 表示するタスクリスト */
  tasks: Task[];
  /** デフォルトで折りたたむか */
  defaultCollapsed?: boolean;
  /** タスク操作のハンドラー群 */
  handlers: TaskCardHandlers;
}
```

**理由**: IDEのインテリセンスで説明が表示され、使い方が明確になる

---

## Server Actions

### ファイル構成

```typescript
// src/actions/[domain]/[domain]-queries.ts
"use server";

import { ERROR_MESSAGES } from "@/lib/constants";
import { toModel } from "@/lib/[domain]-helpers";

/**
 * [機能の説明]
 *
 * @param input - [パラメータの説明]
 * @returns [戻り値の説明]
 *
 * @remarks
 * - [重要な注意事項]
 */
export async function getData(
  input: GetDataInput,
): Promise<ActionResult<Data>> {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    // 処理...

    return success(data);
  } catch (error) {
    console.error("getData error:", error);
    return failure(ERROR_MESSAGES.FETCH_FAILED, "INTERNAL_ERROR");
  }
}
```

### エラーハンドリングパターン

```typescript
// ✅ 標準パターン
try {
  // 1. バリデーション
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
  }

  // 2. 認証チェック
  const user = await getRequiredUser();

  // 3. 権限チェック
  const existing = await prisma.model.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return failure(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND");
  }

  // 4. 処理実行
  const result = await prisma.model.create({
    /* ... */
  });

  return success({ data: toModel(result) });
} catch (error) {
  console.error("actionName error:", error);
  return failure(ERROR_MESSAGES.ACTION_FAILED, "INTERNAL_ERROR");
}
```

---

## ドキュメンテーション

### JSDocの記述ルール

**すべてのエクスポート関数にJSDocを追加**

```typescript
/**
 * 今日のタスクを取得します。
 *
 * @returns 今日のタスク情報（遅延、今日、未設定、完了、スキップの各グループ）
 *
 * @remarks
 * - 遅延: 今日より前に予定されていて、まだ未完了のタスク
 * - 今日: 今日予定されていて、未完了のタスク
 * - 未設定: 予定日が設定されていない未完了のタスク
 * - 完了: 今日完了したタスク
 * - スキップ: 今日スキップしたタスク
 *
 * すべての日付処理はJST（日本標準時）基準で行われます。
 */
export async function getTodayTasks(): Promise<ActionResult<TodayTasks>> {
  // ...
}
```

### コメントの使い分け

| 用途           | 形式               | 例                                           |
| -------------- | ------------------ | -------------------------------------------- |
| 関数の説明     | JSDoc              | `/** 関数の説明 */`                          |
| パラメータ説明 | JSDoc `@param`     | `@param input - パラメータの説明`            |
| 戻り値説明     | JSDoc `@returns`   | `@returns 戻り値の説明`                      |
| 補足情報       | JSDoc `@remarks`   | `@remarks 重要な注意事項`                    |
| 使用例         | JSDoc `@example`   | `@example cn("text-sm", "font-bold")`        |
| 実装の説明     | インラインコメント | `// scheduledAtはDATE型なので完全一致で比較` |

---

## エラーハンドリング

### エラーメッセージの管理

**すべてのエラーメッセージは定数化**

```typescript
// src/lib/constants.ts
export const ERROR_MESSAGES = {
  // タスク関連
  TASK_FETCH_FAILED: "タスクの取得に失敗しました",
  TASK_CREATE_FAILED: "タスクの作成に失敗しました",
  TASK_NOT_FOUND: "タスクが見つかりません",

  // カテゴリ関連
  CATEGORY_NOT_FOUND: "カテゴリが見つかりません",

  // 共通
  VALIDATION_ERROR: "入力内容に誤りがあります",
} as const;
```

### Result型パターン

**すべてのServer Actionsは`ActionResult<T>`を返す**

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };

// 成功時
return success({ task: toTask(result) });

// 失敗時
return failure(ERROR_MESSAGES.TASK_CREATE_FAILED, "INTERNAL_ERROR");
```

---

## 命名規則

### ファイル名

| 種類           | 形式       | 例                |
| -------------- | ---------- | ----------------- |
| コンポーネント | kebab-case | `task-card.tsx`   |
| Server Actions | kebab-case | `task-queries.ts` |
| フック         | kebab-case | `use-tasks.ts`    |
| ユーティリティ | kebab-case | `date-utils.ts`   |
| 型定義         | kebab-case | `task.ts`         |

### 変数・関数名

| 種類             | 形式                  | 例                     |
| ---------------- | --------------------- | ---------------------- |
| コンポーネント   | PascalCase            | `TaskCard`             |
| 関数             | camelCase             | `getTodayTasks`        |
| フック           | camelCase (use始まり) | `useTasks`             |
| 定数             | UPPER_SNAKE_CASE      | `TASK_CONSTANTS`       |
| 型               | PascalCase            | `Task`, `ActionResult` |
| インターフェース | PascalCase            | `TaskCardProps`        |

---

## チェックリスト

新しいコードを追加する前に、以下を確認してください:

### 全般

- [ ] ファイルサイズは500行以内か？
- [ ] 適切なディレクトリに配置されているか？

### 型定義

- [ ] 既存の型と重複していないか？
- [ ] Zodスキーマから型を推論しているか？
- [ ] 適切な場所からインポートしているか？

### 定数

- [ ] マジックナンバー・文字列を定数化したか？
- [ ] `src/lib/constants.ts`に追加したか？
- [ ] 定数名は意味が明確か？

### コンポーネント

- [ ] 関連するpropsはオブジェクトにまとめたか？
- [ ] すべてのpropsにコメントを追加したか？
- [ ] 適切な粒度に分割されているか？

### Server Actions

- [ ] JSDocコメントを追加したか？
- [ ] エラーハンドリングは適切か？
- [ ] エラーメッセージは定数化されているか？
- [ ] Result型パターンを使用しているか？

### ドキュメント

- [ ] 関数の説明を追加したか？
- [ ] パラメータと戻り値を説明したか？
- [ ] 重要な注意事項を`@remarks`に記載したか？

---

## 参考リンク

- [要件定義書](./requirements.md)
- [API設計書](./api-design.md)
- [画面設計書](./screen-design.md)
