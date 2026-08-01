"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Modal.module.css";

interface Props {
  onClose: () => void;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
  disableOverlayClose?: boolean;
}

export default function Modal({ onClose, ariaLabel, className, children, disableOverlayClose }: Props) {
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
    if (disableOverlayClose) return;
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label="閉じる"
        type="button"
      >
        <Image src="/icon-close.svg" alt="" width={96} height={96} draggable={false} />
      </button>
      <div className={`${styles.modal}${className ? ` ${className}` : ""}`}>
        {children}
      </div>
    </div>
  );
}
