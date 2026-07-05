"use client";

import { useEffect, useRef, useState } from "react";
import { extractVideoId } from "@/lib/youtube";
import { TAG_CATEGORIES } from "@/lib/tags";
import styles from "./SubmitModal.module.css";

interface Props {
  onClose: () => void;
}

type TagState = Record<string, string[]>;

const INITIAL_TAGS: TagState = { type: [], style: [], genre: [] };

export default function SubmitModal({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagState>(INITIAL_TAGS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const toggleTag = (category: string, tag: string) => {
    setSelectedTags((prev) => {
      const current = prev[category] ?? [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, [category]: next };
    });
  };

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError("YouTube URL を入力してください");
      return false;
    }
    if (!extractVideoId(value)) {
      setUrlError("正しい YouTube URL を入力してください");
      return false;
    }
    setUrlError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(youtubeUrl)) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          type: selectedTags.type,
          style: selectedTags.style,
          genre: selectedTags.genre,
        }),
      });
    } catch {
      // エラー・成功いずれの場合もフォームを閉じる（仕様）
    } finally {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="作品を投稿"
    >
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="閉じる"
          type="button"
        >
          ×
        </button>

        <h2 className={styles.title}>作品を投稿</h2>
        <p className={styles.description}>
          審査後に公開されます。タイトルは管理者が設定します。
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* YouTube URL */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="submit-url">
              YouTube URL <span className={styles.required}>*</span>
            </label>
            <input
              id="submit-url"
              type="url"
              className={`${styles.input}${urlError ? ` ${styles.inputError}` : ""}`}
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                if (urlError) validateUrl(e.target.value);
              }}
              onBlur={(e) => validateUrl(e.target.value)}
              autoComplete="off"
            />
            {urlError && (
              <p className={styles.errorText} role="alert">
                {urlError}
              </p>
            )}
          </div>

          {/* タグ選択（tags.ts を単一ソースとして参照） */}
          {TAG_CATEGORIES.map((category) => (
            <div key={category.key} className={styles.field}>
              <p className={styles.label}>{category.label}</p>
              <div className={styles.tagRow}>
                {category.options.map((tag) => {
                  const isActive = (selectedTags[category.key] ?? []).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagBtn}${isActive ? ` ${styles.tagBtnActive}` : ""}`}
                      onClick={() => toggleTag(category.key, tag)}
                      aria-pressed={isActive}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "送信中..." : "投稿する"}
          </button>
        </form>
      </div>
    </div>
  );
}
