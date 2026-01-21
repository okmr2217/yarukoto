/**
 * アプリケーション全体で使用される定数
 */

/**
 * タスク関連の定数
 */
export const TASK_CONSTANTS = {
  /** タスク名の最大文字数 */
  TITLE_MAX_LENGTH: 500,
  /** メモの最大文字数 */
  MEMO_MAX_LENGTH: 10000,
  /** スキップ理由の最大文字数 */
  SKIP_REASON_MAX_LENGTH: 1000,
} as const;

/**
 * カテゴリ関連の定数
 */
export const CATEGORY_CONSTANTS = {
  /** カテゴリ名の最大文字数 */
  NAME_MAX_LENGTH: 100,
} as const;

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
  // タスク関連
  TASK_FETCH_FAILED: "タスクの取得に失敗しました",
  TASK_CREATE_FAILED: "タスクの作成に失敗しました",
  TASK_UPDATE_FAILED: "タスクの更新に失敗しました",
  TASK_DELETE_FAILED: "タスクの削除に失敗しました",
  TASK_COMPLETE_FAILED: "タスクの完了に失敗しました",
  TASK_NOT_FOUND: "タスクが見つかりません",
  TASK_STATS_FAILED: "タスク統計の取得に失敗しました",

  // カテゴリ関連
  CATEGORY_FETCH_FAILED: "カテゴリの取得に失敗しました",
  CATEGORY_CREATE_FAILED: "カテゴリの作成に失敗しました",
  CATEGORY_UPDATE_FAILED: "カテゴリの更新に失敗しました",
  CATEGORY_DELETE_FAILED: "カテゴリの削除に失敗しました",
  CATEGORY_NOT_FOUND: "カテゴリが見つかりません",

  // 検索関連
  SEARCH_FAILED: "検索に失敗しました",

  // アカウント関連
  ACCOUNT_DELETE_FAILED: "アカウントの削除に失敗しました",

  // 入力検証関連
  VALIDATION_ERROR: "入力内容に誤りがあります",
} as const;

/**
 * React Queryのクエリキー
 */
export const QUERY_KEYS = {
  DATE_TASKS: ["dateTasks"] as const,
  SEARCH_TASKS: ["searchTasks"] as const,
  CATEGORIES: ["categories"] as const,
  MONTHLY_STATS: ["monthlyTaskStats"] as const,
  SETTINGS: ["settings"] as const,
} as const;
