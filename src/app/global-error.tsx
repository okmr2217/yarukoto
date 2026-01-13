"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#fafafa",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              color: "#ef4444",
              margin: "0 0 0.5rem 0",
            }}
          >
            Error
          </h1>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "#171717",
              margin: "0 0 0.5rem 0",
            }}
          >
            エラーが発生しました
          </h2>
          <p
            style={{
              color: "#737373",
              margin: "0 0 1.5rem 0",
            }}
          >
            予期しない問題が発生しました。
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#f97316",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
