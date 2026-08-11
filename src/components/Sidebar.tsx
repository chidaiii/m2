"use client";

import { useState } from "react";
import Image from "next/image";
import { TAG_CATEGORIES } from "@/lib/tags";
import type { TagCategoryKey } from "@/lib/tags";
import type { SelectedTags } from "./GalleryShell";
import Tag from "./Tag";
import TypewriterTagline from "./TypewriterTagline";
import styles from "./Sidebar.module.css";

const TAGLINE_PHRASES = ["クオリティーの高いMVの保管庫", "m2=motion×music"];

interface Props {
  selectedTags: SelectedTags;
  onToggle: (category: TagCategoryKey, tag: string) => void;
}

export default function Sidebar({ selectedTags, onToggle }: Props) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(TAG_CATEGORIES.map(({ key }) => [key, true]))
  );

  const toggleCategory = (key: string) => {
    setOpenCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoBlock}>
        <Image src="/logo.svg" alt="m2 index" width={141} height={24} />
        <TypewriterTagline phrases={TAGLINE_PHRASES} className={styles.tagline} />
      </div>

      <div className={styles.filters}>
        {TAG_CATEGORIES.map(({ key, label, options }) => {
          const isOpen = openCategories[key];
          return (
            <div key={key} className={styles.category}>
              <button
                className={styles.categoryHeader}
                onClick={() => toggleCategory(key)}
                aria-expanded={isOpen}
              >
                <span className={styles.categoryLabel}>
                  <span>{label}</span>
                  <span className={styles.categoryCount}>{options.length}</span>
                </span>
                <Image
                  src={isOpen ? "/minus.svg" : "/plus.svg"}
                  alt={isOpen ? "閉じる" : "開く"}
                  width={12}
                  height={12}
                />
              </button>
              <div className={styles.rule} aria-hidden="true" />
              <div className={`${styles.tags}${isOpen ? "" : ` ${styles.tagsCollapsed}`}`}>
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
          );
        })}
      </div>

      <p className={styles.copyright}>©2026 m2 index.</p>
    </aside>
  );
}
