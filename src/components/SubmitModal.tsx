"use client";

import { useState } from "react";
import Image from "next/image";
import { extractVideoId, getThumbnailUrl, getThumbnailFallbackUrl } from "@/lib/youtube";
import { TAG_CATEGORIES } from "@/lib/tags";
import Modal from "./Modal";
import Tag from "./Tag";
import styles from "./SubmitModal.module.css";

interface Props {
  onClose: () => void;
}

type TagState = Record<string, string[]>;

const INITIAL_TAGS: TagState = { type: [], style: [], genre: [] };

export default function SubmitModal({ onClose }: Props) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagState>(INITIAL_TAGS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const videoId = extractVideoId(youtubeUrl);
  const isSubmitEnabled =
    !!videoId &&
    selectedTags.type.length > 0 &&
    selectedTags.style.length > 0 &&
    selectedTags.genre.length > 0;

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
    if (!isSubmitEnabled) {
      setSubmitAttempted(true);
      return;
    }

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
    <Modal onClose={onClose} ariaLabel="作品を投稿" className={styles.panel} disableOverlayClose>
      <div className={styles.panelInner}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logoRow}>
              <Image src="/logo-blue.svg" alt="" width={141} height={24} />
              <span className={styles.headerTo}>に</span>
            </div>
            <h2 className={styles.headerTitle}>掲載する</h2>
          </div>
          <div className={styles.headerDivider} aria-hidden="true" />
          <p className={styles.headerDescription}>
            掲載を希望される作品がございましたら、以下のフォームよりご推薦ください。自薦／他薦を問いません。いただいた掲載希望作品については、管理人の承認のもと掲載されます。掲載作品はYouTubeに投稿された公式MVを中心に取り扱っており、自主制作やcover作品などは基本的には対象としていません。
          </p>
          <div className={styles.headerAccentBar} aria-hidden="true" />
        </div>

        <form className={styles.body} onSubmit={handleSubmit} noValidate>
          <div className={styles.leftCol}>
            <div className={styles.field}>
              <p className={styles.fieldLabel}>MOVIE</p>
              <div className={styles.previewSection}>
                <p className={styles.previewLabel}>▪URL</p>
                <input
                  id="submit-url"
                  type="url"
                  className={`${styles.input}${urlError ? ` ${styles.inputError}` : ""}`}
                  placeholder="https://www.youtube.com/watch?v="
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    if (urlError) validateUrl(e.target.value);
                  }}
                  onBlur={(e) => validateUrl(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className={styles.previewSection}>
                <p className={styles.previewLabel}>▪preview</p>
                <div className={styles.preview}>
                  {videoId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getThumbnailUrl(videoId)}
                      alt=""
                      className={styles.previewThumb}
                      onError={(e) => {
                        e.currentTarget.src = getThumbnailFallbackUrl(videoId);
                      }}
                    />
                  ) : (
                    <div className={styles.previewEmpty}>
                      <Image
                        src="/logomark.svg"
                        alt=""
                        width={64}
                        height={64}
                        className={styles.previewEmptyIcon}
                        aria-hidden="true"
                      />
                      <p className={styles.previewEmptyText}>NOT FOUND</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.field}>
              <p className={`${styles.fieldLabel} ${styles.fieldLabelSm}`}>TAG</p>
              <div className={styles.tagGroups}>
                {TAG_CATEGORIES.map((category) => (
                  <div key={category.key} className={styles.tagGroup}>
                    <p className={styles.tagGroupLabel}>▪{category.label}</p>
                    <div className={styles.tagRow}>
                      {category.options.map((tag) => (
                        <Tag
                          key={tag}
                          label={tag}
                          isActive={(selectedTags[category.key] ?? []).includes(tag)}
                          onClick={() => toggleTag(category.key, tag)}
                          variant="on-accent"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {submitAttempted && !isSubmitEnabled && (
            <p className={styles.validationNote}>
              ※未入力の項目があるため送信できません。
            </p>
          )}
          <div
            className={styles.submitWrapper}
            data-invalid={!isSubmitEnabled || undefined}
          >
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "送信中..." : "送信する"}</span>
              <Image
                src="/icon-arrow-blue.svg"
                alt=""
                width={7}
                height={13}
                className={styles.submitArrow}
              />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
