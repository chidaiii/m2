"use client";

import { useEffect, useState } from "react";
import styles from "./TypewriterTagline.module.css";

interface Props {
  phrases: string[];
  className?: string;
}

const TYPE_SPEED_MS = 70;
const DELETE_SPEED_MS = 35;
const HOLD_MS = 2800;
const PAUSE_MS = 300;

type Phase = "typing" | "holding" | "deleting" | "pausing";

/**
 * フレーズを一定間隔でタイプライター風に切り替えて表示する。
 * 装飾的なアニメーションのため、視覚的な表示は aria-hidden にし、
 * スクリーンリーダー向けには全フレーズをまとめた静的テキストを別途用意する。
 */
export default function TypewriterTagline({ phrases, className }: Props) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    if (phase === "typing") {
      if (text.length < currentPhrase.length) {
        const timer = setTimeout(
          () => setText(currentPhrase.slice(0, text.length + 1)),
          TYPE_SPEED_MS
        );
        return () => clearTimeout(timer);
      }
      setPhase("holding");
      return;
    }

    if (phase === "holding") {
      const timer = setTimeout(() => setPhase("deleting"), HOLD_MS);
      return () => clearTimeout(timer);
    }

    if (phase === "deleting") {
      if (text.length > 0) {
        const timer = setTimeout(
          () => setText(currentPhrase.slice(0, text.length - 1)),
          DELETE_SPEED_MS
        );
        return () => clearTimeout(timer);
      }
      setPhase("pausing");
      return;
    }

    // phase === "pausing"
    const timer = setTimeout(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      setPhase("typing");
    }, PAUSE_MS);
    return () => clearTimeout(timer);
  }, [phase, text, phraseIndex, phrases]);

  return (
    <p className={className}>
      <span aria-hidden="true">
        {text}
        <span className={styles.cursor} />
      </span>
      <span className={styles.srOnly}>{phrases.join(" / ")}</span>
    </p>
  );
}
