import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を結合してTailwind CSSのクラスの競合を解決します。
 *
 * @param inputs - 結合するクラス名（文字列、配列、オブジェクト、条件付きなど）
 * @returns マージされたクラス名文字列
 *
 * @example
 * cn("text-sm", "font-bold") // => "text-sm font-bold"
 * cn("p-4", "p-8") // => "p-8" (後のクラスが優先)
 * cn("text-red-500", condition && "text-blue-500") // => 条件に応じて変わる
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
