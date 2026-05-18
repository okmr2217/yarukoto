"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { KEYWORD_DEBOUNCE_MS } from "@/lib/filter-types";

export function useDebouncedKeyword(keyword: string, updateSearchParams: (updates: Record<string, string | null>) => void) {
  const [localKeyword, setLocalKeyword] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    setLocalKeyword(keyword);
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const commitKeyword = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        updateSearchParams({ keyword: value || null });
      }, KEYWORD_DEBOUNCE_MS);
    },
    [updateSearchParams],
  );

  const handleKeywordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalKeyword(value);
      if (!isComposingRef.current) commitKeyword(value);
    },
    [commitKeyword],
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      commitKeyword(e.currentTarget.value);
    },
    [commitKeyword],
  );

  const handleKeywordClear = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setLocalKeyword("");
    updateSearchParams({ keyword: null });
  }, [updateSearchParams]);

  return {
    localKeyword,
    isComposingRef,
    handleKeywordChange,
    handleCompositionEnd,
    handleKeywordClear,
  };
}
