"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Work } from "@/types/work";
import {
  extractVideoId,
  getThumbnailUrl,
  getThumbnailFallbackUrl,
} from "@/lib/youtube";
import { formatDate } from "@/lib/date";
import { useScrambleText } from "@/lib/useScrambleText";
import styles from "./WorkCard.module.css";

interface Props {
  work: Work;
  onClick: () => void;
}

export default function WorkCard({ work, onClick }: Props) {
  const videoId = extractVideoId(work.youtubeUrl);
  const [imgSrc, setImgSrc] = useState(
    videoId ? getThumbnailUrl(videoId) : ""
  );
  const dateSource = work.youtubePublishedAt ?? work.publishedAt;
  const [isHovered, setIsHovered] = useState(false);
  const scrambledTitle = useScrambleText(work.title ?? "", isHovered);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [titleMinHeight, setTitleMinHeight] = useState<number>();

  // スクランブルアニメーション中に歯抜け(空白)で一時的に行数が変わり、
  // タイトルの高さが縮んでガクつくのを防ぐため、素のタイトルの高さを
  // 下限として固定する(短い1行タイトルに余白が増えることはない)
  useLayoutEffect(() => {
    if (titleRef.current) setTitleMinHeight(titleRef.current.offsetHeight);
  }, [work.title]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={styles.card}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={work.title ? `${work.title} を再生` : "動画を再生"}
    >
      <div className={styles.thumbnail}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={work.title || ""}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
            className={styles.image}
            onError={() => {
              if (videoId) setImgSrc(getThumbnailFallbackUrl(videoId));
            }}
          />
        ) : (
          <div className={styles.noImage} />
        )}
        <div className={styles.playOverlay} aria-hidden="true">
          <Image
            src="/play.svg"
            alt=""
            width={32}
            height={32}
            className={styles.playIcon}
          />
        </div>
      </div>
      <div className={styles.info}>
        {work.title && (
          <p
            ref={titleRef}
            className={styles.title}
            style={{ minHeight: titleMinHeight }}
          >
            {scrambledTitle}
          </p>
        )}
        {dateSource && <p className={styles.date}>{formatDate(dateSource)}</p>}
      </div>
    </article>
  );
}
