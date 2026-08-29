"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TAG_CATEGORIES } from "@/lib/tags";
import type { TagCategoryKey } from "@/lib/tags";
import { TAGLINE_PHRASES } from "@/lib/tagline";
import type { SelectedTags } from "./GalleryShell";
import Tag from "./Tag";
import TypewriterTagline from "./TypewriterTagline";
import styles from "./Sidebar.module.css";

interface Props {
  selectedTags: SelectedTags;
  onToggle: (category: TagCategoryKey, tag: string) => void;
}

export default function Sidebar({ selectedTags, onToggle }: Props) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // SP: メニュー表示中はEscキーで閉じられるようにし、背景のスクロールを止める
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      <button
        className={styles.filterButton}
        onClick={() => setIsMobileOpen((prev) => !prev)}
        aria-label={isMobileOpen ? "フィルターを閉じる" : "フィルターを開く"}
        aria-expanded={isMobileOpen}
        type="button"
      >
        <Image
          src={isMobileOpen ? "/close.svg" : "/Filter.svg"}
          alt=""
          width={24}
          height={24}
        />
      </button>

      <div
        className={`${styles.mobileOverlay}${isMobileOpen ? ` ${styles.mobileOpen}` : ""}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar}${isMobileOpen ? ` ${styles.mobileOpen}` : ""}`}
        aria-label="フィルター"
      >
        <div className={styles.logoBlock}>
          <Image src="/logo.svg" alt="m2 index" width={155} height={26} />
          <TypewriterTagline phrases={TAGLINE_PHRASES} className={styles.tagline} />
        </div>

        <div className={styles.filters}>
          {TAG_CATEGORIES.map(({ key, label, options }) => (
            <div key={key} className={styles.category}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryLabel}>
                  <span>{label}</span>
                  <span className={styles.categoryCount}>{options.length}</span>
                </span>
              </div>
              <div className={styles.rule} aria-hidden="true" />
              <div className={styles.tags}>
                {options.map((tag) => (
                  <Tag
                    key={tag}
                    label={tag}
                    isActive={selectedTags[key].includes(tag)}
                    onClick={() => onToggle(key, tag)}
                    variant="on-dark"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className={styles.copyright}>©2026 m2 index.</p>
      </aside>
    </>
  );
}
