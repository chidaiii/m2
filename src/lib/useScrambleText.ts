import { useEffect, useState } from "react";

const STEP_MS = 80;
const DURATION_MS = 400;
/** フレームごとに動かす(シャッフル対象にする)文字の割合。残りは元の位置のまま固定する */
const ACTIVE_RATIO = 0.35;
/** 動かす文字のうち、一時的に空白へ抜け落ちる確率(歯抜け演出) */
const GAP_PROBABILITY = 0.18;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 文字の一部(ACTIVE_RATIO)だけをランダムに選んでシャッフル・歯抜けにし、
 * 残りは元の位置のまま固定することで、動きを抑えた落ち着いた見た目にする。
 */
function scrambleFrame(chars: string[]): string {
  const result = [...chars];
  const activeIndices = chars.reduce<number[]>((acc, c, i) => {
    if (c !== " " && Math.random() < ACTIVE_RATIO) acc.push(i);
    return acc;
  }, []);

  const shuffledValues = shuffle(activeIndices.map((i) => chars[i]));
  activeIndices.forEach((i, idx) => {
    result[i] = Math.random() < GAP_PROBABILITY ? " " : shuffledValues[idx];
  });

  return result.join("");
}

/**
 * ホバー中、文字をランダムに入れ替えるアニメーションを経て元のテキストに戻す。
 * (例: "works" → "orwsk" → "wkros" → "works")
 */
export function useScrambleText(text: string, active: boolean): string {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    setDisplay(text);
  }, [text]);

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      return;
    }

    const chars = [...text];
    const steps = Math.max(1, Math.round(DURATION_MS / STEP_MS));
    let step = 0;

    const id = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplay(text);
        clearInterval(id);
        return;
      }
      setDisplay(scrambleFrame(chars));
    }, STEP_MS);

    return () => clearInterval(id);
  }, [active, text]);

  return display;
}
