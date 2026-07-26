/**
 * 右上に常設する投稿ボタン。
 *
 * page.tsx が Server Component のままでいられるよう、
 * モーダルの開閉 state はこの Client Component に閉じ込めている。
 */

"use client";

import { useState } from "react";
import Image from "next/image";
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
        <span>掲載する</span>
        <Image src="/icon-arrow.svg" alt="" width={7} height={13} />
      </button>
      {isOpen && <SubmitModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
