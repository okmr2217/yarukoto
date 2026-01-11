# Yarukoto - Claude Code Context

## Project Overview

Yarukoto（やること）は、日毎のTODOを整理し、短期タスクを効率的に管理するWebアプリケーション。
「今日やること」を中心としたシンプルなタスク管理を提供する。

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Auth**: Better Auth
- **Hosting**: Vercel

## Documentation

### [docs/requirements.md](docs/requirements.md)
要件定義書。プロダクト概要、機能要件、非機能要件を定義。
- タスクの属性（タスク名、予定日、ステータス、優先度、カテゴリ等）
- タスク操作（作成、編集、完了、やらない、削除）
- 日付別タスク表示ルール（今日、過去、未来）
- カテゴリ管理、ユーザー認証、検索機能

### [docs/api-design.md](docs/api-design.md)
API設計書。Server Actionsの仕様を定義。
- 設計方針: Server Actions優先、楽観的更新、Result型パターン
- タスク関連Actions: getTodayTasks, getTasksByDate, createTask, updateTask, completeTask等
- カテゴリ関連Actions: getCategories, createCategory, updateCategory, deleteCategory
- ユーザー設定関連Actions: getUserSettings, updateUserSettings, changeEmail等
- 型定義: Task, Category, UserSettings, ActionResult

### [docs/screen-design.md](docs/screen-design.md)
画面設計書。UIデザインとインタラクションを定義。
- デザイン方針: カード型・モダン、オレンジをプライマリカラー
- 共通コンポーネント: ヘッダー、日付ナビゲーション、タスクカード、タスク入力欄
- 画面一覧: ログイン、ホーム、日付別タスク、タスク編集モーダル、カテゴリ管理、検索、設定
- インタラクション: スワイプ操作、タスク作成/完了フロー
- レスポンシブ対応: モバイルファースト設計

## Key Patterns

### Result型パターン
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };
```

### タスクステータス
- `PENDING`: 未完了
- `COMPLETED`: 完了
- `SKIPPED`: やらない

### 優先度
- `HIGH` / `MEDIUM` / `LOW` / `null`（なし）
