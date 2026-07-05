/**
 * 右上に常設する「投稿」ボタン。
 *
 * page.tsx が Server Component のままでいられるよう、
 * モーダルの開閉 state はこの Client Component に閉じ込めている。
 */

"use client";

import { useState } from "react";
import SubmitModal from "./SubmitModal";
import styles from "./SubmitButton.module.css";

export default function SubmitButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={styles.button}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        + 投稿
      </button>
      {isOpen && <SubmitModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
