"use client";

import type { Work } from "@/types/work";
import { extractVideoId } from "@/lib/youtube";
import Modal from "./Modal";
import styles from "./VideoModal.module.css";

interface Props {
  work: Work;
  onClose: () => void;
}

export default function VideoModal({ work, onClose }: Props) {
  const videoId = extractVideoId(work.youtubeUrl);

  if (!videoId) return null;

  // autoplay=1: クリック時に自動再生
  // rel=0: 関連動画を同一チャンネルに限定
  // モーダルを閉じるとiframeがアンマウントされるため自動的に再生が停止する
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <Modal
      onClose={onClose}
      ariaLabel={work.title || "動画を再生"}
      className={styles.panel}
      disableOverlayClose
    >
      <div className={styles.videoWrapper}>
        <iframe
          src={embedUrl}
          title={work.title || "動画"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={styles.iframe}
        />
      </div>
    </Modal>
  );
}
