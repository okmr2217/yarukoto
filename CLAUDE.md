# Yarukoto

日毎の TODO を整理し、短期タスクを効率的に管理する Web アプリ。Next.js + TypeScript + Supabase。

---

<!-- ▼ プロジェクト固有（このプロジェクト専用の設定） ▼ -->

## Tech Stack

- **Framework**: Next.js 15（App Router）
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **DB / ORM**: Supabase PostgreSQL + Prisma 6
- **認証**: Better Auth
- **状態管理**: TanStack React Query 5
- **バリデーション**: Zod 4
- **ホスティング**: Vercel

## コマンド

```bash
npm run dev
npm run build
npm run lint
# typecheck は tsc --noEmit（tsconfig.json を確認）
```

## コーディングルール

- TypeScript strict mode。`any` 禁止
- Zod スキーマから型を推論する（型の重複定義禁止）
- DB アクセスはサーバーのみ（Client から Prisma を呼ばない）
- すべてのクエリに `userId` フィルタを必ず含める
- ファイル 500 行以内を目安に分割
- Prettier printWidth = 140
- 詳細は @docs/coding-guidelines.md を参照

## プロダクト前提

- ホームは「今日のタスク」が中心
- `scheduledAt` は PostgreSQL の `DATE` 型（JST 基準、`dateUtils.ts` で統一処理）
- `displayOrder` は Float 型（新規タスクは最小値 - 1.0、並び替えは中間値）
- タスクステータス: `PENDING` / `COMPLETED` / `SKIPPED`
- 優先度: `HIGH` / `MEDIUM` / `LOW` / `null`（なし）

## やらないこと

- 不要な抽象化・ライブラリ追加
- コードコメント・docstring の追加（変更していないコードへ）
- エラーハンドリングの過剰追加（起こりえないケースへの対処）
- リファクタリング・整理（明示的に依頼されていない場合）

---

<!-- ▼ 汎用ルール（他プロジェクトでも同じ） ▼ -->

## Git ワークフロー

- コミットメッセージは日本語: `feat: ○○を実装` / `fix: ○○を修正`
- プレフィックス: `feat:` / `fix:` / `refactor:` / `chore:` / `docs:` / `test:` / `style:`
- 1 つの論理的変更 = 1 コミット
- コミット前に typecheck && lint を実行
