import React from "react";

const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;
const MAX_URL_DISPLAY_LENGTH = 50;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateUrl(url: string): string {
  if (url.length > MAX_URL_DISPLAY_LENGTH) {
    return url.slice(0, MAX_URL_DISPLAY_LENGTH) + "…";
  }
  return url;
}

/**
 * テキスト中のURLを<a>タグに変換したReact要素の配列を返す。
 * HTMLインジェクション対策として、テキストはエスケープ済み。
 */
export function linkifyText(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_PATTERN.lastIndex = 0;
  while ((match = URL_PATTERN.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;

    if (start > lastIndex) {
      result.push(escapeHtml(text.slice(lastIndex, start)));
    }

    result.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 break-all hover:opacity-80"
        onClick={(e) => e.stopPropagation()}
      >
        {truncateUrl(url)}
      </a>,
    );

    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    result.push(escapeHtml(text.slice(lastIndex)));
  }

  return result;
}

interface LinkTextProps {
  text: string;
  className?: string;
}

/** URLを自動リンク化してテキストを表示するコンポーネント */
export function LinkText({ text, className }: LinkTextProps) {
  return <span className={className}>{linkifyText(text)}</span>;
}
