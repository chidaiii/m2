"use client";

import { useEffect, useRef } from "react";
import type { Work } from "@/types/work";
import { extractVideoId } from "@/lib/youtube";
import styles from "./VideoModal.module.css";

interface Props {
  work: Work;
  onClose: () => void;
}

export default function VideoModal({ work, onClose }: Props) {
  const videoId = extractVideoId(work.youtubeUrl);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // モーダル表示中はbodyのスクロールを止める
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // オーバーレイ自体（背景）をクリックした場合のみ閉じる
    if (e.target === overlayRef.current) onClose();
  };

  if (!videoId) return null;

  // autoplay=1: クリック時に自動再生
  // rel=0: 関連動画を同一チャンネルに限定
  // モーダルを閉じるとiframeがアンマウントされるため自動的に再生が停止する
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={work.title || "動画を再生"}
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
        <div className={styles.videoWrapper}>
          <iframe
            src={embedUrl}
            title={work.title || "動画"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={styles.iframe}
          />
        </div>
      </div>
    </div>
  );
}
