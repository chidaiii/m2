/**
 * 右上に常設する投稿ボタン。
 *
 * page.tsx が Server Component のままでいられるよう、
 * モーダルの開閉 state はこの Client Component に閉じ込めている。
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SubmitModal from "./SubmitModal";
import styles from "./SubmitButton.module.css";

export default function SubmitButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHiddenByScroll, setIsHiddenByScroll] = useState(false);
  const lastScrollY = useRef(0);

  // SP: 下スクロールで隠し、上スクロールで再表示する(ページ最上部付近では常に表示)
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      setIsHiddenByScroll(scrollingDown && currentScrollY > 80);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        className={`${styles.wrapper}${isHiddenByScroll ? ` ${styles.hidden}` : ""}`}
      >
        <button
          className={styles.button}
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span>掲載する</span>
          <span className={styles.arrowWrap}>
            <Image src="/icon-arrow.svg" alt="" width={8} height={16} className={styles.arrowDefault} />
            <Image src="/icon-arrow-blue.svg" alt="" width={8} height={16} className={styles.arrowBlue} />
          </span>
        </button>
      </div>
      {isOpen && <SubmitModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
